'use client';

import { useState } from 'react';
import { Loader, Send, AlertCircle, CheckCircle } from 'lucide-react';

export default function DebugEmailOTP() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);

  const handleSendEmailOTP = async () => {
    if (!email.trim()) {
      setMessage('Please enter an email address');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setDebugInfo(null);

    try {
      console.log('🔍 Sending email OTP to:', email);
      
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          method: 'email',
          purpose: 'debugging',
        }),
      });

      const data = await response.json();

      console.log('📨 API Response:', response.status, data);

      setDebugInfo({
        status: response.status,
        ok: response.ok,
        response: data,
        timestamp: new Date().toISOString()
      });

      if (response.ok) {
        setMessage('✅ Email OTP sent successfully!');
        setMessageType('success');
      } else {
        setMessage(`❌ Failed: ${data.error || 'Unknown error'}`);
        setMessageType('error');
      }
    } catch (err) {
      console.error('🚨 Email OTP Error:', err);
      setMessage(`💥 Network Error: ${err.message}`);
      setMessageType('error');
      setDebugInfo({
        error: err.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 Email OTP Debug Tool</h1>
          <p className="text-gray-600">Test email delivery for troubleshooting</p>
        </div>

        {/* Email Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address to Test
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            disabled={loading}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendEmailOTP}
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center space-x-2 mb-6"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          <span>{loading ? 'Sending...' : 'Send Test Email OTP'}</span>
        </button>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 flex items-center space-x-3 ${
            messageType === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Debug Information */}
        {debugInfo && (
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">🔧 Debug Information</h3>
            <div className="space-y-2 text-sm font-mono">
              <div>
                <span className="font-medium text-gray-600">Status:</span>{' '}
                <span className={debugInfo.status === 200 ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.status}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">OK:</span>{' '}
                <span className={debugInfo.ok ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.ok ? 'true' : 'false'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Timestamp:</span>{' '}
                <span className="text-gray-800">{debugInfo.timestamp}</span>
              </div>
              {debugInfo.response && (
                <div>
                  <span className="font-medium text-gray-600">Response:</span>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(debugInfo.response, null, 2)}
                  </pre>
                </div>
              )}
              {debugInfo.error && (
                <div>
                  <span className="font-medium text-red-600">Error:</span>
                  <pre className="mt-2 p-2 bg-red-100 rounded text-xs">
                    {debugInfo.error}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Testing Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Enter your email address above</li>
            <li>• Click "Send Test Email OTP"</li>
            <li>• Check your email inbox and spam folder</li>
            <li>• Check the debug information for any errors</li>
            <li>• Note the EventsGear SMTP status</li>
          </ul>
        </div>
      </div>
    </div>
  );
}