// Quick script to add credits to vendor
// Run this in browser console or as part of admin panel

const vendorId = '0608c7a8-bfa5-4c73-8354-365502ed387d';
const creditAmount = 2000;

async function addCreditsViaServerAction() {
  try {
    // Dynamic import of the server action
    const { addCreditsToVendor } = await import('@/app/actions/vendor-zcc');
    
    console.log(`Adding ${creditAmount} credits to vendor ${vendorId}...`);
    
    const result = await addCreditsToVendor(vendorId, creditAmount);
    
    if (result.success) {
      console.log('✅ SUCCESS:', result.message);
      console.log('Payment ID:', result.paymentId);
      console.log('Credits Added:', result.creditsAdded);
    } else {
      console.error('❌ FAILED:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Call the function
addCreditsViaServerAction();
