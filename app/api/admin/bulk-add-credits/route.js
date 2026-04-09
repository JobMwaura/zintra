import { createClient } from '@/lib/supabase/server';
import { addCreditsToVendor } from '@/app/actions/vendor-zcc';

export async function POST(request) {
  try {
    const supabase = await createClient();

    // Verify this is an admin action (in production, add proper auth)
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.includes('admin')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Get all vendors
    const { data: vendors, error: fetchError } = await supabase
      .from('vendors')
      .select('id, user_id, company_name, name, email')
      .order('created_at', { ascending: false });

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch vendors: ' + fetchError.message }),
        { status: 500 }
      );
    }

    if (!vendors || vendors.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No vendors found', count: 0 }),
        { status: 200 }
      );
    }

    // Add credits to each vendor
    const results = {
      total: vendors.length,
      success: [],
      failed: [],
    };

    for (const vendor of vendors) {
      try {
        const result = await addCreditsToVendor(vendor.id, 1000);
        
        if (result.success) {
          results.success.push({
            vendorId: vendor.id,
            vendorName: vendor.company_name || vendor.name,
            credits: 1000,
            paymentId: result.paymentId,
          });
        } else {
          results.failed.push({
            vendorId: vendor.id,
            vendorName: vendor.company_name || vendor.name,
            error: result.error,
          });
        }
      } catch (err) {
        results.failed.push({
          vendorId: vendor.id,
          vendorName: vendor.company_name || vendor.name,
          error: err.message,
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return new Response(
      JSON.stringify({
        message: 'Bulk credit distribution completed',
        results,
        summary: {
          totalVendors: results.total,
          successfullyProcessed: results.success.length,
          failed: results.failed.length,
          totalCreditsDistributed: results.success.length * 1000,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
