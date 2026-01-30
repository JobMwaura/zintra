/**
 * M-Pesa Payment Integration Service
 * Handles M-Pesa STK Push, callback processing, and transaction management
 */

/**
 * Initiate M-Pesa STK Push for credit purchase
 * 
 * @param {string} phoneNumber - Customer phone number (format: 254XXXXXXXXX)
 * @param {number} amount - Amount in KES
 * @param {string} description - Transaction description
 * @param {string} userId - Zintra user ID
 * @returns {Promise<{success: boolean, checkoutRequestId?: string, error?: string}>}
 */
export async function initiateMpesaPayment(phoneNumber, amount, description, userId) {
  try {
    const response = await fetch('/api/payments/mpesa/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        amount,
        description,
        userId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to initiate M-Pesa payment',
      };
    }

    return {
      success: true,
      checkoutRequestId: data.checkoutRequestId,
      merchantRequestId: data.merchantRequestId,
    };
  } catch (error) {
    console.error('Error initiating M-Pesa payment:', error);
    return {
      success: false,
      error: 'Network error initiating payment',
    };
  }
}

/**
 * Query M-Pesa transaction status
 */
export async function checkMpesaStatus(checkoutRequestId) {
  try {
    const response = await fetch('/api/payments/mpesa/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkoutRequestId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to check status',
      };
    }

    return {
      success: true,
      status: data.status,
      resultCode: data.resultCode,
      resultDesc: data.resultDesc,
    };
  } catch (error) {
    console.error('Error checking M-Pesa status:', error);
    return {
      success: false,
      error: 'Network error checking status',
    };
  }
}

/**
 * Format phone number to M-Pesa format (254XXXXXXXXX)
 */
export function formatPhoneForMpesa(phoneNumber) {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // Handle different input formats
  if (cleaned.startsWith('0')) {
    // Local format: 0XXXXXXXXX -> 254XXXXXXXXX
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('254')) {
    // Already in correct format
    return cleaned;
  } else if (cleaned.length === 9) {
    // Without country code: XXXXXXXXX -> 254XXXXXXXXX
    cleaned = '254' + cleaned;
  }

  // Validate length (should be 12 digits: 254 + 9 digits)
  if (cleaned.length !== 12 || !cleaned.startsWith('254')) {
    return null;
  }

  return cleaned;
}

/**
 * Validate phone number
 */
export function isValidMpesaPhone(phoneNumber) {
  const formatted = formatPhoneForMpesa(phoneNumber);
  return formatted !== null && formatted.length === 12;
}

/**
 * Handle M-Pesa payment callback
 * This function should be called from the API route
 */
export async function processMpesaCallback(callbackData, supabase) {
  try {
    const { Body } = callbackData;
    const { stkCallback } = Body;

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // Result codes:
    // 0 = Success
    // 1032 = Request cancelled by user
    // Other = Error

    if (ResultCode === 0) {
      // Extract payment details
      let amount = null;
      let mpesaReceiptNumber = null;
      let transactionDate = null;
      let phoneNumber = null;

      if (CallbackMetadata && CallbackMetadata.Item) {
        CallbackMetadata.Item.forEach((item) => {
          switch (item.Name) {
            case 'Amount':
              amount = item.Value;
              break;
            case 'MpesaReceiptNumber':
              mpesaReceiptNumber = item.Value;
              break;
            case 'TransactionDate':
              transactionDate = item.Value;
              break;
            case 'PhoneNumber':
              phoneNumber = item.Value;
              break;
          }
        });
      }

      // Find and update transaction in database
      const { data: transaction, error: fetchError } = await supabase
        .from('credit_transactions')
        .select('user_id, amount, id')
        .eq('mpesa_request_id', CheckoutRequestID)
        .single();

      if (fetchError) {
        console.error('Transaction not found:', fetchError);
        return { success: false, error: 'Transaction not found' };
      }

      // Update transaction status to completed
      const { error: updateError } = await supabase
        .from('credit_transactions')
        .update({
          status: 'completed',
          mpesa_transaction_id: mpesaReceiptNumber,
          mpesa_response_code: ResultCode,
          mpesa_response_desc: ResultDesc,
          completed_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
        return { success: false, error: 'Failed to update transaction' };
      }

      // Calculate credits to add
      // This depends on your pricing model
      // For now, assume 1 KES = 1 credit
      const creditsToAdd = transaction.amount;

      // Add credits to user account
      const { error: creditsError } = await supabase
        .rpc('add_user_credits', {
          p_user_id: transaction.user_id,
          p_amount: creditsToAdd,
          p_transaction_type: 'purchase',
          p_payment_method: 'mpesa',
          p_mpesa_transaction_id: mpesaReceiptNumber,
          p_description: `M-Pesa credit purchase - Ref: ${mpesaReceiptNumber}`,
        });

      if (creditsError) {
        console.error('Error adding credits:', creditsError);
        // Transaction completed but credits not added - this is critical
        // Consider implementing retry logic here
        return { success: false, error: 'Payment received but credits not added' };
      }

      return {
        success: true,
        message: 'Payment processed successfully',
        amount: amount,
        receipt: mpesaReceiptNumber,
      };
    } else if (ResultCode === 1032) {
      // User cancelled - mark as cancelled
      const { error } = await supabase
        .from('credit_transactions')
        .update({
          status: 'cancelled',
          mpesa_response_code: ResultCode,
          mpesa_response_desc: 'User cancelled the transaction',
        })
        .eq('mpesa_request_id', CheckoutRequestID);

      return {
        success: false,
        message: 'User cancelled the payment',
        code: ResultCode,
      };
    } else {
      // Other error
      const { error } = await supabase
        .from('credit_transactions')
        .update({
          status: 'failed',
          mpesa_response_code: ResultCode,
          mpesa_response_desc: ResultDesc,
        })
        .eq('mpesa_request_id', CheckoutRequestID);

      return {
        success: false,
        message: ResultDesc || 'Payment failed',
        code: ResultCode,
      };
    }
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    return {
      success: false,
      error: 'Error processing callback',
    };
  }
}

/**
 * Get M-Pesa transaction history for a user
 */
export async function getMpesaTransactions(supabase, userId, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('payment_method', 'mpesa')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching M-Pesa transactions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getMpesaTransactions:', error);
    return [];
  }
}

/**
 * Retry failed M-Pesa payment
 */
export async function retryMpesaPayment(transactionId) {
  try {
    const response = await fetch('/api/payments/mpesa/retry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to retry payment',
      };
    }

    return {
      success: true,
      checkoutRequestId: data.checkoutRequestId,
    };
  } catch (error) {
    console.error('Error retrying M-Pesa payment:', error);
    return {
      success: false,
      error: 'Network error retrying payment',
    };
  }
}
