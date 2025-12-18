'use client';

import React, { useState, useEffect } from 'react';
import OTPInput from './OTPInput';
import { X, Send, RotateCcw } from 'lucide-react';

/**
 * OTPModal Component - Complete OTP verification modal
 * 
 * Features:
 * - Timer display (10 min expiry)
 * - Attempt counter (3 max)
 * - Resend button (60 sec cooldown)
 * - Loading state
 * - Error handling
 * - Success state
 */
export default function OTPModal({
  isOpen = false,
  onClose = () => {},
  onSubmit = async () => {},
  channel = 'sms',
  recipient = '',
  title = 'Verify OTP',
  description = 'Enter the 6-digit code sent to your',
  loading = false,
  error = null,
  success = false,
  maxAttempts = 3,
  expirySeconds = 600,
  onResend = async () => {},
}) {
  const [otp, setOtp] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(expirySeconds);
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Timer for OTP expiry
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      return;
    }

    if (attempts >= maxAttempts) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(otp);
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setOtp('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resendCooldown > 0) return;

    setCanResend(false);
    setResendCooldown(60);
    setOtp('');
    setAttempts(0);
    setTimeLeft(expirySeconds);

    try {
      await onResend();
    } catch (err) {
      console.error('Resend failed:', err);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeft === 0;
  const remainingAttempts = maxAttempts - attempts;
  const isDisabled = isExpired || remainingAttempts === 0 || otp.length !== 6;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {description} {channel === 'sms' ? 'phone number' : 'email'}:
              <br />
              <span className="font-semibold">{recipient}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Timer and attempts info */}
          <div className="flex justify-between items-center">
            <div className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
              {isExpired ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                  OTP Expired
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  Expires in {formatTime(timeLeft)}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {remainingAttempts > 0 ? (
                <span>{remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} left</span>
              ) : (
                <span className="text-red-600 font-medium">No attempts left</span>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <div className="text-red-600 mt-0.5 flex-shrink-0">⚠️</div>
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2">
              <div className="text-green-600 mt-0.5 flex-shrink-0">✓</div>
              <div className="text-sm text-green-800">Verified successfully!</div>
            </div>
          )}

          {/* OTP Input */}
          <OTPInput
            value={otp}
            onChange={setOtp}
            disabled={submitting || isExpired || success}
            error={!!error && attempts > 0}
            errorMessage={attempts > 0 && attempts < maxAttempts ? `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` : ''}
          />

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isDisabled || submitting || success}
            className={`w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
              isDisabled || submitting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-300 border-t-white rounded-full animate-spin"></div>
                Verifying...
              </>
            ) : success ? (
              <>
                <span>✓</span> Verified
              </>
            ) : (
              <>
                <Send size={18} /> Verify OTP
              </>
            )}
          </button>

          {/* Resend button */}
          <button
            onClick={handleResend}
            disabled={!canResend || resendCooldown > 0 || isExpired || success}
            className={`w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 border-2 ${
              !canResend || resendCooldown > 0 || isExpired || success
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:border-gray-400 active:scale-95'
            }`}
          >
            <RotateCcw size={18} />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
          </button>
        </div>

        {/* Footer help text */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg text-center text-xs text-gray-600">
          Didn't receive the code? Check your{' '}
          <span className="font-semibold">{channel === 'sms' ? 'SMS/Messages' : 'inbox'}</span> or try
          resending.
        </div>
      </div>
    </div>
  );
}
