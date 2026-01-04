/**
 * Payment Service - Client-side wrapper for PesaPal API
 * 
 * This module safely wraps the payment API routes
 * All crypto operations are handled server-side
 */

/**
 * Initiate a payment order
 * @param {Object} params - Payment details
 * @returns {Promise<Object>} - { success, order_id, iframe_url, redirect_url } or { success: false, error }
 */
export async function initiatePesaPalPayment(params) {
  try {
    console.log('💳 Initiating PesaPal payment...');
    
    const response = await fetch('/api/payments/pesapal/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Payment initiation failed:', data.error);
      return { 
        success: false, 
        error: data.error || `HTTP ${response.status}` 
      };
    }

    console.log('✅ Payment order created:', data.order_id);
    return data;

  } catch (error) {
    console.error('❌ Payment API error:', error.message);
    return { 
      success: false, 
      error: error.message || 'Failed to initiate payment' 
    };
  }
}

/**
 * Generate a unique order ID
 */
export function generateOrderId(vendorId) {
  return `order_${vendorId}_${Date.now()}`;
}
