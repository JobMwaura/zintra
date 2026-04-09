import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

/**
 * POST /api/admin/send-suspension-email
 * Sends suspension notification email to vendor
 */
export async function POST(request) {
  try {
    const { vendorId, reason } = await request.json();

    if (!vendorId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: vendorId, reason' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, business_name, user_id')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Get vendor user email using supabase admin API
    const { data: { user: vendorUser }, error: authErr } = await supabase.auth.admin.getUserById(vendor.user_id);

    if (authErr || !vendorUser?.email) {
      return NextResponse.json(
        { error: 'Vendor email not found' },
        { status: 404 }
      );
    }

    // Send suspension email (integrate with your email service)
    const emailResponse = await sendSuspensionEmail({
      email: vendorUser.email,
      businessName: vendor.business_name,
      reason: reason,
      vendorId: vendorId
    });

    if (!emailResponse.success) {
      console.error('Email sending failed:', emailResponse.error);
      // Don't fail the API call if email fails - suspension was still created
    }

    return NextResponse.json({
      success: true,
      message: 'Suspension email sent successfully',
      email: vendorUser.email
    });
  } catch (error) {
    console.error('Error sending suspension email:', error);
    return NextResponse.json(
      { error: 'Failed to send suspension email: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper function to send email (integrate with your email provider)
 * This is a template - modify to use SendGrid, AWS SES, Resend, etc.
 */
async function sendSuspensionEmail({ email, businessName, reason, vendorId }) {
  try {
    // Template for suspension email
    const emailContent = `
      <h1>Account Suspension Notice</h1>
      <p>Dear ${businessName},</p>
      <p>Your vendor account on our platform has been suspended due to policy violations.</p>
      
      <h2>Reason for Suspension:</h2>
      <p>${reason}</p>
      
      <h2>What This Means:</h2>
      <ul>
        <li>You will not be able to log into your account</li>
        <li>Your listings may be hidden from the platform</li>
        <li>You will have 30 days to resolve the issue</li>
      </ul>
      
      <h2>What You Can Do:</h2>
      <p>If you believe this suspension was made in error, you can submit an appeal by:</p>
      <ol>
        <li>Attempting to log in to your account</li>
        <li>You will see the suspension notice with details</li>
        <li>Click the "Submit Appeal" button</li>
        <li>Provide your explanation and any supporting documents</li>
      </ol>
      
      <h2>Appeal Process:</h2>
      <p>Our moderation team will review your appeal within 5 business days. We will send you an email with our decision.</p>
      
      <p>If you have any questions, please contact our support team at support@platform.com</p>
      
      <p>Best regards,<br/>The Moderation Team</p>
    `;

    // Integration example with Resend (modify based on your email provider)
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     from: 'noreply@platform.com',
    //     to: email,
    //     subject: 'Account Suspension Notice',
    //     html: emailContent
    //   })
    // });

    // For now, log to console for testing
    console.log('Email would be sent to:', email);
    console.log('Subject: Account Suspension Notice');
    console.log('Content:', emailContent);

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}
