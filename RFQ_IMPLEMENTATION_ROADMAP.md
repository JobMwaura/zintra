# RFQ Flow - Implementation Roadmap to Complete the Marketplace

**Objective:** Fix broken flows and complete the buyer-vendor lifecycle  
**Timeline:** 3 weeks  
**Current Status:** 60-70% complete - missing job assignment and closure

---

## 🎯 PHASE 1: CRITICAL PATH (This Week)

### 1. Job Assignment Workflow

**Problem:** User accepts quote but deal is never formally closed. No way for vendor to know they're hired.

**Solution:** Create formal "Job Assignment" mechanism

**Files to Create:**
```
/api/rfq/assign-job/route.js
/components/JobAssignmentModal.jsx
```

**Database Changes:**
```sql
-- New table to track active projects
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  rfq_id UUID REFERENCES rfqs(id),
  assigned_vendor_id UUID REFERENCES profiles(id),
  assigned_by_user_id UUID REFERENCES profiles(id),
  status VARCHAR(20) DEFAULT 'pending',  -- pending, confirmed, in_progress, completed
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add column to rfqs to track assignment
ALTER TABLE rfqs ADD COLUMN assigned_vendor_id UUID REFERENCES profiles(id);
ALTER TABLE rfqs ADD COLUMN status VARCHAR(20) DEFAULT 'open';
-- Existing statuses: open, assigned, completed

-- Add index for faster queries
CREATE INDEX idx_projects_vendor ON projects(assigned_vendor_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_rfqs_assigned_vendor ON rfqs(assigned_vendor_id);
```

**UI Changes (quote-comparison/[rfqId]/page.js):**

Current state after acceptance:
```
Accept button → status changes → page refreshes
```

New state after acceptance:
```
Accept button → status changes → Modal appears
              ↓
         "Ready to Hire This Vendor?"
         ├─ Confirm vendor details
         ├─ Set start date
         ├─ Add project notes
         └─ "Assign as Contractor" button
              ↓
         Project created with status='pending'
              ↓
         Notification sent to vendor
              ↓
         Redirect to project details page
```

**Implementation Checklist:**
- [ ] Create `projects` table
- [ ] Create `/api/rfq/assign-job/route.js` 
- [ ] Create `JobAssignmentModal.jsx`
- [ ] Add "Assign" button in quote-comparison page
- [ ] Update RFQ status to 'assigned' when job assigned
- [ ] Create notification on assignment
- [ ] Redirect to project page after assignment
- [ ] Add `/app/projects/[projectId]/page.js` to view project details
- [ ] Allow vendor to accept/decline assignment (vendor see "Accept Job" button)

**Code Template:**

```javascript
// /api/rfq/assign-job/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req) {
  const { rfqId, vendorId, startDate, notes } = await req.json()
  const supabase = createRouteHandlerClient({ cookies })

  // Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify user owns RFQ
  const { data: rfq } = await supabase
    .from('rfqs')
    .select('user_id')
    .eq('id', rfqId)
    .single()

  if (rfq.user_id !== user.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Create project assignment
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      rfq_id: rfqId,
      assigned_vendor_id: vendorId,
      assigned_by_user_id: user.id,
      status: 'pending',
      start_date: startDate,
      notes: notes
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })

  // Update RFQ status
  await supabase
    .from('rfqs')
    .update({
      status: 'assigned',
      assigned_vendor_id: vendorId
    })
    .eq('id', rfqId)

  // Create notification for vendor
  // (See Phase 1, Step 2)

  return Response.json({ project })
}
```

---

### 2. Vendor Notifications System

**Problem:** Vendor doesn't know when:
- They receive new RFQ
- User accepts/rejects their quote
- User sends message
- User assigns job

**Solution:** Create notifications table and trigger notifications on events

**Database Changes:**
```sql
-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type VARCHAR(50),  -- rfq_sent, quote_accepted, quote_rejected, job_assigned, message_received
  title VARCHAR(255),
  message TEXT,
  related_rfq_id UUID REFERENCES rfqs(id),
  related_project_id UUID REFERENCES projects(id),
  related_user_id UUID REFERENCES profiles(id),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
```

**Files to Create:**
```
/hooks/useNotifications.js
/components/NotificationBell.jsx
/app/api/notifications/route.js
```

**Notification Events to Trigger:**

