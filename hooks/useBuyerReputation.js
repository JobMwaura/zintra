/**
 * ============================================================================
 * BUYER REPUTATION HOOK
 * ============================================================================
 * Hook for managing buyer reputation data and calculations
 * 
 * Features:
 * - Fetch reputation data for any buyer
 * - Calculate reputation scores
 * - Determine badge tier
 * - Real-time score updates
 * 
 * Usage:
 * const { reputation, loading, error } = useBuyerReputation(buyerId);
 * 
 * ============================================================================
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useBuyerReputation = (buyerId = null) => {
  const { user } = useAuth();
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch reputation data from API
   */
  const fetchReputation = useCallback(async (id) => {
    if (!id) {
      setReputation(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/reputation/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { 'Authorization': `Bearer ${user.id}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reputation: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setReputation(data);
    } catch (err) {
      console.error('Fetch reputation error:', err);
      setError(err.message);
      setReputation(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Calculate reputation score from metrics
   * Formula: 
   * - RFQ Score: (total_rfqs * 2) max 30 points
   * - Response Score: (response_rate / 100) * 35 max 35 points
   * - Acceptance Score: (acceptance_rate / 100) * 35 max 35 points
   * Total: 0-100 points
   */
  const calculateScore = useCallback((totalRfqs, responseRate, acceptanceRate) => {
    const rfqScore = Math.min(totalRfqs * 2, 30);
    const responseScore = (responseRate / 100) * 35;
    const acceptanceScore = (acceptanceRate / 100) * 35;
    
    const totalScore = rfqScore + responseScore + acceptanceScore;
    return Math.round(totalScore);
  }, []);

  /**
   * Get badge tier based on reputation score
   * Bronze: 0-24
   * Silver: 25-49
   * Gold: 50-74
   * Platinum: 75-100
   */
  const getBadgeTier = useCallback((score) => {
    if (score >= 75) return 'platinum';
    if (score >= 50) return 'gold';
    if (score >= 25) return 'silver';
    return 'bronze';
  }, []);

  /**
   * Get badge configuration (colors, icons, labels)
   */
  const getBadgeConfig = useCallback((tier) => {
    const config = {
      bronze: {
        label: 'Bronze',
        emoji: '🥉',
        color: 'orange',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-300',
        description: 'Starting reputation'
      },
      silver: {
        label: 'Silver',
        emoji: '🥈',
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300',
        description: 'Good reputation'
      },
      gold: {
        label: 'Gold',
        emoji: '🥇',
        color: 'yellow',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-300',
        description: 'Excellent reputation'
      },
      platinum: {
        label: 'Platinum',
        emoji: '👑',
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300',
        description: 'Outstanding reputation'
      }
    };

    return config[tier] || config.bronze;
  }, []);

  /**
   * Format reputation data with calculated values
   */
  const formatReputation = useCallback((data) => {
    if (!data) return null;

    const score = calculateScore(
      data.total_rfqs,
      data.response_rate,
      data.acceptance_rate
    );
    const tier = getBadgeTier(score);

    return {
      ...data,
      reputation_score: score,
      badge_tier: tier,
      config: getBadgeConfig(tier)
    };
  }, [calculateScore, getBadgeTier, getBadgeConfig]);

  /**
   * Recalculate and refresh reputation
   */
  const recalculateReputation = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/reputation/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { 'Authorization': `Bearer ${user.id}` })
        },
        body: JSON.stringify({ buyerId: id })
      });

      if (!response.ok) {
        throw new Error(`Failed to recalculate reputation: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setReputation(data.reputation);
      return data.reputation;
    } catch (err) {
      console.error('Recalculate reputation error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Fetch reputation when buyerId or user changes
   */
  useEffect(() => {
    const targetId = buyerId || user?.id;
    if (targetId) {
      fetchReputation(targetId);
    }
  }, [buyerId, user?.id, fetchReputation]);

  return {
    reputation,
    loading,
    error,
    calculateScore,
    getBadgeTier,
    getBadgeConfig,
    formatReputation,
    refetch: () => fetchReputation(buyerId || user?.id),
    recalculate: recalculateReputation
  };
};

export default useBuyerReputation;
