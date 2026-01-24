'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { 
  ArrowLeft, 
  CheckCircle, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign,
  FileText,
  MessageCircle,
  Send,
  Clock
} from 'lucide-react';

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id;

  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState(null);
  const [rfq, setRfq] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssignmentDetails();
  }, [quoteId]);

  const fetchAssignmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get vendor profile
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendorData) {
        setError('Vendor profile not found');
        setLoading(false);
        return;
      }
      setVendor(vendorData);

      // Get the quote/response - simplified query
      console.log('DEBUG: Fetching quote:', quoteId, 'for vendor:', vendorData.id);
      
      const { data: quoteData, error: quoteError } = await supabase
        .from('rfq_responses')
        .select('*')
        .eq('id', quoteId)
        .eq('vendor_id', vendorData.id)
        .maybeSingle();

      console.log('DEBUG: Quote response:', { quoteData, quoteError });

      if (quoteError) {
        console.error('Quote fetch error:', quoteError);
        setError(`Error fetching quote: ${quoteError.message}`);
        setLoading(false);
        return;
      }

      if (!quoteData) {
        setError('Quote not found or access denied');
        setLoading(false);
        return;
      }

      setQuote(quoteData);

      // Fetch RFQ separately
      if (quoteData.rfq_id) {
        const { data: rfqData, error: rfqError } = await supabase
          .from('rfqs')
          .select('*')
          .eq('id', quoteData.rfq_id)
          .maybeSingle();

        console.log('DEBUG: RFQ response:', { rfqData, rfqError });

        if (rfqData) {
          setRfq(rfqData);

          // Get buyer information
          if (rfqData.user_id) {
            const { data: buyerData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', rfqData.user_id)
              .maybeSingle();

            if (buyerData) {
              setBuyer(buyerData);
            }
          }
        }
      }

      // Get messages for this assignment (if message table exists)
      try {
        const { data: messagesData } = await supabase
          .from('assignment_messages')
          .select('*')
          .eq('quote_id', quoteId)
          .order('created_at', { ascending: true });

        if (messagesData) {
          setMessages(messagesData);
        }
      } catch (err) {
        // Message table may not exist yet
        console.log('Messages table not available');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching assignment:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      // Try to insert message
      const { data, error } = await supabase
        .from('assignment_messages')
        .insert({
          quote_id: quoteId,
          sender_id: vendor.user_id,
          sender_type: 'vendor',
          message: newMessage.trim(),
        })
        .select()
        .single();

      if (error) {
        // If table doesn't exist, show alternative contact info
        alert('Direct messaging coming soon! For now, please contact the buyer using their email or phone below.');
      } else {
        setMessages([...messages, data]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Unable to send message. Please use the contact information below.');
    }
    setSendingMessage(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/vendor-quotes"
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium inline-block"
          >
            Back to Quotes
          </Link>
        </div>
      </div>
    );
  }

  const isAccepted = quote?.status === 'accepted';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link 
            href="/vendor-quotes" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Quotes
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {isAccepted ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Accepted Assignment
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
                    Pending
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{rfq?.title || 'Assignment'}</h1>
              <p className="text-slate-600 mt-1">{rfq?.category} • {rfq?.county}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Celebration Banner for Accepted */}
            {isAccepted && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                <div className="flex items-start gap-4">
                  <span className="text-4xl">🎉</span>
                  <div>
                    <h2 className="text-xl font-bold mb-2">Congratulations!</h2>
                    <p className="text-green-100">
                      Your quote has been accepted! The buyer is expecting to work with you. 
                      Please reach out to them using the contact information provided to discuss next steps.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Project Details */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                Project Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Description</h3>
                  <p className="text-slate-700">{rfq?.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Category</h3>
                    <p className="text-slate-700">{rfq?.category || 'General'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Location</h3>
                    <p className="text-slate-700 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {rfq?.county || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Budget</h3>
                    <p className="text-slate-700 flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      {rfq?.budget ? `KSh ${parseFloat(rfq.budget).toLocaleString()}` : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Deadline</h3>
                    <p className="text-slate-700 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {rfq?.deadline ? new Date(rfq.deadline).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>
                </div>

                {rfq?.attachment_url && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Attachments</h3>
                    <a 
                      href={rfq.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline font-medium"
                    >
                      View Project Files
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Your Quote */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Your Accepted Quote
              </h2>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">Quoted Amount</span>
                  <span className="text-2xl font-bold text-green-700">
                    KSh {parseFloat(quote?.amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Your Proposal</h3>
                <p className="text-slate-700">{quote?.message || 'No proposal message'}</p>
              </div>

              {quote?.attachment_url && (
                <div className="mt-4">
                  <a 
                    href={quote.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:underline font-medium"
                  >
                    View Your Attachment
                  </a>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-500">
                <Clock className="w-4 h-4 inline mr-1" />
                Submitted: {new Date(quote?.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Communication Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                Communication
              </h2>

              {/* Messages List */}
              {messages.length > 0 ? (
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.sender_type === 'vendor'
                          ? 'bg-amber-50 ml-8'
                          : 'bg-slate-100 mr-8'
                      }`}
                    >
                      <p className="text-sm text-slate-700">{msg.message}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg p-4 mb-4 text-center">
                  <p className="text-slate-600 text-sm">
                    No messages yet. Start a conversation with the buyer using the contact details on the right.
                  </p>
                </div>
              )}

              {/* Message Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Buyer Contact */}
          <div className="space-y-6">
            {/* Buyer Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-slate-400" />
                Buyer Contact
              </h2>

              {buyer ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {(buyer.full_name || buyer.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {buyer.full_name || 'Buyer'}
                      </p>
                      <p className="text-sm text-slate-500">Project Owner</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    {buyer.email && (
                      <a 
                        href={`mailto:${buyer.email}?subject=Re: ${rfq?.title || 'Your Project'} - Quote Accepted`}
                        className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-blue-700"
                      >
                        <Mail className="w-5 h-5" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-xs">{buyer.email}</p>
                        </div>
                      </a>
                    )}

                    {buyer.phone && (
                      <a 
                        href={`tel:${buyer.phone}`}
                        className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition text-green-700"
                      >
                        <Phone className="w-5 h-5" />
                        <div>
                          <p className="text-sm font-medium">Phone</p>
                          <p className="text-xs">{buyer.phone}</p>
                        </div>
                      </a>
                    )}

                    {!buyer.email && !buyer.phone && (
                      <p className="text-sm text-slate-500 text-center py-2">
                        No contact information available
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-500 text-sm">Buyer information not available</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {buyer?.email && (
                  <a
                    href={`mailto:${buyer.email}?subject=Re: ${rfq?.title || 'Your Project'} - Ready to Start&body=Hi ${buyer.full_name || 'there'},%0D%0A%0D%0AThank you for accepting my quote for "${rfq?.title}".%0D%0A%0D%0AI'm excited to work with you on this project. Let's discuss the next steps.%0D%0A%0D%0ABest regards`}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Send Introduction Email
                  </a>
                )}
                {buyer?.phone && (
                  <a
                    href={`tel:${buyer.phone}`}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call Buyer
                  </a>
                )}
                <Link
                  href="/vendor-quotes"
                  className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to All Quotes
                </Link>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Quote Accepted</p>
                    <p className="text-xs text-slate-500">
                      {quote?.updated_at 
                        ? new Date(quote.updated_at).toLocaleDateString()
                        : 'Recently'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 bg-slate-300 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Quote Submitted</p>
                    <p className="text-xs text-slate-500">
                      {new Date(quote?.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 bg-slate-300 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">RFQ Created</p>
                    <p className="text-xs text-slate-500">
                      {new Date(rfq?.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
