'use client';

/**
 * User RFQ Dashboard - Main Page
 * 
 * Comprehensive dashboard for managing RFQs
 * Features: Tabbed interface, search, filter, sort, statistics
 * Tab: Pending, Active, History, Messages, Favorites
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useRFQDashboard } from '@/hooks/useRFQDashboard';
import RFQTabs from '../../components/RFQTabs';
import StatisticsCard from '../../components/StatisticsCard';
import FilterBar from '../../components/FilterBar';
import PendingTab from '../../components/PendingTab';
import ActiveTab from '../../components/ActiveTab';
import HistoryTab from '../../components/HistoryTab';
import MessagesTab from '../../components/MessagesTab';
import FavoritesTab from '../../components/FavoritesTab';
import { Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MyRFQsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Dashboard state
  const {
    allRFQs,
    filteredRFQs,
    stats,
    pendingRFQs,
    activeRFQs,
    historyRFQs,
    isLoading,
    error,
    setSearchQuery,
    setStatusFilter,
    setDateRangeFilter,
    setSortBy,
    formatDate,
    getDaysUntilDeadline,
    getStatusStyles,
    getPriceStats,
    toggleFavorite,
    updateRFQStatus,
    fetchRFQs
  } = useRFQDashboard();

  // Notification state
  const { notifications, unreadCount } = useNotifications();

  // UI state
  const [activeTab, setActiveTab] = useState('pending');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [statusValue, setStatusValue] = useState('all');
  const [dateRangeValue, setDateRangeValue] = useState('all');
  const [sortValue, setSortValue] = useState('latest');

  // Redirect if not authenticated (only after auth loading is complete)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Handle search
  const handleSearch = useCallback((query) => {
    setSearchValue(query);
    setSearchQuery(query);
  }, [setSearchQuery]);

  // Handle status filter
  const handleStatusFilter = useCallback((status) => {
    setStatusValue(status);
    setStatusFilter(status);
  }, [setStatusFilter]);

  // Handle date range filter
  const handleDateRangeFilter = useCallback((range) => {
    setDateRangeValue(range);
    setDateRangeFilter(range);
  }, [setDateRangeFilter]);

  // Handle sort
  const handleSort = useCallback((sort) => {
    setSortValue(sort);
    setSortBy(sort);
  }, [setSortBy]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchRFQs();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchRFQs]);

  // Handle view quotes
  const handleViewQuotes = useCallback((rfqId) => {
    router.push(`/quote-comparison/${rfqId}`);
  }, [router]);

  // Handle view details
  const handleViewDetails = useCallback((rfqId) => {
    router.push(`/rfqs/${rfqId}`);
  }, [router]);

  // Handle message
  const handleMessage = useCallback((rfqId) => {
    router.push(`/messages?rfq=${rfqId}`);
  }, [router]);

  // Handle favorite toggle
  const handleFavorite = useCallback((rfqId) => {
    toggleFavorite(rfqId);
  }, [toggleFavorite]);

  // Get current tab data
  const getTabData = () => {
    switch (activeTab) {
      case 'pending':
        return pendingRFQs;
      case 'active':
        return activeRFQs;
      case 'history':
        return historyRFQs;
      case 'messages':
        return notifications;
      case 'favorites':
        // Filter for favorites (would need favorite flag in RFQ model)
        return allRFQs.filter(rfq => rfq.is_favorite);
      default:
        return [];
    }
  };

  // Render loading state while authentication is being checked
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading RFQ dashboard...</p>
        </div>
      </div>
    );
  }

  // Render not authenticated state
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My RFQs</h1>
              <p className="text-slate-600 mt-1">Manage and track all your requests for quotations</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <Link
                href="/post-rfq"
                className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition"
              >
                <Plus className="w-5 h-5" />
                Create RFQ
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <div className="text-red-600 text-2xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Dashboard</h3>
              <p className="text-red-800 text-sm mt-1">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-3 text-sm text-red-700 hover:text-red-900 font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <StatisticsCard
          stats={stats}
          isLoading={isLoading}
        />

        {/* Filter Bar */}
        <FilterBar
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          onDateRangeFilter={handleDateRangeFilter}
          onSort={handleSort}
          searchValue={searchValue}
          statusValue={statusValue}
          dateRangeValue={dateRangeValue}
          sortValue={sortValue}
        />

        {/* Tab Navigation */}
        <RFQTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          stats={stats}
        />

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'pending' && (
            <PendingTab
              rfqs={pendingRFQs}
              onViewQuotes={handleViewQuotes}
              onViewDetails={handleViewDetails}
              onMessage={handleMessage}
              onFavorite={handleFavorite}
              isLoading={isLoading}
              formatDate={formatDate}
              getDaysUntilDeadline={getDaysUntilDeadline}
              getStatusStyles={getStatusStyles}
              getPriceStats={getPriceStats}
            />
          )}

          {activeTab === 'active' && (
            <ActiveTab
              rfqs={activeRFQs}
              onViewQuotes={handleViewQuotes}
              onViewDetails={handleViewDetails}
              onMessage={handleMessage}
              onFavorite={handleFavorite}
              isLoading={isLoading}
              formatDate={formatDate}
              getDaysUntilDeadline={getDaysUntilDeadline}
              getStatusStyles={getStatusStyles}
              getPriceStats={getPriceStats}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              rfqs={historyRFQs}
              onViewQuotes={handleViewQuotes}
              onViewDetails={handleViewDetails}
              onMessage={handleMessage}
              onFavorite={handleFavorite}
              isLoading={isLoading}
              formatDate={formatDate}
              getDaysUntilDeadline={getDaysUntilDeadline}
              getStatusStyles={getStatusStyles}
              getPriceStats={getPriceStats}
            />
          )}

          {activeTab === 'messages' && (
            <MessagesTab
              messages={notifications}
              rfqs={allRFQs}
              onOpenThread={(thread) => handleMessage(thread.rfq_id)}
              isLoading={isLoading}
              formatDate={formatDate}
            />
          )}

          {activeTab === 'favorites' && (
            <FavoritesTab
              rfqs={allRFQs.filter(rfq => rfq.is_favorite)}
              onViewQuotes={handleViewQuotes}
              onViewDetails={handleViewDetails}
              onMessage={handleMessage}
              onFavorite={handleFavorite}
              isLoading={isLoading}
              formatDate={formatDate}
              getDaysUntilDeadline={getDaysUntilDeadline}
              getStatusStyles={getStatusStyles}
              getPriceStats={getPriceStats}
            />
          )}
        </div>
      </div>
    </div>
  );
}
