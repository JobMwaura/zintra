/**
 * PesaPal Payment Client
 * Handles all PesaPal API interactions for subscription payments
 * 
 * Usage:
 * const result = await pesapalClient.initiatePayment({...});
 */

import crypto from 'crypto';

const PESAPAL_API = process.env.NEXT_PUBLIC_PESAPAL_API_URL || 
                    'https://sandbox.pesapal.com/api/v3';

const CONSUMER_KEY = process.env.NEXT_PUBLIC_PESAPAL_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

class PesaPalClient {
  constructor() {
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      console.warn('⚠️ PesaPal credentials not configured. Check environment variables.');
    }
    this.apiUrl = PESAPAL_API;
    this.consumerKey = CONSUMER_KEY;
    this.consumerSecret = CONSUMER_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Generate OAuth signature for PesaPal authentication
   * @param {Object} params - Parameters to sign
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @returns {string} Base64 encoded signature
   */
  generateSignature(params, method = 'GET') {
    const signatureString = Object.keys(params)
      .sort()
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const signature = crypto
      .createHmac('sha256', this.consumerSecret)
      .update(signatureString)
      .digest('base64');
    
    return signature;
  }

  /**
   * Get OAuth Bearer Token (valid for 5 minutes)
   * Token is cached and automatically refreshed when expired
   * 
   * @returns {Promise<string>} Access token
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    try {
      const timestamp = new Date().toISOString();
      const params = {
        consumer_key: this.consumerKey,
        consumer_secret: this.consumerSecret,
        timestamp: timestamp,
      };

      const signature = this.generateSignature(params);

      console.log('🔐 Requesting PesaPal access token...');

      const response = await fetch(`${this.apiUrl}/api/auth/request/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consumer_key: this.consumerKey,
          consumer_secret: this.consumerSecret,
          timestamp: timestamp,
          signature: signature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get access token: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.token;
      this.tokenExpiry = Date.now() + ((data.expiresIn || 300) * 1000);

      console.log('✅ PesaPal access token obtained (expires in', data.expiresIn || 300, 'seconds)');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Error getting PesaPal token:', error.message);
      throw error;
    }
  }

  /**
   * Initiate a payment order
   * This creates an order in PesaPal and returns the checkout URL
   * 
   * @param {Object} orderData - Order details
   * @param {string} orderData.vendor_id - Vendor UUID
   * @param {string} orderData.user_id - User UUID
   * @param {string} orderData.plan_id - Subscription plan UUID
   * @param {string} orderData.plan_name - Plan name (e.g., "Professional")
   * @param {number} orderData.amount - Amount in KES
   * @param {string} orderData.phone_number - Customer phone number
   * @param {string} orderData.email - Customer email
   * @param {string} orderData.description - Order description
   * 
   * @returns {Promise<Object>} { success, order_id, iframe_url, redirect_url, error }
   */
  async initiatePayment(orderData) {
    const {
      vendor_id,
      user_id,
      plan_id,
      plan_name,
      amount,
      phone_number,
      email,
      description = 'Subscription Payment',
    } = orderData;

    try {
      // Validate required fields
      if (!vendor_id || !user_id || !plan_id || !amount || !email) {
        throw new Error('Missing required order fields');
      }

      const token = await this.getAccessToken();

      // Prepare order payload
      const payload = {
        id: `sub_${vendor_id.substring(0, 8)}_${Date.now()}`,
        amount: parseFloat(amount),
        currency: 'KES',
        description: description,
        callback_url: process.env.PESAPAL_WEBHOOK_URL || 'https://yoursite.com/api/webhooks/pesapal',
        notification_id: 'webhook',
        metadata: {
          vendor_id,
          user_id,
          plan_id,
          plan_name,
          phone_number,
          email,
          timestamp: new Date().toISOString(),
        },
        billing_details: {
          email_address: email,
          phone_number: phone_number || '254700000000',
          first_name: email.split('@')[0],
          last_name: plan_name,
          country_code: 'KE',
        },
      };

      console.log('💳 Initiating PesaPal payment:', {
        id: payload.id,
        amount: payload.amount,
        currency: payload.currency,
      });

      const response = await fetch(`${this.apiUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PesaPal API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      console.log('✅ Payment order created:', data.id);

      return {
        success: true,
        order_id: data.id,
        iframe_url: data.redirect_url,
        redirect_url: data.redirect_url,
      };
    } catch (error) {
      console.error('❌ Error initiating payment:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get the current status of a payment order
   * 
   * @param {string} orderId - PesaPal order ID
   * @returns {Promise<Object>} { success, status, order_id, amount, currency, error }
   */
  async getPaymentStatus(orderId) {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const token = await this.getAccessToken();

      console.log('🔍 Checking payment status for order:', orderId);

      const response = await fetch(
        `${this.apiUrl}/orders/${orderId}/status`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get payment status: ${response.statusText}`);
      }

      const data = await response.json();

      console.log('✅ Payment status retrieved:', {
        orderId: data.id,
        status: data.payment_status,
      });

      return {
        success: true,
        status: data.payment_status,
        order_id: data.id,
        amount: data.amount,
        currency: data.currency,
      };
    } catch (error) {
      console.error('❌ Error getting payment status:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate webhook signature from PesaPal
   * This ensures the webhook actually came from PesaPal
   * 
   * @param {string} signature - Signature from webhook header
   * @param {Object} payload - Webhook payload body
   * @returns {boolean} True if signature is valid
   */
  validateWebhookSignature(signature, payload) {
    try {
      const payloadString = JSON.stringify(payload);
      const generatedSignature = crypto
        .createHmac('sha256', this.consumerSecret)
        .update(payloadString)
        .digest('base64');

      const isValid = signature === generatedSignature;

      if (isValid) {
        console.log('✅ Webhook signature validated');
      } else {
        console.error('❌ Invalid webhook signature');
      }

      return isValid;
    } catch (error) {
      console.error('❌ Error validating webhook signature:', error.message);
      return false;
    }
  }

  /**
   * Format currency for display
   * @param {number} amount - Amount in basic units
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  }
}

// Export singleton instance
export const pesapalClient = new PesaPalClient();
export default pesapalClient;
