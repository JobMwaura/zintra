'use client';

import { useState, useCallback } from 'react';

/**
 * useOTP Hook - Manage OTP sending and verification
 * 
 * Handles:
 * - Sending OTP via API
 * - Verifying OTP codes
 * - State management
 * - Error handling
 * - Retry logic
 */
export function useOTP() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [otpId, setOtpId] = useState(null);
  const [expiresIn, setExpiresIn] = useState(600);

  /**
   * Send OTP to phone or email
   */
  const sendOTP = useCallback(async (phoneNumber, channel = 'sms', type = 'registration') => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: channel === 'sms' ? phoneNumber : undefined,
          email: channel === 'email' ? phoneNumber : undefined,
          channel,
          type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send OTP');
      }

      setOtpId(data.otpId);
      setExpiresIn(data.expiresIn || 600);
      setSuccess(true);

      return {
        success: true,
        otpId: data.otpId,
        expiresIn: data.expiresIn,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.';
      setError(errorMessage);
      setSuccess(false);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verify OTP code
   */
  const verifyOTP = useCallback(async (code, identifier) => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return {
        success: false,
        error: 'Invalid OTP format',
      };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otpId: identifier || otpId,
          otpCode: code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP. Please try again.');
      }

      setSuccess(true);
      setError(null);

      return {
        success: true,
        verified: data.verified,
        userId: data.userId,
        message: data.message,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OTP verification failed. Please try again.';
      setError(errorMessage);
      setSuccess(false);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [otpId]);

  /**
   * Resend OTP
   */
  const resendOTP = useCallback(async (phoneNumber, channel = 'sms', type = 'registration') => {
    setLoading(true);
    setError(null);

    try {
      return await sendOTP(phoneNumber, channel, type);
    } finally {
      setLoading(false);
    }
  }, [sendOTP]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    setOtpId(null);
    setExpiresIn(600);
  }, []);

  return {
    // State
    loading,
    error,
    success,
    otpId,
    expiresIn,

    // Methods
    sendOTP,
    verifyOTP,
    resendOTP,
    reset,
  };
}

export default useOTP;
