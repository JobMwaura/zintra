# 🎯 TASK 9: BUYER REPUTATION SYSTEM - IMPLEMENTATION PLAN

## Overview
Build a comprehensive buyer reputation system that calculates reputation scores based on RFQ activity, generates tier badges (Bronze/Silver/Gold/Platinum), and displays reputation information across the platform.

**Estimated Duration:** 3-4 hours  
**Target LOC:** 1,000+ lines  
**Components:** 4 components  
**API Endpoints:** 2 endpoints  
**Database Changes:** 1 new table  

---

## 📋 Task Breakdown

### Phase 1: Database Setup (15 minutes)

#### 1.1 Create reputation_scores Table
```sql
CREATE TABLE reputation_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_rfqs INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  acceptance_rate DECIMAL(5,2) DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,
  badge_tier TEXT DEFAULT 'bronze',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reputation_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own reputation
CREATE POLICY "Users can view their own reputation"
  ON reputation_scores FOR SELECT
  USING (auth.uid() = buyer_id);

-- RLS Policy: Users can view any reputation (public data)
CREATE POLICY "Anyone can view reputation"
  ON reputation_scores FOR SELECT
  USING (true);
```

#### 1.2 Add reputation reference to users table
```sql
ALTER TABLE users ADD COLUMN reputation_score INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN badge_tier TEXT DEFAULT 'bronze';
```

