# RFQ Marketplace - Implementation Checklist

## 📋 PRE-IMPLEMENTATION

- [ ] Review all three audit/brief documents
- [ ] Set up development database with migrations
- [ ] Create feature branch: `git checkout -b feat/rfq-job-assignment`
- [ ] Ensure Supabase schemas are updated
- [ ] Set up testing accounts (buyer, vendor, admin)

---

## 🎯 PHASE 1: CRITICAL PATH (This Week)

### Part 1A: Database Setup (30 min)

**File:** Database migrations (create in `/supabase/migrations/`)

```sql
-- [1] Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  assigned_vendor_id UUID NOT NULL REFERENCES profiles(id),
  assigned_by_user_id UUID NOT NULL REFERENCES profiles(id),
  status VARCHAR(20) DEFAULT 'pending',
  -- Statuses: pending (vendor not yet confirmed), confirmed, in_progress, completed
  start_date DATE NOT NULL,
  expected_end_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_vendor ON projects(assigned_vendor_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_rfq ON projects(rfq_id);

-- [2] Alter rfqs table to track assignment
ALTER TABLE rfqs ADD COLUMN assigned_vendor_id UUID REFERENCES profiles(id);
ALTER TABLE rfqs ADD COLUMN assigned_at TIMESTAMP;
CREATE INDEX idx_rfqs_assigned_vendor ON rfqs(assigned_vendor_id);

-- [3] Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  -- Types: rfq_sent, quote_accepted, quote_rejected, job_assigned, job_accepted, message_received
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_rfq_id UUID REFERENCES rfqs(id),
  related_project_id UUID REFERENCES projects(id),
  related_user_id UUID REFERENCES profiles(id),
  read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- [4] Fix amount field
ALTER TABLE rfq_responses ADD COLUMN amount_numeric NUMERIC(12,2);
UPDATE rfq_responses 
SET amount_numeric = CAST(
  REGEXP_REPLACE(amount, '[^0-9.]', '') AS NUMERIC
) WHERE amount IS NOT NULL AND amount ~ '^[0-9]+';
ALTER TABLE rfq_responses DROP COLUMN amount;
ALTER TABLE rfq_responses RENAME COLUMN amount_numeric TO amount;
ALTER TABLE rfq_responses ALTER COLUMN amount SET NOT NULL;
```

**Steps to execute:**
1. Create new migration file in `/supabase/migrations/`
2. Copy SQL above into file
3. Run: `npx supabase db push`
4. Verify tables created: `psql` and check `\dt`

---

### Part 1B: Backend API - Job Assignment (1-1.5h)

**File:** `/app/api/rfq/assign-job/route.js`

