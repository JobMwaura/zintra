# 🎨 Job Management - Visual Guide

## Page Layout: View All Jobs

```
┌──────────────────────────────────────────────┐
│ [←] My Job Postings                          │
│ Manage and edit all your job listings        │
└──────────────────────────────────────────────┘

┌────────────┐ ┌───────────┐ ┌────────┐ ┌────────┐
│ 📋 Total   │ │ 🟢 Active │ │ ⏸️ Paused │ │ ✅ Closed│
│ Jobs: 5    │ │ Jobs: 3   │ │ Jobs: 1│ │ Jobs: 1 │
└────────────┘ └───────────┘ └────────┘ └────────┘

┌─────────────────────────────────────────────┐
│ Experienced Plumber Needed [🟢 Active]      │
│ Westlands, Nairobi                           │
│ 💼 Full Time | 💰 5,000-10,000 KES | 📬 2 apps │ 🕐 2 days ago
│                                             │
│ [⌄ Expand] (click to see details)          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Electrical Installer [⏸️ Paused]            │
│ CBD, Nairobi                                 │
│ 💼 Full Time | 💰 8,000-15,000 KES | 📬 0 apps │ 🕐 1 week ago
│                                             │
│ [⌄ Expand]                                 │
└─────────────────────────────────────────────┘

... (more jobs)
```

---

## Expanded Job Card

```
┌─────────────────────────────────────────────┐
│ Experienced Plumber Needed [🟢 Active]      │
│ Westlands, Nairobi                           │
│ 💼 Full Time | 💰 5,000-10,000 KES | 📬 2 apps │ 🕐 2 days ago
│
│ [▼ Collapse]
│ ─────────────────────────────────────────────│
│
│ DESCRIPTION:
│ Looking for experienced plumber to handle
│ residential and commercial projects. Must
│ have 5+ years experience with water systems
│ and fixtures...
│
│ ┌─────────┬────────────┬──────────┬────────┐
│ │CATEGORY │TYPE        │START DATE│POSTED  │
│ │Plumbing │Full-Time   │Jan 27    │Jan 17  │
│ └─────────┴────────────┴──────────┴────────┘
│
│ [⏸️ Pause] [✅ Close] [✏️ Edit] [👁️ View] [🗑️ Delete]
│
└─────────────────────────────────────────────┘
```

---

## Edit Job Page

```
┌──────────────────────────────────────────────┐
│ [←] Edit Job Posting                         │
│ Update job details, pay range, or info      │
└──────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ JOB TITLE *                                  │
│ [Experienced Plumber Needed____________]   │
│                                             │
│ CATEGORY *                                  │
│ [Plumbing ▼]                                │
│                                             │
│ JOB TYPE *                                  │
│ ◉ Full Time  ○ Part Time  ○ Gig            │
│                                             │
│ LOCATION *                                  │
│ [Westlands, Nairobi____________________]   │
│                                             │
│ MIN PAY (KES) *        │ MAX PAY (KES) *     │
│ [5000_______________] │ [10000____________]│
│                                             │
│ PREFERRED START DATE (Optional)             │
│ [2026-01-27__________________________]      │
│                                             │
│ JOB DESCRIPTION *                           │
│ [Looking for experienced plumber to handle │
│  residential and commercial projects...    │
│                                             │
│                                             │
│                                             │
│ ] (8 lines)                                 │
│                                             │
│ [Save Changes] [Cancel]                     │
│                                             │
└─────────────────────────────────────────────┘

💡 Editing Tips:
✓ Update details as you learn more
✓ Adjust pay range to attract more candidates
✓ No credits charged for editing
✓ Changes take effect immediately
```

---

## Job Status Badges

```
🟢 ACTIVE
Active jobs are visible to candidates and
receiving new applications.

⏸️ PAUSED
Paused jobs are hidden from candidates but
applications are preserved. Reactivate anytime.

✅ CLOSED
Closed jobs are no longer visible. Used for
jobs that are filled or no longer available.
```

---

## Quick Action Reference

### Pause a Job
```
1. Find job in list
2. Click ⌄ to expand
3. Click [⏸️ Pause Job]
✅ Job immediately paused
```

### Resume Paused Job
```
1. Filter by "Paused" (click stat card)
2. Click ⌄ to expand
3. Click [🟢 Reactivate]
✅ Job immediately active again
```

### Edit Job Details
```
1. Click ⌄ to expand job
2. Click [✏️ Edit]
3. Change fields as needed
4. Click [Save Changes]
✅ Updates immediately
🆓 No credits charged
```

