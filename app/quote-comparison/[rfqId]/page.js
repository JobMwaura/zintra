'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import QuoteDetailCard from '@/components/QuoteDetailCard';
import QuoteComparisonTable from '@/components/QuoteComparisonTable';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  MessageCircle, 
  Check, 
  X, 
  AlertCircle,
  TrendingDown,
  Clock,
  User,
  Gift,
  LayoutGrid,
  List
} from 'lucide-react';
import jsPDF from 'jspdf';

/**
 * Quote Comparison Page
 * Displays all quotes for a specific RFQ side-by-side
 * - RFQ creator view: See all quotes with accept/reject options
 * - Vendor view: See own quote and compare with others (restricted)
 */
export default function QuoteComparisonPage({ params }) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const { rfqId } = params;

  const [rfq, setRfq] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [vendors, setVendors] = useState({});
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [viewMode, setViewMode] = useState('detail'); // 'detail' or 'table'
  
  // Job assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    startDate: '',
    notes: ''
  });
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch RFQ details and associated quotes
  useEffect(() => {
    fetchRFQDetails();
  }, [rfqId, user]);

  const fetchRFQDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch RFQ
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', rfqId)
        .single();

      if (rfqError) throw new Error('RFQ not found');
      if (!rfqData) throw new Error('RFQ not found');

      // Check authorization
      const isCreator = rfqData.user_id === user?.id;
      const isPublicRFQ = rfqData.rfq_type === 'public';

      if (!isCreator && !isPublicRFQ) {
        throw new Error('You do not have permission to view this RFQ');
      }

      setRfq(rfqData);

      // Fetch quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from('rfq_responses')
        .select('*')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: false });

      if (quotesError) throw quotesError;

      // Filter quotes for vendor users (only show their own)
      let filteredQuotes = quotesData || [];
      if (!isCreator) {
        filteredQuotes = filteredQuotes.filter(q => q.vendor_id === user?.id);
      }

      setQuotes(filteredQuotes);

      // Fetch vendor details for all quotes
      if (filteredQuotes.length > 0) {
        const vendorIds = [...new Set(filteredQuotes.map(q => q.vendor_id))];
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('id, company_name, phone, email, rating, verified, logo_url, response_time_hours')
          .in('id', vendorIds);

        if (!vendorError && vendorData) {
          const vendorMap = {};
          vendorData.forEach(v => {
            vendorMap[v.id] = v;
          });
          setVendors(vendorMap);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching RFQ details:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const isCreator = rfq?.user_id === user?.id;

  const handleAcceptQuote = async (quoteId) => {
    if (!isCreator) {
      setActionMessage('Only the RFQ creator can accept quotes');
      return;
    }

    try {
      setActing(quoteId);
      setActionMessage('');

      const { error } = await supabase
        .from('rfq_responses')
        .update({ status: 'accepted' })
        .eq('id', quoteId);

      if (error) throw error;

      setActionMessage('✅ Quote accepted successfully!');
      setTimeout(() => {
        fetchRFQDetails();
        setActionMessage('');
      }, 2000);
    } catch (err) {
      console.error('Error accepting quote:', err);
      setActionMessage(`❌ Error: ${err.message}`);
    } finally {
      setActing(null);
    }
  };

  const handleRejectQuote = async (quoteId) => {
    if (!isCreator) {
      setActionMessage('Only the RFQ creator can reject quotes');
      return;
    }

    try {
      setActing(quoteId);
      setActionMessage('');

      const { error } = await supabase
        .from('rfq_responses')
        .update({ status: 'rejected' })
        .eq('id', quoteId);

      if (error) throw error;

      setActionMessage('✅ Quote rejected');
      setTimeout(() => {
        fetchRFQDetails();
        setActionMessage('');
      }, 2000);
    } catch (err) {
      console.error('Error rejecting quote:', err);
      setActionMessage(`❌ Error: ${err.message}`);
    } finally {
      setActing(null);
    }
  };

  const handleAssignJob = async () => {
    if (!assignmentData.startDate) {
      setActionMessage('❌ Please select a start date');
      return;
    }

    try {
      setIsAssigning(true);
      setActionMessage('');

      const selectedQuote = quotes.find(q => q.id === selectedQuoteId);
      if (!selectedQuote) {
        throw new Error('Quote not found');
      }

      const res = await fetch('/api/rfq/assign-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rfqId,
          vendorId: selectedQuote.vendor_id,
          startDate: assignmentData.startDate,
          notes: assignmentData.notes
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign job');
      }

      setActionMessage('✅ Job assigned successfully! Vendor has been notified.');
      setShowAssignModal(false);
      setAssignmentData({ startDate: '', notes: '' });
      
      setTimeout(() => {
        fetchRFQDetails();
        setActionMessage('');
        // Optionally redirect to project page
        router.push(`/projects/${data.project.id}`);
      }, 2000);
    } catch (err) {
      console.error('Error assigning job:', err);
      setActionMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  const exportToCSV = () => {
    if (quotes.length === 0) {
      setActionMessage('No quotes to export');
      return;
    }

    const headers = ['Vendor', 'Rating', 'Price (KSh)', 'Timeline', 'Status', 'Submitted'];
    const rows = quotes.map(q => {
      const vendor = vendors[q.vendor_id];
      return [
        vendor?.company_name || 'Unknown',
        vendor?.rating ? parseFloat(vendor.rating).toFixed(1) : 'N/A',
        parseFloat(q.amount).toLocaleString(),
        q.timeline || 'Not specified',
        q.status || 'submitted',
        new Date(q.created_at).toLocaleDateString(),
      ];
    });

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes-${rfq?.id?.slice(0, 8)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    setActionMessage('✅ Exported to CSV');
    setTimeout(() => setActionMessage(''), 2000);
  };

  const exportToPDF = () => {
    if (quotes.length === 0) {
      setActionMessage('No quotes to export');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 15;

      // Title
      doc.setFontSize(16);
      doc.text('Quote Comparison Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // RFQ Details
      doc.setFontSize(10);
      doc.text(`Project: ${rfq?.title || 'N/A'}`, 15, yPosition);
      yPosition += 6;
      doc.text(`Total Quotes: ${quotes.length}`, 15, yPosition);
      yPosition += 6;
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, yPosition);
      yPosition += 12;

      // Table headers
      const headers = ['Vendor', 'Rating', 'Price', 'Timeline', 'Status'];
      const colWidths = [40, 20, 30, 35, 30];
      let xPosition = 15;

      doc.setFillColor(240, 240, 240);
      doc.setTextColor(0);

      headers.forEach((header, idx) => {
        doc.text(header, xPosition, yPosition);
        xPosition += colWidths[idx];
      });

      yPosition += 8;
      doc.setDrawColor(200);
      doc.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 6;

      // Table rows
      doc.setFontSize(9);
      quotes.forEach((quote) => {
        const vendor = vendors[quote.vendor_id];
        const rowData = [
          vendor?.company_name || 'Unknown',
          vendor?.rating ? parseFloat(vendor.rating).toFixed(1) : 'N/A',
          `KSh ${parseFloat(quote.amount).toLocaleString()}`,
          quote.timeline || 'Not specified',
          quote.status || 'submitted',
        ];

        xPosition = 15;
        rowData.forEach((text, idx) => {
          doc.text(text.toString(), xPosition, yPosition);
          xPosition += colWidths[idx];
        });

        yPosition += 6;

        // Page break if needed
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 15;
        }
      });

      doc.save(`quotes-${rfq?.id?.slice(0, 8)}.pdf`);
      setActionMessage('✅ Exported to PDF');
      setTimeout(() => setActionMessage(''), 2000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setActionMessage('❌ Error generating PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="h-12 w-12 bg-orange-200 rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-600 mt-4">Loading quotes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold mb-6"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <p className="text-red-900 font-semibold">{error}</p>
            <button
              onClick={() => router.push('/my-rfqs')}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Back to My RFQs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold mb-4"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-slate-900">{rfq?.title}</h1>
            <p className="text-slate-600 mt-2 max-w-2xl">{rfq?.description}</p>

            <div className="flex flex-wrap gap-6 mt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">
                  Posted {new Date(rfq?.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600 font-semibold">
                  {quotes.length} quote{quotes.length !== 1 ? 's' : ''} received
                </span>
              </div>
              {rfq?.deadline && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-700 font-semibold">
                    Deadline: {new Date(rfq.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            actionMessage.startsWith('✅')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {actionMessage}
          </div>
        )}

        {/* Summary Stats */}
        {quotes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <p className="text-xs text-slate-600 font-medium uppercase">Lowest Price</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                KSh {Math.min(...quotes.map(q => parseFloat(q.amount) || 0)).toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <p className="text-xs text-slate-600 font-medium uppercase">Highest Rated</p>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {Math.max(
                  ...quotes.map(q => {
                    const v = vendors[q.vendor_id];
                    return v?.rating ? parseFloat(v.rating) : 0;
                  })
                ).toFixed(1)} ⭐
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
              <p className="text-xs text-slate-600 font-medium uppercase">Average Price</p>
              <p className="text-2xl font-bold text-orange-900 mt-2">
                KSh {Math.round(quotes.reduce((sum, q) => sum + (parseFloat(q.amount) || 0), 0) / quotes.length).toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
              <p className="text-xs text-slate-600 font-medium uppercase">Total Quotes</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">{quotes.length}</p>
            </div>
          </div>
        )}

        {/* Export & Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={exportToCSV}
            disabled={quotes.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-slate-900"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          <button
            onClick={exportToPDF}
            disabled={quotes.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-slate-900"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>

          {isCreator && quotes.length > 0 && (
            <button
              onClick={() => router.push(`/rfq/${rfqId}/negotiate`)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition font-semibold text-orange-700"
            >
              <MessageCircle className="w-4 h-4" /> Negotiate Quotes
            </button>
          )}

          {/* View Toggle */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setViewMode('detail')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-semibold ${
                viewMode === 'detail'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Detailed View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-semibold ${
                viewMode === 'table'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-900 hover:bg-slate-50'
              }`}
            >
              <List className="w-4 h-4" /> Table View
            </button>
          </div>
        </div>

        {/* Main Content */}
        {quotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <TrendingDown className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-900">No quotes received yet</p>
            <p className="text-slate-600 mt-2">Vendors will appear here once they submit their quotes</p>
          </div>
        ) : viewMode === 'detail' ? (
          // Detailed Card View
          <div className="space-y-4">
            {quotes.map((quote) => (
              <QuoteDetailCard
                key={quote.id}
                quote={quote}
                vendor={vendors[quote.vendor_id]}
                isSelected={selectedQuoteId === quote.id}
                onSelect={() => setSelectedQuoteId(quote.id)}
              />
            ))}
          </div>
        ) : (
          // Table View
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <QuoteComparisonTable
              quotes={quotes}
              vendors={vendors}
              onSelectQuote={setSelectedQuoteId}
              selectedQuoteId={selectedQuoteId}
            />
          </div>
        )}

        {/* Actions for selected quote (Creator view) */}
        {isCreator && selectedQuoteId && quotes.length > 0 && (
          <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-6">
            <p className="text-sm font-semibold text-slate-900 mb-4">Actions for selected quote:</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleAcceptQuote(selectedQuoteId)}
                disabled={acting === selectedQuoteId}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-semibold disabled:opacity-60 hover:bg-green-700 transition"
              >
                <Check className="w-4 h-4" /> Accept Quote
              </button>

              <button
                onClick={() => {
                  const selectedQuote = quotes.find(q => q.id === selectedQuoteId);
                  if (selectedQuote?.status === 'accepted') {
                    setShowAssignModal(true);
                  } else {
                    setActionMessage('❌ You must accept the quote first before assigning the job');
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              >
                <Gift className="w-4 h-4" /> Assign Job
              </button>

              <button
                onClick={() => handleRejectQuote(selectedQuoteId)}
                disabled={acting === selectedQuoteId}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white font-semibold disabled:opacity-60 hover:bg-red-700 transition"
              >
                <X className="w-4 h-4" /> Reject Quote
              </button>

              <button
                onClick={() => {
                  const selectedQuote = quotes.find(q => q.id === selectedQuoteId);
                  if (selectedQuote?.status === 'accepted') {
                    const vendor = vendors[selectedQuote?.vendor_id];
                    if (vendor?.email) {
                      window.location.href = `mailto:${vendor.email}`;
                    } else {
                      setActionMessage('❌ No vendor email available');
                    }
                  } else {
                    setActionMessage('ℹ️ Accept the quote or negotiate a deal first. Vendor contact is revealed after acceptance.');
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              >
                <MessageCircle className="w-4 h-4" /> Contact Vendor
              </button>
            </div>
          </div>
        )}

        {/* Information for vendor view */}
        {!isCreator && quotes.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-sm text-blue-900">
              ℹ️ <span className="font-semibold">Vendor View:</span> You can only see your own quote in the table above. The RFQ creator can see all submitted quotes.
            </p>
          </div>
        )}

        {/* Job Assignment Modal */}
        {showAssignModal && selectedQuoteId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
                <h2 className="text-xl font-bold text-white">Assign This Job</h2>
              </div>

              <div className="p-6 space-y-4">
                {(() => {
                  const selectedQuote = quotes.find(q => q.id === selectedQuoteId);
                  const vendor = vendors[selectedQuote?.vendor_id];
                  return (
                    <>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-xs text-slate-600 font-semibold uppercase">Vendor</p>
                        <p className="text-lg font-bold text-slate-900 mt-1">{vendor?.company_name || 'Unknown'}</p>
                        <p className="text-sm text-slate-600 mt-2">Quote: KSh {parseFloat(selectedQuote?.amount).toLocaleString()}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Project Start Date *
                        </label>
                        <input
                          type="date"
                          value={assignmentData.startDate}
                          onChange={(e) => setAssignmentData({...assignmentData, startDate: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Project Notes (Optional)
                        </label>
                        <textarea
                          value={assignmentData.notes}
                          onChange={(e) => setAssignmentData({...assignmentData, notes: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
                          placeholder="Any additional instructions or details for this project..."
                        />
                      </div>
                    </>
                  );
                })()}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setAssignmentData({ startDate: '', notes: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-semibold text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignJob}
                    disabled={isAssigning || !assignmentData.startDate}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
