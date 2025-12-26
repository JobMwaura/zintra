/**
 * useRFQDashboard Hook
 * 
 * Comprehensive hook for managing RFQ dashboard data and operations
 * Handles fetching, filtering, sorting, and searching RFQs across all tabs
 * 
 * @usage
 * const { rfqs, stats, loading, search, filter, sort } = useRFQDashboard();
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

export function useRFQDashboard() {
  const { user } = useAuth();
  
  // Create supabase client once and reuse it
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) {
    supabaseRef.current = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  const supabase = supabaseRef.current;

  // State management
  const [allRFQs, setAllRFQs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  /**
   * Fetch all RFQs for the current user with quote counts
   */
  const fetchRFQs = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch RFQs with quote counts
      const { data: rfqs, error: rfqError } = await supabase
        .from('rfqs')
        .select(`
          id,
          title,
          description,
          category,
          budget_range,
          location,
          county,
          deadline,
          status,
          created_at,
          updated_at,
          rfq_responses (
            id,
            vendor_id,
            amount,
            status as quote_status,
            created_at,
            vendors (
              id,
              company_name,
              rating
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (rfqError) throw rfqError;

      setAllRFQs(rfqs || []);
    } catch (err) {
      console.error('Error fetching RFQs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase]);

  /**
   * Initial fetch on mount and when user changes
   */
  useEffect(() => {
    if (user?.id) {
      fetchRFQs();
    }
  }, [user?.id]);

  /**
   * Refetch RFQs when user returns to the page (page visibility)
   * This ensures the page is up-to-date after a new RFQ is created
   */
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user?.id) {
        // User came back to the page - refetch data
        console.log('Page became visible - refetching RFQs');
        try {
          setLoading(true);
          setError(null);

          const { data: rfqs, error: rfqError } = await supabase
            .from('rfqs')
            .select(`
              id,
              title,
              description,
              category,
              budget_range,
              location,
              county,
              deadline,
              status,
              created_at,
              updated_at,
              rfq_responses (
                id,
                vendor_id,
                amount,
                status as quote_status,
                created_at,
                vendors (
                  id,
                  company_name,
                  rating
                )
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (rfqError) throw rfqError;
          setAllRFQs(rfqs || []);
        } catch (err) {
          console.error('Error refetching RFQs on visibility change:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, supabase]);

  /**
   * Calculate statistics from RFQs
   */
  const stats = useMemo(() => {
    return {
      total: allRFQs.length,
      pending: allRFQs.filter(r => 
        r.status === 'active' && r.rfq_responses.length < 2
      ).length,
      active: allRFQs.filter(r => 
        r.status === 'active' && r.rfq_responses.length >= 2
      ).length,
      completed: allRFQs.filter(r => r.status !== 'active').length,
      newQuotesThisWeek: allRFQs.reduce((count, r) => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const newQuotes = r.rfq_responses.filter(q => 
          new Date(q.created_at) > weekAgo
        ).length;
        return count + newQuotes;
      }, 0),
      averageResponseTime: calculateAverageResponseTime(allRFQs),
      onTimeClosureRate: calculateOnTimeClosureRate(allRFQs)
    };
  }, [allRFQs]);

  /**
   * Filter and search RFQs
   */
  const filteredRFQs = useMemo(() => {
    let result = [...allRFQs];

    // Status filter
    if (statusFilter === 'pending') {
      result = result.filter(r => 
        r.status === 'active' && r.rfq_responses.length < 2
      );
    } else if (statusFilter === 'active') {
      result = result.filter(r => 
        r.status === 'active' && r.rfq_responses.length >= 2
      );
    } else if (statusFilter === 'completed') {
      result = result.filter(r => r.status !== 'active');
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();

      switch (dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        default:
          break;
      }

      result = result.filter(r => 
        new Date(r.created_at) >= cutoffDate
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.category?.toLowerCase().includes(query)
      );
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'deadline-soon':
          return new Date(a.deadline) - new Date(b.deadline);
        case 'deadline-late':
          return new Date(b.deadline) - new Date(a.deadline);
        case 'quotes-most':
          return b.rfq_responses.length - a.rfq_responses.length;
        case 'quotes-least':
          return a.rfq_responses.length - b.rfq_responses.length;
        default:
          return 0;
      }
    });

    return result;
  }, [allRFQs, statusFilter, dateRange, searchQuery, sortBy]);

  /**
   * Get RFQs for specific tab
   */
  const getPendingRFQs = useCallback(() => {
    return filteredRFQs.filter(r => 
      r.status === 'active' && r.rfq_responses.length < 2
    );
  }, [filteredRFQs]);

  const getActiveRFQs = useCallback(() => {
    return filteredRFQs.filter(r => 
      r.status === 'active' && r.rfq_responses.length >= 2
    );
  }, [filteredRFQs]);

  const getHistoryRFQs = useCallback(() => {
    return filteredRFQs.filter(r => r.status !== 'active');
  }, [filteredRFQs]);

  /**
   * Format currency
   */
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);

  /**
   * Format date
   */
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  /**
   * Get days until deadline
   */
  const getDaysUntilDeadline = useCallback((deadline) => {
    const now = new Date();
    const dead = new Date(deadline);
    const diff = dead - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, []);

  /**
   * Get status badge styling
   */
  const getStatusStyles = useCallback((rfq) => {
    if (rfq.status !== 'active') {
      return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' };
    }
    
    const quoteCount = rfq.rfq_responses.length;
    if (quoteCount < 2) {
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' };
    }
    
    return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Active' };
  }, []);

  /**
   * Get price statistics for RFQ
   */
  const getPriceStats = useCallback((rfq) => {
    if (rfq.rfq_responses.length === 0) {
      return { min: null, max: null, avg: null };
    }

    const prices = rfq.rfq_responses.map(q => q.amount);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

    return { min, max, avg };
  }, []);

  /**
   * Toggle favorite RFQ (store in local state for now)
   */
  const toggleFavorite = useCallback((rfqId) => {
    // TODO: Implement favorite functionality with database
    console.log('Toggle favorite for RFQ:', rfqId);
  }, []);

  /**
   * Update RFQ status
   */
  const updateRFQStatus = useCallback(async (rfqId, newStatus) => {
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status: newStatus })
        .eq('id', rfqId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setAllRFQs(prev => prev.map(r =>
        r.id === rfqId ? { ...r, status: newStatus } : r
      ));
    } catch (err) {
      console.error('Error updating RFQ status:', err);
      setError(err.message);
    }
  }, [user?.id, supabase]);

  return {
    // Data
    allRFQs,
    filteredRFQs,
    stats,
    loading,
    error,

    // Tab data
    pendingRFQs: getPendingRFQs(),
    activeRFQs: getActiveRFQs(),
    historyRFQs: getHistoryRFQs(),

    // Filters and search
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    sortBy,
    setSortBy,

    // Actions
    fetchRFQs,
    toggleFavorite,
    updateRFQStatus,

    // Utilities
    formatCurrency,
    formatDate,
    getDaysUntilDeadline,
    getStatusStyles,
    getPriceStats
  };
}

/**
 * Helper: Calculate average response time
 */
function calculateAverageResponseTime(rfqs) {
  const times = rfqs
    .flatMap(r => r.rfq_responses.map(q => new Date(q.created_at) - new Date(r.created_at)))
    .filter(t => t > 0);

  if (times.length === 0) return 0;

  const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
  return Math.round(avgMs / (1000 * 60 * 60 * 24)); // Convert to days
}

/**
 * Helper: Calculate on-time closure rate
 */
function calculateOnTimeClosureRate(rfqs) {
  const completed = rfqs.filter(r => r.status !== 'active');
  if (completed.length === 0) return 100;

  const onTime = completed.filter(r => {
    const deadline = new Date(r.deadline);
    const closed = new Date(r.updated_at);
    return closed <= deadline;
  }).length;

  return Math.round((onTime / completed.length) * 100);
}

export default useRFQDashboard;
