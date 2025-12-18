import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

/**
 * useQuoteComparison Hook
 * Manages quote comparison logic, filtering, sorting, and actions
 * 
 * Usage:
 * const { quotes, loading, error, acceptQuote, rejectQuote, contactVendor } = useQuoteComparison(rfqId);
 */
export function useQuoteComparison(rfqId) {
  const supabase = createClient();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all quotes for an RFQ
  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('rfq_responses')
        .select(`
          *,
          vendor:vendor_id (
            id,
            company_name,
            phone,
            email,
            rating,
            verified,
            logo_url,
            response_time_hours
          )
        `)
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setQuotes(data || []);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [rfqId, supabase]);

  // Accept a quote
  const acceptQuote = useCallback(async (quoteId) => {
    try {
      const { error: err } = await supabase
        .from('rfq_responses')
        .update({ status: 'accepted' })
        .eq('id', quoteId);

      if (err) throw err;

      // Update local state
      setQuotes(prevQuotes =>
        prevQuotes.map(q =>
          q.id === quoteId ? { ...q, status: 'accepted' } : q
        )
      );

      return { success: true };
    } catch (err) {
      console.error('Error accepting quote:', err);
      return { success: false, error: err.message };
    }
  }, [supabase]);

  // Reject a quote
  const rejectQuote = useCallback(async (quoteId) => {
    try {
      const { error: err } = await supabase
        .from('rfq_responses')
        .update({ status: 'rejected' })
        .eq('id', quoteId);

      if (err) throw err;

      // Update local state
      setQuotes(prevQuotes =>
        prevQuotes.map(q =>
          q.id === quoteId ? { ...q, status: 'rejected' } : q
        )
      );

      return { success: true };
    } catch (err) {
      console.error('Error rejecting quote:', err);
      return { success: false, error: err.message };
    }
  }, [supabase]);

  // Sort quotes by field
  const sortQuotes = useCallback((field, direction = 'asc') => {
    const sorted = [...quotes].sort((a, b) => {
      let aVal, bVal;

      switch (field) {
        case 'price':
          aVal = parseFloat(a.amount) || 0;
          bVal = parseFloat(b.amount) || 0;
          break;
        case 'rating':
          aVal = a.vendor?.rating ? parseFloat(a.vendor.rating) : 0;
          bVal = b.vendor?.rating ? parseFloat(b.vendor.rating) : 0;
          break;
        case 'date':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    setQuotes(sorted);
  }, [quotes]);

  // Filter quotes by status
  const filterByStatus = useCallback((status) => {
    if (status === 'all') {
      fetchQuotes();
    } else {
      setQuotes(prevQuotes =>
        prevQuotes.filter(q => q.status === status)
      );
    }
  }, [fetchQuotes]);

  // Filter quotes by price range
  const filterByPrice = useCallback((minPrice, maxPrice) => {
    setQuotes(prevQuotes =>
      prevQuotes.filter(q => {
        const price = parseFloat(q.amount) || 0;
        const min = minPrice ? parseFloat(minPrice) : 0;
        const max = maxPrice ? parseFloat(maxPrice) : Infinity;
        return price >= min && price <= max;
      })
    );
  }, []);

  // Get quote statistics
  const getStatistics = useCallback(() => {
    if (quotes.length === 0) {
      return {
        total: 0,
        average: 0,
        lowest: 0,
        highest: 0,
        accepted: 0,
        rejected: 0,
        pending: 0,
      };
    }

    const prices = quotes.map(q => parseFloat(q.amount) || 0);
    const statuses = quotes.map(q => q.status);

    return {
      total: quotes.length,
      average: prices.reduce((a, b) => a + b, 0) / prices.length,
      lowest: Math.min(...prices),
      highest: Math.max(...prices),
      accepted: statuses.filter(s => s === 'accepted').length,
      rejected: statuses.filter(s => s === 'rejected').length,
      pending: statuses.filter(s => s === 'submitted').length,
    };
  }, [quotes]);

  // Calculate savings by selecting lowest quote
  const calculateSavings = useCallback(() => {
    if (quotes.length < 2) return 0;
    const prices = quotes.map(q => parseFloat(q.amount) || 0);
    const average = prices.reduce((a, b) => a + b, 0) / prices.length;
    const lowest = Math.min(...prices);
    return average - lowest;
  }, [quotes]);

  return {
    quotes,
    loading,
    error,
    fetchQuotes,
    acceptQuote,
    rejectQuote,
    sortQuotes,
    filterByStatus,
    filterByPrice,
    getStatistics,
    calculateSavings,
  };
}

/**
 * Quote utility functions
 */
export const quoteUtils = {
  // Format currency
  formatCurrency: (amount, currency = 'KES') => {
    return `${currency} ${parseFloat(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  },

  // Get status badge color
  getStatusColor: (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'revised':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  },

  // Get status label
  getStatusLabel: (status) => {
    const labels = {
      submitted: 'Submitted',
      revised: 'Revised',
      accepted: 'Accepted',
      rejected: 'Rejected',
    };
    return labels[status] || status;
  },

  // Calculate price difference
  calculateDifference: (price1, price2) => {
    const p1 = parseFloat(price1) || 0;
    const p2 = parseFloat(price2) || 0;
    const diff = p1 - p2;
    const percent = p2 > 0 ? ((diff / p2) * 100).toFixed(1) : 0;
    return { diff, percent };
  },

  // Calculate average response time
  calculateAverageResponseTime: (quotes) => {
    if (quotes.length === 0) return 'N/A';
    const times = quotes
      .map(q => q.vendor?.response_time_hours || 0)
      .filter(t => t > 0);
    if (times.length === 0) return 'N/A';
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return avg > 24 ? `${(avg / 24).toFixed(1)} days` : `${avg.toFixed(1)} hours`;
  },

  // Get recommended quote (highest rated + reasonable price)
  getRecommendedQuote: (quotes) => {
    if (quotes.length === 0) return null;
    if (quotes.length === 1) return quotes[0];

    const avgPrice = quotes.reduce((sum, q) => sum + (parseFloat(q.amount) || 0), 0) / quotes.length;
    const priceDeviation = 0.2; // 20% deviation threshold

    return quotes.reduce((best, current) => {
      const currentPrice = parseFloat(current.amount) || 0;
      const bestPrice = parseFloat(best.amount) || 0;
      const currentRating = current.vendor?.rating ? parseFloat(current.vendor.rating) : 0;
      const bestRating = best.vendor?.rating ? parseFloat(best.vendor.rating) : 0;

      // Prioritize: rating > price competitiveness
      const currentScore =
        currentRating * 0.6 + // 60% weight on rating
        (currentPrice <= avgPrice * (1 + priceDeviation) ? 0.4 : 0); // 40% bonus if price is reasonable

      const bestScore =
        bestRating * 0.6 +
        (bestPrice <= avgPrice * (1 + priceDeviation) ? 0.4 : 0);

      return currentScore > bestScore ? current : best;
    });
  },

  // Check if quote is competitive
  isCompetitivePrice: (price, allQuotes) => {
    const prices = allQuotes.map(q => parseFloat(q.amount) || 0);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const p = parseFloat(price) || 0;
    return p <= avg * 1.15; // Within 15% of average
  },
};

export default useQuoteComparison;