1. **New RFQ sent to vendor:**
   ```javascript
   // After RFQ created + vendor selected
   await supabase.from('notifications').insert({
     user_id: vendorId,
     type: 'rfq_sent',
     title: `New RFQ: ${rfqData.title}`,
     message: `${buyerName} posted "${rfqData.title}" - Budget: KES ${rfqData.budget_min}`,
     related_rfq_id: rfqId,
     related_user_id: buyerId
   })
   ```

2. **Quote accepted by user:**
   ```javascript
   await supabase.from('notifications').insert({
     user_id: vendorId,
     type: 'quote_accepted',
     title: `Quote Accepted - "${rfqData.title}"`,
     message: `${buyerName} accepted your quote for KES ${quote.amount}`,
     related_rfq_id: rfqId,
     related_user_id: buyerId
   })
   ```

3. **Job assigned:**
   ```javascript
   await supabase.from('notifications').insert({
     user_id: vendorId,
     type: 'job_assigned',
     title: `You've Been Hired - "${rfqData.title}"`,
     message: `${buyerName} has assigned you the job. Start date: ${project.start_date}`,
     related_project_id: projectId,
     related_user_id: buyerId
   })
   ```

**Hook Implementation:**
```javascript
// /hooks/useNotifications.js
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Fetch notifications
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.read).length || 0)
    }

    fetchNotifications()

    // Subscribe to new notifications
    const subscription = supabase
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        setNotifications([payload.new, ...notifications])
        if (!payload.new.read) setUnreadCount(unreadCount + 1)
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [supabase])

  const markAsRead = async (notificationId) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
  }

  return { notifications, unreadCount, markAsRead }
}
```

**UI - NotificationBell.jsx:**
```jsx
'use client'
import { useNotifications } from '@/hooks/useNotifications'
import { Bell } from 'lucide-react'

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button className="relative p-2 hover:bg-gray-100 rounded">
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white 
                          text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg 
                        rounded-lg z-50">
          <div className="p-4 border-b font-bold">Notifications</div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">No notifications</div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 
                    ${!notif.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="font-semibold text-sm">{notif.title}</div>
                  <div className="text-xs text-gray-600">{notif.message}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(notif.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Implementation Checklist:**
- [ ] Create `notifications` table
- [ ] Create `/hooks/useNotifications.js`
- [ ] Create `/components/NotificationBell.jsx`
- [ ] Add NotificationBell to navbar
- [ ] Update RFQ creation to send notification
- [ ] Update quote acceptance to send notification
- [ ] Update job assignment to send notification
- [ ] (Later) Add email notifications
- [ ] (Later) Add SMS notifications

---

### 3. Fix Amount Field (Number Not Text)

**Problem:** Amount stored as TEXT, can't:
- Sort quotes by price
- Compare numerically
- Ensure consistency

**Solution:** Change field type and add validation

**Database Migration:**
```sql
-- Create new numeric column
ALTER TABLE rfq_responses ADD COLUMN amount_numeric NUMERIC(12,2);

-- Migrate data (if any)
UPDATE rfq_responses 
SET amount_numeric = CAST(REGEXP_REPLACE(amount, '[^0-9.]', '') AS NUMERIC)
WHERE amount IS NOT NULL;

-- Drop old column and rename
ALTER TABLE rfq_responses DROP COLUMN amount;
ALTER TABLE rfq_responses RENAME COLUMN amount_numeric TO amount;

-- Make it required
ALTER TABLE rfq_responses ALTER COLUMN amount SET NOT NULL;
```

**UI Changes - RFQsTab.js:**
```javascript
// Before:
<input 
  type="text" 
  value={responseData.amount}
  onChange={(e) => setResponseData({...responseData, amount: e.target.value})}
/>

// After:
<input 
  type="number" 
  step="0.01"
  value={responseData.amount}
  onChange={(e) => setResponseData({...responseData, amount: parseFloat(e.target.value)})}
  placeholder="e.g., 50000"
/>
```

**Quote Export Update - quote-comparison page:**
```javascript
// Amount will now sort correctly by default since it's numeric
const sortedQuotes = quotes.sort((a, b) => a.amount - b.amount)

// CSV export
const csvData = quotes.map(q => ({
  'Vendor': q.vendor_name,
  'Amount': `KES ${q.amount.toLocaleString()}`,  // Format for display
  'Timeline': q.timeline,
  'Status': q.status
}))
```

**Implementation Checklist:**
- [ ] Create database migration
- [ ] Update RFQsTab.js form field (type="number")
- [ ] Add input validation
- [ ] Update quote-comparison display (format as currency)
- [ ] Update exports (proper numeric sorting)
- [ ] Test data migration

---

## 📊 IMPLEMENTATION TRACKING

### Phase 1 Tasks Summary

| Task | Complexity | Time | Priority | Status |
|------|-----------|------|----------|--------|
| 1. Job Assignment | Medium | 4-5h | CRITICAL | ⬜ Not Started |
| 2. Notifications | Medium | 3-4h | CRITICAL | ⬜ Not Started |
| 3. Amount Field Fix | Low | 1-2h | HIGH | ⬜ Not Started |

**Total Phase 1 Time:** 8-11 hours
**Recommended Pace:** 2-3h per day, complete this week

---

## 🚀 PHASE 2: HIGH-IMPACT (Next Week)

### 1. Integrate Messaging with RFQ Context
- [ ] Add `rfq_id` to messages table
- [ ] Update message form to pre-select RFQ
- [ ] Show RFQ context in message threads
- [ ] Create quick-access messaging from quote-comparison page
- Time: 3-4 hours

### 2. Add RFQ Type Badges
- [ ] Show [Direct], [Wizard], [Public] badge on RFQs
- [ ] Show "Recipients: 3 vendors" on user dashboard
- [ ] Show "This is a direct invite" to vendor in inbox
- Time: 1-2 hours

### 3. Duplicate Quote Prevention
- [ ] Check before submission
- [ ] Show "You already quoted this" message
- [ ] Offer to update existing quote option
- Time: 1 hour

**Total Phase 2 Time:** 5-7 hours

---

## 🔧 PHASE 3: TECHNICAL DEBT (Following Week)

### 1. Enforce Public RFQ Visibility Scope
- [ ] Check visibility scope in vendor inbox query
- [ ] Filter by county/state/national scope
- Time: 1-2 hours

### 2. Clean Data Structure
- [ ] Move JSONB fields to proper columns
- [ ] Maintain backward compatibility
- [ ] Migrate existing data
- Time: 3-4 hours

### 3. Complete RFQ Status Lifecycle
- [ ] Define all possible statuses: open → assigned → in_progress → completed
- [ ] Add transitions between statuses
- [ ] Show status clearly in UI
- Time: 2-3 hours

**Total Phase 3 Time:** 6-9 hours

---

## ✅ SUCCESS CRITERIA

### Phase 1 Complete When:
✅ User can accept quote and formally assign job to vendor  
✅ Vendor receives notification that they're assigned  
✅ Both user and vendor see project details page  
✅ Vendor can accept/decline assignment  
✅ Amount field properly stores/displays as numbers  
✅ All notifications sent correctly  

### Full Marketplace Ready When:
✅ Complete user → vendor → project → completion flow works  
✅ Notifications keep both parties informed  
✅ RFQ types are clear and visible  
✅ Quotes can be easily compared by price  
✅ Messages linked to specific RFQs  
✅ All status transitions clear  

---

## 📝 NEXT STEPS

### Immediate (Today)
1. Review this roadmap
2. Prioritize which fix to start with
3. Create database migrations if approving Phase 1

### Start (Tomorrow)
1. Begin with Job Assignment (most critical)
2. Set up notifications system in parallel
3. Deploy to test environment daily

### Testing Strategy
- [ ] Manual testing of each flow
- [ ] Test with real vendor/buyer accounts
- [ ] Verify notifications send
- [ ] Test edge cases (duplicate quotes, cancelled jobs, etc.)
- [ ] Load test notifications

---

## 🎯 RECOMMENDATION

**Start immediately with Phase 1** because:

1. **Job Assignment is the blocker** - Nothing works until deal is officially closed
2. **Notifications are essential** - Users/vendors won't use system without knowing what's happening
3. **Amount field is quick win** - Takes 2h but improves usability significantly

Once Phase 1 is complete, marketplace is **functional end-to-end**, then Phase 2/3 are enhancements.

**Estimated Full Completion:** 3 weeks
**Current Readiness:** 60% → Target 95% after Phase 1

---

*Document created for Zintra Platform RFQ Marketplace  
Status: Ready for Implementation  
Next Review: After Phase 1 completion*