### Close Job When Filled
```
1. Click ⌄ to expand job
2. Click [✅ Close Job]
✅ Job marked as closed
📌 Stays in history for reference
```

### Delete Old Job
```
1. Click ⌄ to expand job
2. Scroll right to find [🗑️ Delete]
3. Confirm deletion
⚠️ Permanent! Can't undo.
```

### View Public Job Listing
```
1. Click ⌄ to expand job
2. Click [👁️ View]
✅ Opens in new tab
👁️ See how candidates see it
```

---

## Mobile Layout

### Phones (Collapsed)
```
┌─────────────────────┐
│ Plumber Needed      │
│ [🟢 Active]         │
│ Westlands           │
│ 💼💰📬 🕐           │
│ [⌄]                 │
└─────────────────────┘
```

### Phones (Expanded)
```
┌─────────────────────┐
│ Plumber Needed      │
│ [🟢 Active]         │
│ Westlands           │
│
│ Full description...
│
│ [Category] [Type]
│ [Date] [Posted]
│
│ [⏸️ Pause]
│ [✏️ Edit]
│ [👁️ View]
│ [✅ Close]
│ [🗑️ Delete]
└─────────────────────┘
```

### Tablet (2-column)
```
┌────────────────────┐ ┌────────────────────┐
│ Plumber...         │ │ Electrician...     │
│ [Details]          │ │ [Details]          │
│ [Actions]          │ │ [Actions]          │
└────────────────────┘ └────────────────────┘
```

### Desktop (4+ columns for stat cards)
```
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│ 5   │ │ 3   │ │ 1   │ │ 1   │
│ ALL │ │ACTIVE│ │PAUSE│ │CLOSE│
└─────┘ └─────┘ └─────┘ └─────┘
```

---

## Color Codes

| Color | Meaning | Usage |
|-------|---------|-------|
| 🟢 Green | Active/Go | Active jobs, reactivate button |
| 🟡 Yellow | Warning/Paused | Paused jobs, pause button |
| 🔵 Blue | Edit | Edit button |
| 🟣 Indigo | View | View button |
| 🔴 Red | Delete | Delete button |
| ⚫ Gray | Closed/Done | Closed jobs, secondary actions |

---

## Status Flow Diagram

```
         Create Job
             ↓
        [Active] 🟢
          ↙   ↘
    Pause      Close
      ↓          ↓
   [Paused] [Closed]
      ↓
   Reactivate
      ↓
    [Active]

Delete available at any stage →
```

---

## Typical Usage Flow

```
WEEK 1:
├─ Post Plumber Job (1000 KES)
│  └─ Status: 🟢 Active
│
├─ Post Electrician Job (1000 KES)
│  └─ Status: 🟢 Active
│
└─ View All Jobs page
   ├─ See 2 active jobs
   └─ See 0 applications yet

WEEK 2:
├─ Check jobs → 5 applications for Plumber!
├─ Too many apps, pause plumber job
│  └─ Status: ⏸️ Paused
│
├─ Edit Plumber pay → reduced pay range
│  └─ No cost, updates immediately
│
└─ Electrician getting good apps, keep active

WEEK 3:
├─ Hired a plumber!
├─ Close Plumber job
│  └─ Status: ✅ Closed
│
├─ Still looking for electrician
├─ Reactivate after edit
│  └─ Status: 🟢 Active
│
└─ View jobs: 1 Active, 1 Closed

WEEK 4:
├─ Hired electrician too!
├─ Close Electrician job
│
├─ Delete old closed jobs (optional)
│
└─ All jobs: 2 Closed, 0 Active
```

---

## Screenshot Descriptions

### Jobs List View
- Header: Orange gradient background
- Stat cards: 4-column grid (responsive)
- Job cards: White background, expandable
- Hover: Light gray background
- Expanded: Shows full description + buttons

### Edit Job Form
- Header: Orange gradient background
- Form fields: White input boxes with orange focus ring
- Radio buttons: Blue/orange colors
- Textarea: Multi-line input for description
- Buttons: Orange primary, gray secondary

### Mobile View
- Stack vertically
- Buttons wrap to new lines
- Touch-friendly padding
- Full-width form inputs
- Single column job cards

---

## Summary

✅ **View All Jobs:** See complete job list with filters
✅ **Expand Cards:** Click arrow to see full details  
✅ **Quick Actions:** Pause, edit, close, delete with one click
✅ **Edit Anytime:** Update job details without cost
✅ **Mobile Ready:** Perfect on phones, tablets, desktop
✅ **Real-time:** Changes take effect immediately

**Next time you post a job, visit `/careers/employer/jobs` to manage it!**
