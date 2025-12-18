# 🎯 TASK 10: QUOTE NEGOTIATION FEATURES - IMPLEMENTATION PLAN

## Overview
Build a complete quote negotiation system that enables buyers and vendors to engage in back-and-forth quote modifications, scope discussions, and Q&A interactions before final quote acceptance.

**Estimated Duration:** 4-5 hours  
**Target LOC:** 1,200+ lines  
**Components:** 4-5 components  
**API Endpoints:** 3 endpoints  
**Database Changes:** 3 new tables

---

## 📋 Task Breakdown

### Phase 1: Database Schema (20 minutes)

#### 1.1 Create negotiation_threads Table
```sql
CREATE TABLE negotiation_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id),
  vendor_id UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'accepted', 'rejected')),
  total_counter_offers INTEGER DEFAULT 0,
  current_price DECIMAL(12,2),
  original_price DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.2 Create counter_offers Table
```sql
CREATE TABLE counter_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negotiation_id UUID NOT NULL REFERENCES negotiation_threads(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES quotes(id),
  proposed_by UUID NOT NULL REFERENCES users(id),
  proposed_price DECIMAL(12,2),
  scope_changes TEXT,
  delivery_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
  response_by_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.3 Create negotiation_qa Table
```sql
CREATE TABLE negotiation_qa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negotiation_id UUID NOT NULL REFERENCES negotiation_threads(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES quotes(id),
  asked_by UUID NOT NULL REFERENCES users(id),
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMP,
  answered_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.4 Create quote_revisions Table
```sql
CREATE TABLE quote_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  revision_number INTEGER DEFAULT 1,
  price DECIMAL(12,2),
  scope_summary TEXT,
  delivery_date DATE,
  changed_by UUID NOT NULL REFERENCES users(id),
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### Phase 2: Backend - API Endpoints (90 minutes)

#### 2.1 Create Negotiation Thread Endpoint

**File:** `pages/api/negotiations/create.js` (200 lines)

```javascript
// POST /api/negotiations/create
// Creates a new negotiation thread for a quote

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { quoteId, buyerId, vendorId, originalPrice } = req.body;

    // Validate input
    if (!quoteId || !buyerId || !vendorId || !originalPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create negotiation thread
    const { data: thread, error } = await supabase
      .from('negotiation_threads')
      .insert({
        quote_id: quoteId,
        buyer_id: buyerId,
        vendor_id: vendorId,
        original_price: originalPrice,
        current_price: originalPrice,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      thread: thread
    });

  } catch (error) {
    console.error('Create negotiation error:', error);
    return res.status(500).json({
      error: 'Failed to create negotiation',
      details: error.message
    });
  }
}
```

#### 2.2 Submit Counter Offer Endpoint

**File:** `pages/api/negotiations/counter-offer.js` (250 lines)

```javascript
// POST /api/negotiations/counter-offer
// Submit a counter offer with optional scope changes

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      negotiationId, 
      quoteId, 
      proposedBy, 
      proposedPrice, 
      scopeChanges, 
      deliveryDate, 
      notes,
      responseByDays = 3
    } = req.body;

    // Validate input
    if (!negotiationId || !quoteId || !proposedBy || !proposedPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate response deadline
    const responseByDate = new Date();
    responseByDate.setDate(responseByDate.getDate() + responseByDays);

    // Create counter offer
    const { data: counterOffer, error: offerError } = await supabase
      .from('counter_offers')
      .insert({
        negotiation_id: negotiationId,
        quote_id: quoteId,
        proposed_by: proposedBy,
        proposed_price: proposedPrice,
        scope_changes: scopeChanges,
        delivery_date: deliveryDate,
        notes: notes,
        status: 'pending',
        response_by_date: responseByDate.toISOString()
      })
      .select()
      .single();

    if (offerError) throw offerError;

    // Update negotiation thread
    const { error: threadError } = await supabase
      .from('negotiation_threads')
      .update({
        current_price: proposedPrice,
        total_counter_offers: supabase.sql`total_counter_offers + 1`,
        updated_at: new Date().toISOString()
      })
      .eq('id', negotiationId);

    if (threadError) throw threadError;

    // Create revision record
    const { error: revisionError } = await supabase
      .from('quote_revisions')
      .insert({
        quote_id: quoteId,
        price: proposedPrice,
        scope_summary: scopeChanges,
        delivery_date: deliveryDate,
        changed_by: proposedBy,
        change_reason: 'Counter offer submitted'
      });

    if (revisionError) throw revisionError;

    // Send notification
    const { buyerId, vendorId } = await supabase
      .from('negotiation_threads')
      .select('buyer_id, vendor_id')
      .eq('id', negotiationId)
      .single();

    const notifiedUserId = proposedBy === buyerId ? vendorId : buyerId;
    await supabase
      .from('notifications')
      .insert({
        user_id: notifiedUserId,
        type: 'counter_offer',
        title: 'New Counter Offer',
        description: `A counter offer of ${proposedPrice} has been submitted`,
        action_id: counterOffer.id
      });

    return res.status(200).json({
      success: true,
      counterOffer: counterOffer
    });

  } catch (error) {
    console.error('Counter offer error:', error);
    return res.status(500).json({
      error: 'Failed to submit counter offer',
      details: error.message
    });
  }
}
```

#### 2.3 Add Q&A to Negotiation Endpoint

**File:** `pages/api/negotiations/qa.js` (200 lines)

```javascript
// POST /api/negotiations/qa
// Add a question or answer to negotiation thread

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Create new Q&A item
    try {
      const { 
        negotiationId, 
        quoteId, 
        askedBy, 
        question, 
        answer = null,
        answeredBy = null
      } = req.body;

      const { data: qa, error } = await supabase
        .from('negotiation_qa')
        .insert({
          negotiation_id: negotiationId,
          quote_id: quoteId,
          asked_by: askedBy,
          question: question,
          answer: answer,
          answered_at: answer ? new Date().toISOString() : null,
          answered_by: answeredBy
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        qa: qa
      });

    } catch (error) {
      console.error('Create Q&A error:', error);
      return res.status(500).json({
        error: 'Failed to create Q&A',
        details: error.message
      });
    }

  } else if (req.method === 'PUT') {
    // Update Q&A with answer
    try {
      const { qaId, answer, answeredBy } = req.body;

      const { data: qa, error } = await supabase
        .from('negotiation_qa')
        .update({
          answer: answer,
          answered_by: answeredBy,
          answered_at: new Date().toISOString()
        })
        .eq('id', qaId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        qa: qa
      });

    } catch (error) {
      console.error('Update Q&A error:', error);
      return res.status(500).json({
        error: 'Failed to update Q&A',
        details: error.message
      });
    }

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
```

#### 2.4 Fetch Negotiation Details Endpoint

**File:** `pages/api/negotiations/[negotiationId].js` (200 lines)

```javascript
// GET /api/negotiations/[negotiationId]
// Fetch complete negotiation thread with all details

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { negotiationId } = req.query;

    if (!negotiationId) {
      return res.status(400).json({ error: 'negotiationId is required' });
    }

    // Fetch negotiation thread
    const { data: thread, error: threadError } = await supabase
      .from('negotiation_threads')
      .select('*')
      .eq('id', negotiationId)
      .single();

    if (threadError) throw threadError;

    // Fetch counter offers
    const { data: counterOffers, error: offersError } = await supabase
      .from('counter_offers')
      .select('*')
      .eq('negotiation_id', negotiationId)
      .order('created_at', { ascending: false });

    if (offersError) throw offersError;

    // Fetch Q&A
    const { data: qaItems, error: qaError } = await supabase
      .from('negotiation_qa')
      .select('*')
      .eq('negotiation_id', negotiationId)
      .order('created_at', { ascending: true });

    if (qaError) throw qaError;

    // Fetch revisions
    const { data: revisions, error: revisionsError } = await supabase
      .from('quote_revisions')
      .select('*')
      .eq('quote_id', thread.quote_id)
      .order('created_at', { ascending: false });

    if (revisionsError) throw revisionsError;

    return res.status(200).json({
      thread: thread,
      counterOffers: counterOffers || [],
      qaItems: qaItems || [],
      revisions: revisions || []
    });

  } catch (error) {
    console.error('Fetch negotiation error:', error);
    return res.status(500).json({
      error: 'Failed to fetch negotiation',
      details: error.message
    });
  }
}
```

---

### Phase 3: Frontend - React Hooks (60 minutes)

#### 3.1 useQuoteNegotiation Hook

**File:** `hooks/useQuoteNegotiation.js` (300 lines)

```javascript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useQuoteNegotiation = (negotiationId) => {
  const { user } = useAuth();
  const [negotiation, setNegotiation] = useState(null);
  const [counterOffers, setCounterOffers] = useState([]);
  const [qaItems, setQaItems] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch negotiation data
  const fetchNegotiation = useCallback(async (id) => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/negotiations/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch negotiation');
      }

      const data = await response.json();
      setNegotiation(data.thread);
      setCounterOffers(data.counterOffers);
      setQaItems(data.qaItems);
      setRevisions(data.revisions);

    } catch (err) {
      console.error('Fetch negotiation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit counter offer
  const submitCounterOffer = useCallback(async (quoteId, proposedPrice, scopeChanges, deliveryDate, notes) => {
    try {
      const response = await fetch('/api/negotiations/counter-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negotiationId,
          quoteId,
          proposedBy: user?.id,
          proposedPrice,
          scopeChanges,
          deliveryDate,
          notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit counter offer');
      }

      const data = await response.json();
      setCounterOffers([data.counterOffer, ...counterOffers]);
      return data.counterOffer;

    } catch (err) {
      console.error('Submit counter offer error:', err);
      throw err;
    }
  }, [negotiationId, user?.id, counterOffers]);

  // Add question
  const addQuestion = useCallback(async (quoteId, question) => {
    try {
      const response = await fetch('/api/negotiations/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negotiationId,
          quoteId,
          askedBy: user?.id,
          question
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add question');
      }

      const data = await response.json();
      setQaItems([...qaItems, data.qa]);
      return data.qa;

    } catch (err) {
      console.error('Add question error:', err);
      throw err;
    }
  }, [negotiationId, user?.id, qaItems]);

  // Answer question
  const answerQuestion = useCallback(async (qaId, answer) => {
    try {
      const response = await fetch('/api/negotiations/qa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qaId,
          answer,
          answeredBy: user?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to answer question');
      }

      const data = await response.json();
      setQaItems(qaItems.map(qa => qa.id === qaId ? data.qa : qa));
      return data.qa;

    } catch (err) {
      console.error('Answer question error:', err);
      throw err;
    }
  }, [user?.id, qaItems]);

  // Fetch on mount
  useEffect(() => {
    if (negotiationId) {
      fetchNegotiation(negotiationId);
    }
  }, [negotiationId, fetchNegotiation]);

  return {
    negotiation,
    counterOffers,
    qaItems,
    revisions,
    loading,
    error,
    submitCounterOffer,
    addQuestion,
    answerQuestion,
    refetch: () => fetchNegotiation(negotiationId)
  };
};

export default useQuoteNegotiation;
```

---

### Phase 4: Frontend - Components (90 minutes)

#### 4.1 NegotiationThread Component

**File:** `components/NegotiationThread.js` (350 lines)

Shows complete negotiation timeline with counter offers, Q&A, and revisions.

#### 4.2 CounterOfferForm Component

**File:** `components/CounterOfferForm.js` (250 lines)

Form for submitting counter offers with price, scope changes, and delivery date.

#### 4.3 NegotiationQA Component

**File:** `components/NegotiationQA.js` (200 lines)

Q&A thread display and form for asking/answering questions.

#### 4.4 RevisionTimeline Component

**File:** `components/RevisionTimeline.js` (200 lines)

Visual timeline of all quote revisions and price changes.

---

### Phase 5: Integration & Testing (60 minutes)

#### 5.1 Add Negotiation Tab to Quote View
- Link from quote comparison page
- Embedded in quote details modal

#### 5.2 Add Counter Offer Notifications
- Real-time notifications when offers submitted
- Activity stream in negotiation thread

#### 5.3 Mobile Responsive Design
- Mobile-friendly forms
- Touch-friendly interface
- Responsive layout

---

## 📊 Implementation Checklist

### Database
- [ ] Create negotiation_threads table with indexes
- [ ] Create counter_offers table
- [ ] Create negotiation_qa table
- [ ] Create quote_revisions table
- [ ] Add RLS policies for all tables
- [ ] Create triggers for timestamps

### API Endpoints
- [ ] POST /api/negotiations/create
- [ ] POST /api/negotiations/counter-offer
- [ ] POST/PUT /api/negotiations/qa
- [ ] GET /api/negotiations/[negotiationId]

### Hooks
- [ ] Create useQuoteNegotiation hook
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add caching

### Components
- [ ] NegotiationThread (timeline view)
- [ ] CounterOfferForm (submission form)
- [ ] NegotiationQA (Q&A section)
- [ ] RevisionTimeline (price history)
- [ ] Responsive design for all

### Integration
- [ ] Add to quote comparison page
- [ ] Add notifications
- [ ] Add to buyer dashboard
- [ ] Add to vendor dashboard
- [ ] Real-time updates

### Testing
- [ ] Test counter offer submission
- [ ] Test Q&A functionality
- [ ] Test revision tracking
- [ ] Test mobile responsiveness
- [ ] Test error scenarios

### Documentation
- [ ] Create Task 10 summary
- [ ] API documentation
- [ ] Component usage examples
- [ ] Database schema docs

---

## 🎯 Success Criteria

✅ **Functional Requirements**
- Counter offers work end-to-end
- Q&A threads functional
- Revision history tracked
- Real-time updates (if using subscriptions)
- Proper price change tracking

✅ **Code Quality**
- 0 build errors
- 0 runtime errors
- Clean code with comments
- Proper error handling
- Input validation

✅ **User Experience**
- Intuitive negotiation flow
- Clear counter offer status
- Easy Q&A submission
- Mobile-friendly interface
- Fast loading times

✅ **Performance**
- API responses < 500ms
- Component renders < 1s
- Database queries optimized
- Smooth animations

✅ **Documentation**
- Complete API docs
- Component documentation
- Usage examples
- Clear explanations

---

## 🚀 Ready to Start!

All prerequisites in place:
- ✅ Platform live
- ✅ Database accessible
- ✅ Development environment ready
- ✅ Component framework established

**Estimated completion:** 4-5 hours focused development

**This is the final task to reach 100%!** Let's build! 💪
