'use client';

import React, { useState, useEffect } from 'react';
import { getCreditPackages } from '@/lib/credits-helpers';
import { initiateMpesaPayment, formatPhoneForMpesa } from '@/lib/payments/mpesa-service';
import { useRouter } from 'next/navigation';

/**
 * Buy Credits Modal/Page
 * Displays credit packages and handles purchases
 */
export default function BuyCreditsModal({ userId, userType, onClose }) {
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await getCreditPackages(userType);
        setPackages(data);
        if (data.length > 0) {
          setSelectedPackage(data[0]);
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userType) {
      fetchPackages();
    }
  }, [userType]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setPaymentError('');

    if (!selectedPackage) {
      setPaymentError('Please select a package');
      return;
    }

    if (!phoneNumber) {
      setPaymentError('Please enter your phone number');
      return;
    }

    // Format and validate phone
    const formattedPhone = formatPhoneForMpesa(phoneNumber);
    if (!formattedPhone) {
      setPaymentError('Invalid phone number. Please use format: 0712345678');
      return;
    }

    setProcessingPayment(true);

    try {
      const result = await initiateMpesaPayment(
        formattedPhone,
        selectedPackage.price_ksh,
        `Zintra credit purchase: ${selectedPackage.credit_amount} credits`,
        userId
      );

      if (result.success) {
        setPaymentSuccess(true);
        // Show success message
        setTimeout(() => {
          if (onClose) {
            onClose();
          } else {
            router.push('/credits/success');
          }
        }, 2000);
      } else {
        setPaymentError(result.error || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError('An error occurred. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
          <p className="mt-4 text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Buy Credits</h2>

      {/* Package Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Package</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                selectedPackage?.id === pkg.id
                  ? 'border-orange-600 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{pkg.package_name}</h4>
                  <p className="text-sm text-gray-600">{pkg.description}</p>
                </div>
                {pkg.discount_percentage > 0 && (
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                    Save {pkg.discount_percentage}%
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-orange-600">
                  {pkg.credit_amount}
                </p>
                <p className="text-sm text-gray-600 mb-1">credits</p>
                <p className="text-lg font-semibold text-gray-900">
                  KES {new Intl.NumberFormat('en-KE').format(pkg.price_ksh)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      {selectedPackage && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Package</span>
              <span className="font-semibold">{selectedPackage.package_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Credits</span>
              <span className="font-semibold">{selectedPackage.credit_amount}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-900 font-semibold">Amount to Pay</span>
              <span className="text-2xl font-bold text-orange-600">
                KES {new Intl.NumberFormat('en-KE').format(selectedPackage.price_ksh)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Form */}
      <form onSubmit={handlePayment} className="space-y-4">
        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Phone Number (M-Pesa)
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="0712345678"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={processingPayment}
            required
          />
          <p className="text-xs text-gray-600 mt-1">
            Enter your M-Pesa phone number (format: 0712345678 or 254712345678)
          </p>
        </div>

        {/* Promo Code */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Promo Code (Optional)
          </label>
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Enter promo code"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={processingPayment}
          />
        </div>

        {/* Error Message */}
        {paymentError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {paymentError}
          </div>
        )}

        {/* Success Message */}
        {paymentSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            ✓ Payment initiated! Please complete the M-Pesa prompt on your phone.
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={processingPayment || !selectedPackage}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
        >
          {processingPayment ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Processing...
            </span>
          ) : (
            `Pay KES ${new Intl.NumberFormat('en-KE').format(selectedPackage?.price_ksh || 0)}`
          )}
        </button>
      </form>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>How it works:</strong> After clicking "Pay", you'll receive an M-Pesa prompt
          on your phone. Enter your M-Pesa PIN to complete the payment. Credits are added
          instantly.
        </p>
      </div>
    </div>
  );
}
