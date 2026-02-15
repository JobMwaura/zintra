/**
 * ============================================================================
 * SMS NOTIFICATION SERVICE
 * ============================================================================
 * General-purpose SMS sending via TextSMS Kenya /sendsms/ endpoint.
 * This is separate from the OTP service which uses /sendotp/.
 * 
 * Use this for:
 * - Quote acceptance notifications
 * - Job assignment alerts
 * - General platform notifications
 * 
 * NOT for OTP/verification — use otpService.ts for that.
 * ============================================================================
 */

/**
 * Normalize a Kenyan phone number to 254XXXXXXXXX format (no + prefix)
 * @param {string} phoneNumber - Phone number in any format
 * @returns {string|null} Normalized phone number or null if invalid
 */
function normalizePhone(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== 'string') return null;

  let cleaned = phoneNumber.replace(/[\s\-()]/g, '').trim();

  // Remove + prefix if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // Convert 0-prefix to 254
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '254' + cleaned.slice(1);
  }

  // Validate: must be 254 followed by 9 digits
  if (/^254\d{9}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

/**
 * Send a general SMS notification via TextSMS Kenya
 * Uses the /sendsms/ endpoint (not /sendotp/)
 * 
 * @param {string} phoneNumber - Recipient phone number (any Kenyan format)
 * @param {string} message - SMS message body (max ~160 chars for single SMS)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendSMS(phoneNumber, message) {
  try {
    if (!phoneNumber || !message) {
      return { success: false, error: 'Phone number and message are required' };
    }

    const normalizedPhone = normalizePhone(phoneNumber);
    if (!normalizedPhone) {
      console.error(`[SMS] Invalid phone number format: "${phoneNumber}"`);
      return { success: false, error: 'Invalid phone number format' };
    }

    // Get TextSMS Kenya credentials
    const apiKey = process.env.TEXTSMS_API_KEY;
    const partnerId = process.env.TEXTSMS_PARTNER_ID;
    const shortcode = process.env.TEXTSMS_SHORTCODE;

    if (!apiKey || !partnerId || !shortcode) {
      console.error('[SMS] TextSMS Kenya credentials not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    const payload = {
      apikey: apiKey,
      partnerID: partnerId,
      mobile: normalizedPhone,
      message: message,
      shortcode: shortcode,
    };

    console.log('[SMS] Sending notification SMS:', {
      phone: normalizedPhone,
      messageLength: message.length,
      messagePreview: message.substring(0, 60) + '...',
    });

    const response = await fetch(
      'https://sms.textsms.co.ke/api/services/sendsms/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Zintra/1.0',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SMS] HTTP error:', response.status, errorText);
      return {
        success: false,
        error: `SMS API returned ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('[SMS] Response:', JSON.stringify(data, null, 2));

    // Parse response — TextSMS Kenya can return different formats
    let isSuccess = false;
    let messageId = '';
    let errorMessage = 'Failed to send SMS';

    if (data.success !== undefined) {
      isSuccess = data.success;
      errorMessage = data.message || errorMessage;
      messageId = data.messageId || '';
    } else if (data.responses && Array.isArray(data.responses) && data.responses.length > 0) {
      const first = data.responses[0];
      const code = first['response-code'] || first['response_code'];
      isSuccess = code === 200 || code === '200';
      errorMessage = first['response-description'] || first['response_description'] || errorMessage;
      messageId = first['messageid'] || first['messageId'] || '';
    } else if (data.code !== undefined) {
      isSuccess = data.code === '200' || data.code === 200 || data.code === '201';
      errorMessage = data.message || errorMessage;
    }

    if (isSuccess) {
      console.log('[SMS] ✅ SMS sent successfully to', normalizedPhone);
      return {
        success: true,
        messageId: messageId || 'sms_' + Date.now(),
      };
    } else {
      console.error('[SMS] ❌ SMS failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[SMS] Exception:', msg);
    return { success: false, error: 'SMS Error: ' + msg };
  }
}

/**
 * Send a quote acceptance SMS to the buyer
 * @param {string} phoneNumber - Buyer's phone number
 * @param {string} rfqTitle - Title of the RFQ
 * @param {string} vendorName - Name of the vendor whose quote was accepted
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendQuoteAcceptedSMS(phoneNumber, rfqTitle, vendorName) {
  const message = `Hi! Your quote request "${rfqTitle}" on Zintra has been matched. ${vendorName} is ready to work with you. Login to zintra.co.ke to begin engagement.`;
  return sendSMS(phoneNumber, message);
}

/**
 * Send a notification SMS to the vendor when their quote is accepted
 * @param {string} phoneNumber - Vendor's phone number
 * @param {string} rfqTitle - Title of the RFQ
 * @param {string} buyerName - Name of the buyer
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendVendorQuoteAcceptedSMS(phoneNumber, rfqTitle, buyerName) {
  const message = `Congratulations! Your quote for "${rfqTitle}" on Zintra has been accepted by ${buyerName}. Login to zintra.co.ke to view buyer contact details and begin the project.`;
  return sendSMS(phoneNumber, message);
}
