import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendQuoteAcceptedSMS, sendVendorQuoteAcceptedSMS } from '@/lib/services/smsService';

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * POST /api/quote/accept
 * 
 * Accept a vendor quote (update status to 'accepted')
 * Uses service role to bypass RLS restrictions
 * 
 * Request body:
 * {
 *   quoteId: string (UUID of the quote to accept)
 *   rfqId: string (UUID of the RFQ - for verification)
 *   userId: string (UUID of the user accepting - for verification)
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { quoteId, rfqId, userId } = body;

    console.log('API: Accept Quote called with:', { quoteId, rfqId, userId });

    // Validate required fields
    if (!quoteId || !rfqId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: quoteId, rfqId, userId' },
        { status: 400 }
      );
    }

    // STEP 1: Verify the RFQ exists and belongs to the user
    const { data: rfq, error: rfqError } = await supabaseAdmin
      .from('rfqs')
      .select('id, user_id, title')
      .eq('id', rfqId)
      .single();

    console.log('API: RFQ verification:', { rfq, rfqError });

    if (rfqError || !rfq) {
      return NextResponse.json(
        { error: 'RFQ not found' },
        { status: 404 }
      );
    }

    // Verify the user is the RFQ creator
    if (rfq.user_id !== userId) {
      console.log('API: User mismatch - rfq.user_id:', rfq.user_id, 'userId:', userId);
      return NextResponse.json(
        { error: 'Only the RFQ creator can accept quotes' },
        { status: 403 }
      );
    }

    // STEP 2: Verify the quote exists and belongs to this RFQ
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('rfq_responses')
      .select('id, rfq_id, vendor_id, status')
      .eq('id', quoteId)
      .single();

    console.log('API: Quote verification:', { quote, quoteError });

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    if (quote.rfq_id !== rfqId) {
      return NextResponse.json(
        { error: 'Quote does not belong to this RFQ' },
        { status: 400 }
      );
    }

    // STEP 3: Update the quote status to 'accepted'
    const { data: updatedQuote, error: updateError } = await supabaseAdmin
      .from('rfq_responses')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select()
      .single();

    console.log('API: Update result:', { updatedQuote, updateError });

    if (updateError) {
      console.error('API: Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update quote status: ' + updateError.message },
        { status: 500 }
      );
    }

    // STEP 4: Optionally update the RFQ status
    await supabaseAdmin
      .from('rfqs')
      .update({ 
        status: 'assigned',
        assigned_vendor_id: quote.vendor_id,
        assigned_at: new Date().toISOString()
      })
      .eq('id', rfqId);

    // =========================================================================
    // STEP 5: Fetch buyer and vendor profiles for notifications & contact reveal
    // =========================================================================
    let buyerProfile = null;
    let vendorProfile = null;

    try {
      // Fetch buyer profile (the RFQ creator)
      const { data: buyer } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, phone, phone_number, phone_verified')
        .eq('id', userId)
        .maybeSingle();
      buyerProfile = buyer;

      // Fetch vendor profile
      const { data: vendor } = await supabaseAdmin
        .from('vendors')
        .select('id, user_id, company_name, contact_email, contact_phone, phone_number, phone')
        .eq('id', quote.vendor_id)
        .maybeSingle();
      vendorProfile = vendor;

      // If vendor found, also get their user profile for phone/email
      if (vendor?.user_id) {
        const { data: vendorUser } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email, phone, phone_number, phone_verified')
          .eq('id', vendor.user_id)
          .maybeSingle();
        if (vendorUser) {
          vendorProfile = {
            ...vendorProfile,
            user_full_name: vendorUser.full_name,
            user_email: vendorUser.email,
            user_phone: vendorUser.phone_number || vendorUser.phone,
          };
        }
      }
    } catch (profileErr) {
      console.error('API: Error fetching profiles:', profileErr);
      // Don't fail — profiles are for notifications, not core logic
    }

    const buyerName = buyerProfile?.full_name || 'Buyer';
    const vendorName = vendorProfile?.company_name || 'Vendor';
    const buyerPhone = buyerProfile?.phone_number || buyerProfile?.phone || null;
    const vendorPhone = vendorProfile?.contact_phone || vendorProfile?.phone_number || vendorProfile?.phone || vendorProfile?.user_phone || null;

    // =========================================================================
    // STEP 6: Send in-app notification to VENDOR — quote accepted + buyer contact
    // =========================================================================
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: vendorProfile?.user_id || quote.vendor_id,
        type: 'quote_accepted',
        title: '🎉 Your Quote Was Accepted!',
        body: `${buyerName} accepted your quote for "${rfq.title}". You can now view their contact details and begin the project.`,
        related_type: 'rfq',
        related_id: rfqId,
        metadata: {
          rfq_id: rfqId,
          rfq_title: rfq.title,
          quote_id: quoteId,
          buyer_name: buyerName,
          buyer_email: buyerProfile?.email || null,
          buyer_phone: buyerPhone,
          accepted_at: new Date().toISOString(),
        }
      });
      console.log('API: Vendor notification sent');
    } catch (notifErr) {
      console.error('API: Failed to send vendor notification:', notifErr);
    }

    // =========================================================================
    // STEP 7: Send in-app notification to BUYER — confirmation
    // =========================================================================
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        type: 'quote_accepted_confirmation',
        title: 'Quote Accepted Successfully',
        body: `You accepted ${vendorName}'s quote for "${rfq.title}". The vendor has been notified and will contact you soon.`,
        related_type: 'rfq',
        related_id: rfqId,
        metadata: {
          rfq_id: rfqId,
          rfq_title: rfq.title,
          quote_id: quoteId,
          vendor_name: vendorName,
          vendor_id: quote.vendor_id,
          accepted_at: new Date().toISOString(),
        }
      });
      console.log('API: Buyer notification sent');
    } catch (notifErr) {
      console.error('API: Failed to send buyer notification:', notifErr);
    }

    // =========================================================================
    // STEP 8: Send SMS to BUYER — quote accepted notification
    // =========================================================================
    try {
      if (buyerPhone) {
        const smsResult = await sendQuoteAcceptedSMS(buyerPhone, rfq.title, vendorName);
        console.log('API: Buyer SMS result:', smsResult);
      } else {
        console.log('API: No buyer phone number — skipping SMS');
      }
    } catch (smsErr) {
      console.error('API: Failed to send buyer SMS:', smsErr);
    }

    // =========================================================================
    // STEP 9: Send SMS to VENDOR — their quote was accepted
    // =========================================================================
    try {
      if (vendorPhone) {
        const smsResult = await sendVendorQuoteAcceptedSMS(vendorPhone, rfq.title, buyerName);
        console.log('API: Vendor SMS result:', smsResult);
      } else {
        console.log('API: No vendor phone number — skipping SMS');
      }
    } catch (smsErr) {
      console.error('API: Failed to send vendor SMS:', smsErr);
    }

    console.log('API: Quote accepted successfully with notifications');

    // Return success with contact data for immediate display
    return NextResponse.json({
      success: true,
      message: 'Quote accepted successfully',
      quote: updatedQuote,
      // Include buyer contact for vendor-side usage (contact reveal)
      buyerContact: {
        name: buyerProfile?.full_name || null,
        email: buyerProfile?.email || null,
        phone: buyerPhone,
      },
      // Include vendor contact for buyer-side usage
      vendorContact: {
        name: vendorProfile?.company_name || null,
        email: vendorProfile?.contact_email || vendorProfile?.user_email || null,
        phone: vendorPhone,
      }
    });

  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quote/reject
 * 
 * Reject a vendor quote (update status to 'rejected')
 */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { quoteId, rfqId, userId } = body;

    console.log('API: Reject Quote called with:', { quoteId, rfqId, userId });

    if (!quoteId || !rfqId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify RFQ ownership
    const { data: rfq, error: rfqError } = await supabaseAdmin
      .from('rfqs')
      .select('id, user_id, title')
      .eq('id', rfqId)
      .single();

    if (rfqError || !rfq || rfq.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update quote status to rejected
    const { data: updatedQuote, error: updateError } = await supabaseAdmin
      .from('rfq_responses')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to reject quote' },
        { status: 500 }
      );
    }

    // ── Notify vendor their quote was rejected (in-app) ──
    try {
      const vendorId = updatedQuote.vendor_id;
      if (vendorId) {
        // Get buyer name for notification context
        const { data: buyerProfile } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .single();

        const buyerName = buyerProfile?.full_name || 'The buyer';

        await supabaseAdmin.from('notifications').insert({
          user_id: vendorId,
          type: 'quote_rejected',
          title: 'Quote Not Selected',
          body: `${buyerName} has chosen a different vendor for "${rfq.title}". Don't worry — more opportunities are available on the platform.`,
          related_type: 'rfq',
          related_id: rfqId,
          metadata: {
            rfq_id: rfqId,
            rfq_title: rfq.title,
            quote_id: quoteId,
            rejected_at: new Date().toISOString(),
          }
        });
        console.log('API: Vendor rejection notification sent');
      }
    } catch (notifErr) {
      console.error('API: Failed to send vendor rejection notification:', notifErr);
      // Non-blocking — don't fail the rejection
    }

    return NextResponse.json({
      success: true,
      message: 'Quote rejected',
      quote: updatedQuote
    });

  } catch (error) {
    console.error('API: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