#### 1.3 Create triggers to update timestamps
```sql
CREATE TRIGGER update_reputation_scores_timestamp
  BEFORE UPDATE ON reputation_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### Phase 2: Backend Logic (60 minutes)

#### 2.1 Create useBuyerReputation Hook

**File:** `hooks/useBuyerReputation.js` (250 lines)

```javascript
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useBuyerReputation = (buyerId = null) => {
  const { user } = useAuth();
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch reputation data
  const fetchReputation = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reputation/${id}`, {
        headers: {
          'Authorization': `Bearer ${user?.id}`
        }
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setReputation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate reputation score
  const calculateScore = (rfqCount, responseRate, acceptanceRate) => {
    const rfqScore = Math.min(rfqCount * 2, 30); // Max 30 points
    const responseScore = (responseRate / 100) * 35; // Max 35 points
    const acceptanceScore = (acceptanceRate / 100) * 35; // Max 35 points
    return Math.round(rfqScore + responseScore + acceptanceScore);
  };

  // Get badge tier based on score
  const getBadgeTier = (score) => {
    if (score >= 75) return 'platinum';
    if (score >= 50) return 'gold';
    if (score >= 25) return 'silver';
    return 'bronze';
  };

  // Format reputation data
  const formatReputation = (data) => {
    const score = calculateScore(
      data.total_rfqs,
      data.response_rate,
      data.acceptance_rate
    );
    const tier = getBadgeTier(score);
    return {
      ...data,
      reputation_score: score,
      badge_tier: tier
    };
  };

  useEffect(() => {
    if (buyerId || user?.id) {
      fetchReputation(buyerId || user.id);
    }
  }, [buyerId, user?.id]);

  return {
    reputation,
    loading,
    error,
    calculateScore,
    getBadgeTier,
    formatReputation,
    refetch: () => fetchReputation(buyerId || user?.id)
  };
};
```

#### 2.2 Create API Endpoint: Calculate Reputation

**File:** `pages/api/reputation/calculate.js` (200 lines)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { buyerId } = req.body;

    if (!buyerId) {
      return res.status(400).json({ error: 'buyerId is required' });
    }

    // Get user's RFQs
    const { data: rfqs, error: rfqError } = await supabase
      .from('rfqs')
      .select('id, status, created_at')
      .eq('buyer_id', buyerId);

    if (rfqError) throw rfqError;

    // Calculate metrics
    const totalRfqs = rfqs.length;
    const closedRfqs = rfqs.filter(r => r.status === 'closed').length;
    const responseRate = totalRfqs > 0 ? (closedRfqs / totalRfqs) * 100 : 0;

    // Get quote acceptance rate
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id, selected')
      .eq('rfq_buyer_id', buyerId);

    if (quotesError) throw quotesError;

    const selectedQuotes = quotes.filter(q => q.selected).length;
    const acceptanceRate = quotes.length > 0 ? (selectedQuotes / quotes.length) * 100 : 0;

    // Calculate score
    const rfqScore = Math.min(totalRfqs * 2, 30);
    const responseScore = (responseRate / 100) * 35;
    const acceptanceScore = (acceptanceRate / 100) * 35;
    const reputationScore = Math.round(rfqScore + responseScore + acceptanceScore);

    // Determine badge tier
    let badgeTier = 'bronze';
    if (reputationScore >= 75) badgeTier = 'platinum';
    else if (reputationScore >= 50) badgeTier = 'gold';
    else if (reputationScore >= 25) badgeTier = 'silver';

    // Upsert reputation record
    const { data: reputation, error: updateError } = await supabase
      .from('reputation_scores')
      .upsert({
        buyer_id: buyerId,
        total_rfqs: totalRfqs,
        response_rate: parseFloat(responseRate.toFixed(2)),
        acceptance_rate: parseFloat(acceptanceRate.toFixed(2)),
        reputation_score: reputationScore,
        badge_tier: badgeTier,
        updated_at: new Date().toISOString()
      }, { onConflict: 'buyer_id' })
      .select()
      .single();

    if (updateError) throw updateError;

    // Update users table
    await supabase
      .from('users')
      .update({
        reputation_score: reputationScore,
        badge_tier: badgeTier
      })
      .eq('id', buyerId);

    return res.status(200).json({
      success: true,
      reputation: reputation,
      metrics: {
        totalRfqs,
        responseRate: parseFloat(responseRate.toFixed(2)),
        acceptanceRate: parseFloat(acceptanceRate.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Reputation calculation error:', error);
    return res.status(500).json({
      error: 'Failed to calculate reputation',
      details: error.message
    });
  }
}
```

#### 2.3 Create API Endpoint: Get Reputation

**File:** `pages/api/reputation/[buyerId].js` (150 lines)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { buyerId } = req.query;

    if (!buyerId) {
      return res.status(400).json({ error: 'buyerId is required' });
    }

    // Get reputation data
    const { data: reputation, error } = await supabase
      .from('reputation_scores')
      .select('*')
      .eq('buyer_id', buyerId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no reputation record, return default
    if (!reputation) {
      return res.status(200).json({
        buyer_id: buyerId,
        total_rfqs: 0,
        response_rate: 0,
        acceptance_rate: 0,
        reputation_score: 0,
        badge_tier: 'bronze',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    return res.status(200).json(reputation);
  } catch (error) {
    console.error('Fetch reputation error:', error);
    return res.status(500).json({
      error: 'Failed to fetch reputation',
      details: error.message
    });
  }
}
```

---

### Phase 3: Frontend Components (60 minutes)

#### 3.1 BuyerReputationBadge Component

**File:** `components/BuyerReputationBadge.js` (120 lines)

```javascript
import { Award, Star, Crown, Zap } from 'lucide-react';

const badgeConfig = {
  bronze: {
    color: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
    bgColor: 'bg-orange-500',
    label: 'Bronze',
    icon: Award,
    description: 'Starting reputation'
  },
  silver: {
    color: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    bgColor: 'bg-gray-500',
    label: 'Silver',
    icon: Star,
    description: 'Good reputation'
  },
  gold: {
    color: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    bgColor: 'bg-yellow-500',
    label: 'Gold',
    icon: Zap,
    description: 'Excellent reputation'
  },
  platinum: {
    color: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-600',
    label: 'Platinum',
    icon: Crown,
    description: 'Outstanding reputation'
  }
};

export default function BuyerReputationBadge({ tier = 'bronze', score = 0, size = 'md' }) {
  const config = badgeConfig[tier] || badgeConfig.bronze;
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs px-2 py-1',
    md: 'w-8 h-8 text-sm px-3 py-2',
    lg: 'w-10 h-10 text-base px-4 py-3'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${config.color} ${config.textColor} rounded-full p-2 border ${config.borderColor} flex items-center justify-center ${sizeClasses[size]}`}>
        <IconComponent className="w-full h-full" />
      </div>
      <div>
        <p className={`font-semibold ${config.textColor}`}>{config.label}</p>
        <p className="text-xs text-gray-600">{score}/100 points</p>
      </div>
    </div>
  );
}
```

#### 3.2 BuyerReputationProfile Component

**File:** `components/BuyerReputationProfile.js` (200 lines)

```javascript
import { useBuyerReputation } from '@/hooks/useBuyerReputation';
import BuyerReputationBadge from './BuyerReputationBadge';
import { Loader } from 'lucide-react';

