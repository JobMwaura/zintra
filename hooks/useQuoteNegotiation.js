import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * useQuoteNegotiation Hook
 * Manages quote negotiation data and operations
 * 
 * Features:
 * - Fetch negotiation threads with counter offers and Q&A
 * - Submit and manage counter offers
 * - Add and answer questions
 * - Track revision history
 * - Real-time updates (manual refresh)
 */
export const useQuoteNegotiation = (negotiationId) => {
  const { user } = useAuth();
  
  // State management
  const [negotiation, setNegotiation] = useState(null);
  const [counterOffers, setCounterOffers] = useState([]);
  const [qaItems, setQaItems] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Fetch complete negotiation data including counter offers and Q&A
   */
  const fetchNegotiation = useCallback(async (id) => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/negotiations/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch negotiation');
      }

      const data = await response.json();
      setNegotiation(data.thread);
      setCounterOffers(data.counterOffers || []);
      setQaItems(data.qaItems || []);
      setRevisions(data.revisions || []);

    } catch (err) {
      console.error('Fetch negotiation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new negotiation thread for a quote
   */
  const createNegotiation = useCallback(async (quoteId, buyerId, vendorId, originalPrice) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/negotiations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          buyerId,
          vendorId,
          originalPrice
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create negotiation');
      }

      const data = await response.json();
      setNegotiation(data.thread);
      return data.thread;

    } catch (err) {
      console.error('Create negotiation error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * Submit a counter offer with optional scope changes
   */
  const submitCounterOffer = useCallback(async ({
    quoteId,
    proposedPrice,
    scopeChanges = '',
    deliveryDate = null,
    paymentTerms = '',
    notes = '',
    responseByDays = 3
  }) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/negotiations/counter-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negotiationId,
          quoteId,
          proposedBy: user.id,
          proposedPrice,
          scopeChanges: scopeChanges || null,
          deliveryDate,
          paymentTerms: paymentTerms || null,
          notes: notes || null,
          responseByDays
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit counter offer');
      }

      const data = await response.json();
      setCounterOffers([data.counterOffer, ...counterOffers]);
      
      // Update negotiation current price
      if (negotiation) {
        setNegotiation({
          ...negotiation,
          current_price: proposedPrice,
          total_counter_offers: negotiation.total_counter_offers + 1
        });
      }

      return data.counterOffer;

    } catch (err) {
      console.error('Submit counter offer error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [negotiationId, user?.id, counterOffers, negotiation]);

  /**
   * Accept a counter offer
   */
  const acceptCounterOffer = useCallback(async (counterId) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/negotiations/counter-offer/${counterId}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept counter offer');
      }

      const data = await response.json();
      setCounterOffers(counterOffers.map(co => 
        co.id === counterId ? { ...co, status: 'accepted' } : co
      ));

      return data;

    } catch (err) {
      console.error('Accept counter offer error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [counterOffers]);

  /**
   * Reject a counter offer
   */
  const rejectCounterOffer = useCallback(async (counterId, reason) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/negotiations/counter-offer/${counterId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectedReason: reason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject counter offer');
      }

      const data = await response.json();
      setCounterOffers(counterOffers.map(co => 
        co.id === counterId ? { ...co, status: 'rejected', rejected_reason: reason } : co
      ));

      return data;

    } catch (err) {
      console.error('Reject counter offer error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [counterOffers]);

  /**
   * Add a question to the Q&A thread
   */
  const addQuestion = useCallback(async (quoteId, question) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      if (!question.trim()) {
        throw new Error('Question cannot be empty');
      }

      const response = await fetch('/api/negotiations/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negotiationId,
          quoteId,
          askedBy: user.id,
          question: question.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add question');
      }

      const data = await response.json();
      setQaItems([...qaItems, data.qa]);
      return data.qa;

    } catch (err) {
      console.error('Add question error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [negotiationId, user?.id, qaItems]);

  /**
   * Answer a question in the Q&A thread
   */
  const answerQuestion = useCallback(async (qaId, answer) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      if (!answer.trim()) {
        throw new Error('Answer cannot be empty');
      }

      const response = await fetch('/api/negotiations/qa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qaId,
          answer: answer.trim(),
          answeredBy: user.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to answer question');
      }

      const data = await response.json();
      setQaItems(qaItems.map(qa => qa.id === qaId ? data.qa : qa));
      return data.qa;

    } catch (err) {
      console.error('Answer question error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, qaItems]);

  /**
   * Get unanswered questions
   */
  const getUnansweredQuestions = useCallback(() => {
    return qaItems.filter(qa => !qa.answer);
  }, [qaItems]);

  /**
   * Get price change summary
   */
  const getPriceChangeSummary = useCallback(() => {
    if (!negotiation) return null;
    
    const accepted = counterOffers.filter(co => co.status === 'accepted');
    const lastAccepted = accepted[accepted.length - 1];
    
    return {
      original: negotiation.original_price,
      current: negotiation.current_price,
      lastAccepted: lastAccepted?.proposed_price || negotiation.original_price,
      difference: negotiation.current_price - negotiation.original_price,
      percentChange: ((negotiation.current_price - negotiation.original_price) / negotiation.original_price) * 100
    };
  }, [negotiation, counterOffers]);

  /**
   * Check if user is buyer or vendor in this negotiation
   */
  const getUserRole = useCallback(() => {
    if (!negotiation || !user) return null;
    if (negotiation.buyer_id === user.id) return 'buyer';
    if (negotiation.vendor_id === user.id) return 'vendor';
    return null;
  }, [negotiation, user]);

  /**
   * Fetch on mount
   */
  useEffect(() => {
    if (negotiationId) {
      fetchNegotiation(negotiationId);
    }
  }, [negotiationId, fetchNegotiation]);

  return {
    // Data
    negotiation,
    counterOffers,
    qaItems,
    revisions,
    
    // State
    loading,
    error,
    isSubmitting,
    
    // Operations
    createNegotiation,
    submitCounterOffer,
    acceptCounterOffer,
    rejectCounterOffer,
    addQuestion,
    answerQuestion,
    refetch: () => fetchNegotiation(negotiationId),
    
    // Utilities
    getUnansweredQuestions,
    getPriceChangeSummary,
    getUserRole
  };
};

export default useQuoteNegotiation;