```javascript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req) {
  const { rfqId, vendorId, startDate, notes } = await req.json()
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // [1] Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!user || userError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // [2] Verify user owns RFQ
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('id, user_id, title, category')
      .eq('id', rfqId)
      .single()

    if (!rfq || rfq.user_id !== user.id) {
      return Response.json({ error: 'RFQ not found or unauthorized' }, { status: 404 })
    }

    // [3] Verify quote from vendor exists and is accepted
    const { data: quote } = await supabase
      .from('rfq_responses')
      .select('id, vendor_id, amount, message')
      .eq('rfq_id', rfqId)
      .eq('vendor_id', vendorId)
      .eq('status', 'accepted')
      .single()

    if (!quote) {
      return Response.json({ error: 'No accepted quote from this vendor' }, { status: 400 })
    }

    // [4] Create project assignment
    const { data: project, error: projectError } = await supabase
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

    if (projectError) {
      console.error('Project creation error:', projectError)
      return Response.json({ error: projectError.message }, { status: 400 })
    }

    // [5] Update RFQ status
    await supabase
      .from('rfqs')
      .update({
        status: 'assigned',
        assigned_vendor_id: vendorId,
        assigned_at: new Date().toISOString()
      })
      .eq('id', rfqId)

    // [6] Create notification for vendor
    await supabase
      .from('notifications')
      .insert({
        user_id: vendorId,
        type: 'job_assigned',
        title: `You've Been Hired - "${rfq.title}"`,
        message: `${user.user_metadata?.full_name || 'A client'} has assigned you the "${rfq.title}" project. Start date: ${new Date(startDate).toLocaleDateString()}`,
        related_rfq_id: rfqId,
        related_project_id: project.id,
        related_user_id: user.id,
        action_url: `/projects/${project.id}`
      })

    // [7] Create notification for user
    const { data: vendor } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', vendorId)
      .single()

    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'job_assigned',
        title: `${vendor?.full_name || 'Vendor'} Assigned`,
        message: `You successfully assigned "${rfq.title}" to ${vendor?.full_name || 'the vendor'}. They have been notified and can accept the job.`,
        related_rfq_id: rfqId,
        related_project_id: project.id,
        related_user_id: vendorId,
        action_url: `/projects/${project.id}`
      })

    return Response.json({ 
      success: true, 
      project,
      message: 'Job assigned successfully'
    })

  } catch (error) {
    console.error('Error assigning job:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Checklist:**
- [ ] File created at `/app/api/rfq/assign-job/route.js`
- [ ] Code copied and reviewed
- [ ] Test with curl: `curl -X POST http://localhost:3000/api/rfq/assign-job -H "Content-Type: application/json" -d '{"rfqId":"xxx","vendorId":"yyy","startDate":"2026-01-20","notes":""}'`

---

### Part 1C: Hook for Notifications (45 min)

**File:** `/hooks/useNotifications.js`

```javascript
'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.read).length || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchNotifications()

    // Subscribe to new notifications
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const subscription = supabase
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications([payload.new, ...notifications])
        if (!payload.new.read) {
          setUnreadCount(prev => prev + 1)
        }
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [supabase, fetchNotifications])

  const markAsRead = async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      setNotifications(notifs =>
        notifs.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      setNotifications(notifs => notifs.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  }
}
```

**Checklist:**
- [ ] File created at `/hooks/useNotifications.js`
- [ ] Code copied and tested with console.log

---

### Part 1D: Notification Bell Component (45 min)

**File:** `/components/NotificationBell.jsx`

```jsx
'use client'
import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import Link from 'next/link'

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition"
        aria-label="Notifications"
      >
        <Bell size={24} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white 
                          text-xs font-bold rounded-full w-5 h-5 
                          flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl 
                        rounded-lg z-50 border border-gray-200">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-bold text-lg">Notifications</h3>
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 
                    transition ${!notif.read ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    if (!notif.read) markAsRead(notif.id)
                    if (notif.action_url) {
                      window.location.href = notif.action_url
                    }
                  }}
                >
                  {/* Unread Indicator */}
                  {!notif.read && (
                    <div className="absolute left-3 top-4 w-2 h-2 
                                  bg-blue-600 rounded-full"></div>
                  )}

                  <div className="ml-3">
                    <div className="font-semibold text-sm">
                      {notif.title}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {notif.message}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(notif.created_at).toLocaleDateString()} at{' '}
                      {new Date(notif.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t text-center">
              <Link href="/notifications">
                <a className="text-blue-600 text-sm hover:underline">
                  View all notifications
                </a>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Close when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  )
}
```

**Checklist:**
- [ ] File created at `/components/NotificationBell.jsx`
- [ ] Add to navbar: `import { NotificationBell } from '@/components/NotificationBell'`
- [ ] Add in navbar JSX: `<NotificationBell />`

---

### Part 1E: UI - Add "Assign Job" Button (1h)

**File:** `/app/quote-comparison/[rfqId]/page.js`

Find the section where you handle quote acceptance (around line 280-320) and add after `handleAcceptQuote`:

```javascript
// Add new state for job assignment
const [selectedVendor, setSelectedVendor] = useState(null)
const [showAssignModal, setShowAssignModal] = useState(false)
const [startDate, setStartDate] = useState('')
const [assignmentNotes, setAssignmentNotes] = useState('')
const [isAssigning, setIsAssigning] = useState(false)

// Add handler
const handleAssignJob = async () => {
  if (!startDate) {
    alert('Please select a start date')
    return
  }

  setIsAssigning(true)

  try {
    const res = await fetch('/api/rfq/assign-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rfqId,
        vendorId: selectedVendor.vendor_id,
        startDate,
        notes: assignmentNotes
      })
    })

    if (!res.ok) {
      const { error } = await res.json()
      alert('Error: ' + error)
      return
    }

    const { project } = await res.json()
    alert('Job assigned successfully!')
    setShowAssignModal(false)
    
    // Redirect to project page
    router.push(`/projects/${project.id}`)
  } catch (error) {
    console.error('Error:', error)
    alert('Error assigning job')
  } finally {
    setIsAssigning(false)
  }
}
```

Now find where you render the "Accept" button for each quote (around line 380) and add this after it:

```jsx
{quote.status === 'accepted' && (
  <button
    onClick={() => {
      setSelectedVendor(quote)
      setShowAssignModal(true)
    }}
    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 
               transition ml-2"
  >
    Assign Job
  </button>
)}
```

Add this modal at the bottom of the component (before final return):

```jsx
{showAssignModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center 
                  justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-96">
      <h2 className="text-2xl font-bold mb-4">Assign Job to {selectedVendor?.vendor_name}</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block font-semibold mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Notes (Optional)</label>
          <textarea
            value={assignmentNotes}
            onChange={(e) => setAssignmentNotes(e.target.value)}
            className="w-full border rounded px-3 py-2 h-24"
            placeholder="Any additional instructions..."
          ></textarea>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowAssignModal(false)}
            className="px-4 py-2 border rounded hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignJob}
            disabled={isAssigning}
            className="px-4 py-2 bg-green-600 text-white rounded 
                       hover:bg-green-700 transition disabled:opacity-50"
          >
            {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
```

**Checklist:**
- [ ] Update `/app/quote-comparison/[rfqId]/page.js`
- [ ] Test: Accept a quote, "Assign Job" button appears
- [ ] Test: Click "Assign Job", modal shows
- [ ] Test: Submit with date, job assignment succeeds
- [ ] Verify notification sent to vendor in database

---

### Part 1F: Test Phase 1 (1h)

**Testing Checklist:**

```
[ ] Database migrations applied
  - [ ] `projects` table exists
  - [ ] `notifications` table exists
  - [ ] `rfqs` altered with assigned_vendor_id

[ ] Job Assignment Works
  - [ ] Create test RFQ
  - [ ] Have vendor submit quote
  - [ ] Accept quote as buyer
  - [ ] "Assign Job" button appears
  - [ ] Fill form and submit
  - [ ] Project created in database
  - [ ] RFQ status changed to 'assigned'
  - [ ] Vendor notified (check notifications table)

[ ] Notifications Work
  - [ ] Notification bell appears in navbar
  - [ ] Shows unread count
  - [ ] Displays notifications in dropdown
  - [ ] Can mark as read
  - [ ] Can click to navigate to project

[ ] Amount Field
  - [ ] Numeric input works
  - [ ] Can submit quote with number
  - [ ] Displays correctly in comparison

[ ] Data Integrity
  - [ ] Check projects table has correct records
  - [ ] Check notifications table for correct entries
  - [ ] Verify RFQ status updated correctly
```

**Test SQL Queries:**
```sql
-- Check projects created
SELECT * FROM projects ORDER BY created_at DESC LIMIT 5;

-- Check notifications
SELECT * FROM notifications WHERE user_id = '[vendor-uuid]' ORDER BY created_at DESC;

-- Check RFQ status
SELECT id, title, status, assigned_vendor_id FROM rfqs ORDER BY created_at DESC LIMIT 5;
```

---

## ✅ PHASE 1 COMPLETE CRITERIA

Project is ready to merge when ALL of the following are true:

- [ ] All 4 database tables created/altered successfully
- [ ] Job assignment API endpoint responds correctly
- [ ] Notifications hook fetches and updates correctly
- [ ] Notification bell renders in navbar
- [ ] "Assign Job" button appears after accepting quote
- [ ] Job assignment modal works end-to-end
- [ ] Vendor receives notification when assigned
- [ ] Project record created in database
- [ ] RFQ status updated to 'assigned'
- [ ] Amount field stores as numeric
- [ ] All tests pass (see Testing Checklist above)
- [ ] No console errors
- [ ] Code reviewed and committed

**Commit Message:**
```
git add .
git commit -m "Feat: Add job assignment workflow, notifications system, and fix amount field

- Create projects table for tracking assigned jobs
- Create notifications table for user/vendor updates  
- Add job assignment API endpoint (/api/rfq/assign-job)
- Add useNotifications hook for real-time updates
- Add NotificationBell component to navbar
- Add 'Assign Job' button and modal to quote comparison page
- Change amount field from TEXT to NUMERIC(12,2)
- Send notifications when job assigned to vendor
- Tests: All flows working end-to-end"
```

---

## 🚀 PHASE 2 (Next Week) - Quick Reference

After Phase 1 is deployed:

- [ ] Link messaging to RFQs (add rfq_id to messages table)
- [ ] Add RFQ type badges (Direct/Wizard/Public display)
- [ ] Add duplicate quote prevention
- [ ] Create /projects/[projectId]/page.js page
- [ ] Add vendor job acceptance workflow

---

## 📊 PROGRESS TRACKING

Use this to track completion:

```
Phase 1A: Database Setup
  [ ] Migrations created
  [ ] Tables created: projects, notifications, rfqs altered
  
Phase 1B: Job Assignment API
  [ ] Route created
  [ ] Error handling implemented
  [ ] Notifications sent on assignment
  
Phase 1C: Notifications Hook
  [ ] Hook created
  [ ] Real-time subscription working
  
Phase 1D: Notification Bell
  [ ] Component created
  [ ] Added to navbar
  [ ] Shows unread count
  
Phase 1E: UI Changes
  [ ] "Assign Job" button added
  [ ] Modal renders correctly
  [ ] Form submission works
  
Phase 1F: Testing
  [ ] All manual tests pass
  [ ] Database queries verified
  [ ] No console errors
  
Phase 1: COMPLETE ✅
  [ ] Code committed
  [ ] Deployed to staging
  [ ] Team notified
```

---

**Total Estimated Time:** 8-10 hours  
**Difficulty:** Medium  
**Risk:** Low (new tables, minimal changes to existing code)

Good luck! 🚀

*Questions? Review the three audit/brief documents or create an issue.*