export default function BuyerReputationProfile({ buyerId }) {
  const { reputation, loading, error } = useBuyerReputation(buyerId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Failed to load reputation: {error}</p>
      </div>
    );
  }

  if (!reputation) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-700">No reputation data available</p>
      </div>
    );
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'bg-blue-600';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Buyer Reputation</h3>
          <p className="text-sm text-gray-600">Public reputation profile</p>
        </div>
        <BuyerReputationBadge 
          tier={reputation.badge_tier} 
          score={reputation.reputation_score}
          size="lg"
        />
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total RFQs */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">Total RFQs Posted</p>
          <p className="text-2xl font-bold text-blue-600">{reputation.total_rfqs}</p>
        </div>

        {/* Response Rate */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600">Response Rate</p>
          <p className="text-2xl font-bold text-green-600">{reputation.response_rate.toFixed(1)}%</p>
        </div>

        {/* Acceptance Rate */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600">Acceptance Rate</p>
          <p className="text-2xl font-bold text-purple-600">{reputation.acceptance_rate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Tier Information */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">Reputation Tiers</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Bronze: 0-24 points</span>
            <span className={reputation.reputation_score < 25 ? 'font-bold text-orange-600' : 'text-gray-600'}>🥉</span>
          </div>
          <div className="flex justify-between">
            <span>Silver: 25-49 points</span>
            <span className={reputation.reputation_score >= 25 && reputation.reputation_score < 50 ? 'font-bold text-gray-600' : 'text-gray-600'}>🥈</span>
          </div>
          <div className="flex justify-between">
            <span>Gold: 50-74 points</span>
            <span className={reputation.reputation_score >= 50 && reputation.reputation_score < 75 ? 'font-bold text-yellow-600' : 'text-gray-600'}>🥇</span>
          </div>
          <div className="flex justify-between">
            <span>Platinum: 75-100 points</span>
            <span className={reputation.reputation_score >= 75 ? 'font-bold text-blue-600' : 'text-gray-600'}>👑</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Overall Score</span>
          <span className="text-sm font-bold text-gray-900">{reputation.reputation_score}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full ${getProgressColor(reputation.reputation_score)} transition-all`}
            style={{ width: `${reputation.reputation_score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

#### 3.3 ReputationTier Component

**File:** `components/ReputationTier.js` (150 lines)

```javascript
import { Award, Star, Zap, Crown } from 'lucide-react';

const tiers = [
  {
    name: 'Bronze',
    range: '0-24',
    min: 0,
    max: 24,
    icon: Award,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'Starting buyer with developing reputation'
  },
  {
    name: 'Silver',
    range: '25-49',
    min: 25,
    max: 49,
    icon: Star,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    description: 'Established buyer with good track record'
  },
  {
    name: 'Gold',
    range: '50-74',
    min: 50,
    max: 74,
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'Excellent buyer with strong reputation'
  },
  {
    name: 'Platinum',
    range: '75-100',
    min: 75,
    max: 100,
    icon: Crown,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Outstanding buyer with exceptional reputation'
  }
];

export default function ReputationTier({ currentScore = 0 }) {
  const currentTier = tiers.find(t => currentScore >= t.min && currentScore <= t.max) || tiers[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const isActive = currentScore >= tier.min && currentScore <= tier.max;
          
          return (
            <div 
              key={tier.name}
              className={`${tier.bgColor} border ${tier.borderColor} rounded-lg p-4 ${isActive ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`${tier.color} w-6 h-6 mt-1`} />
                <div className="flex-1">
                  <h4 className={`font-semibold ${tier.color}`}>{tier.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{tier.range} points</p>
                  <p className="text-sm text-gray-700 mt-2">{tier.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Position */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">Your Current Position</p>
        <div className="mt-2 flex items-center gap-3">
          <div className={`${currentTier.color} text-2xl`}>
            {currentTier.name === 'Bronze' && '🥉'}
            {currentTier.name === 'Silver' && '🥈'}
            {currentTier.name === 'Gold' && '🥇'}
            {currentTier.name === 'Platinum' && '👑'}
          </div>
          <div>
            <p className={`font-bold ${currentTier.color}`}>{currentTier.name}</p>
            <p className="text-sm text-gray-600">{currentScore}/100 points</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 4: Integration & Testing (30 minutes)

#### 4.1 Display Badge on Buyer Profile

**File:** `app/user-profile/page.js` (Add to existing file)

```javascript
import BuyerReputationProfile from '@/components/BuyerReputationProfile';

// In the buyer profile section:
<BuyerReputationProfile buyerId={user.id} />
```

#### 4.2 Display Badge in Vendor Dashboard

**File:** `app/vendor-quotes/page.js` (Add to quote list)

```javascript
import BuyerReputationBadge from '@/components/BuyerReputationBadge';

// In quote list item:
<BuyerReputationBadge tier={quote.buyer_reputation} score={quote.buyer_score} />
```

#### 4.3 Display Badge in Dashboard

**File:** `app/my-rfqs/page.js` (Add to RFQ cards)

```javascript
import ReputationTier from '@/components/ReputationTier';

// In profile section:
<ReputationTier currentScore={userReputation.reputation_score} />
```

---

### Phase 5: Documentation (30 minutes)

#### 5.1 Create Task 9 Quick Reference

**File:** `TASK9_QUICK_REFERENCE.md`
- Setup instructions
- Component usage
- API documentation
- Customization guide

#### 5.2 Create API Documentation

**File:** `TASK9_API_DOCS.md`
- Endpoint specifications
- Request/response examples
- Error handling
- Rate limiting

---

## 📊 Implementation Checklist

### Database
- [ ] Create `reputation_scores` table
- [ ] Add foreign key constraints
- [ ] Enable RLS policies
- [ ] Add trigger for timestamps
- [ ] Create indexes for performance

### Hooks
- [ ] Create `useBuyerReputation` hook
- [ ] Implement score calculation
- [ ] Add error handling
- [ ] Add caching/memoization

### API Endpoints
- [ ] Create `/api/reputation/calculate.js`
- [ ] Create `/api/reputation/[buyerId].js`
- [ ] Add error handling
- [ ] Add input validation
- [ ] Add authentication checks

### Components
- [ ] Create `BuyerReputationBadge.js`
- [ ] Create `BuyerReputationProfile.js`
- [ ] Create `ReputationTier.js`
- [ ] Add styling & responsiveness
- [ ] Add loading states

### Integration
- [ ] Add badge to buyer profile
- [ ] Add reputation display to vendor dashboard
- [ ] Add tier display to user dashboard
- [ ] Add reputation recalculation trigger
- [ ] Test all flows

### Testing
- [ ] Test score calculation logic
- [ ] Test badge generation
- [ ] Test API endpoints
- [ ] Test component rendering
- [ ] Test responsive design
- [ ] Test error scenarios

### Documentation
- [ ] Create Task 9 summary
- [ ] Add API documentation
- [ ] Create quick reference guide
- [ ] Add code comments
- [ ] Document database schema

---

## 🎯 Success Criteria

✅ **Functional Requirements**
- Reputation scores calculated correctly
- Badges assigned based on score tiers
- Real-time updates when metrics change
- Visible on all relevant pages
- API endpoints working correctly

✅ **Code Quality**
- Zero build errors
- TypeScript compatibility
- Proper error handling
- Input validation
- Clean, documented code

✅ **User Experience**
- Badges clearly visible
- Reputation profile informative
- Responsive design on mobile
- Loading states shown
- Smooth transitions

✅ **Performance**
- API responses < 500ms
- Component renders < 1s
- Database queries optimized
- No unnecessary re-renders

✅ **Documentation**
- Clear setup instructions
- API documentation complete
- Code comments present
- Usage examples provided

---

## 🚀 Ready to Start!

All prerequisites are in place:
- ✅ Platform live in production
- ✅ Database accessible
- ✅ Development environment ready
- ✅ Component framework established
- ✅ API structure defined

**Estimated completion:** 3-4 hours of focused development

Let's build this! 💪
