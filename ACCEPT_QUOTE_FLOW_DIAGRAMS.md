# Accept Quote - Visual Flow & Sequence Diagrams

## 🔄 User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ RFQ HISTORY PAGE (/my-rfqs)                                     │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ RFQ Card 1: "Office Furniture"                              ││
│ │ • 3 Quotes Received                                         ││
│ │ ┌─────────────────┐                                         ││
│ │ │ Compare Quotes  │ ← Click here                            ││
│ │ │ View Details    │ ← Or here                               ││
│ │ └─────────────────┘                                         ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
         │
         │ "Compare Quotes" → /quote-comparison/{rfqId}
         │ "View Details"   → /rfqs/{id}
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ QUOTE DISPLAY PAGE                                              │
│ (Either /quote-comparison or /rfqs/{id})                        │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Quote 1: ABC Furniture Ltd                                  ││
│ │ • Price: KSh 150,000                                        ││
│ │ • Status: submitted                                         ││
│ │ ┌──────────────────────────────────────────────────────────┤│
│ │ │ Section 1: Overview  ▼                                   ││
│ │ │  Proposal text, timeline, validity...                    ││
│ │ ├──────────────────────────────────────────────────────────┤│
│ │ │ Section 2: Pricing   ▼                                   ││
│ │ │  Line items, costs, VAT, total...                        ││
│ │ ├──────────────────────────────────────────────────────────┤│
│ │ │ Section 3: Inclusions ▼                                  ││
│ │ │  Inclusions, terms, warranty...                          ││
│ │ └──────────────────────────────────────────────────────────┘│
│ │                                                              ││
│ │ Action Buttons (Creator Only):                              ││
│ │ ┌─────────────────┐  ┌─────────────────┐                   ││
│ │ │ Accept Quote 🔷 │  │ Reject Quote ❌ │                   ││
│ │ └─────────────────┘  └─────────────────┘                   ││
│ │      ▲ Click                                                ││
│ │      │                                                       ││
│ └──────┼───────────────────────────────────────────────────────┘│
└───────┼──────────────────────────────────────────────────────────┘
        │
        │ EVENT: Click "Accept Quote"
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ ACCEPT QUOTE HANDLER                                            │
│                                                                 │
│ 1. Authorization Check                                         │
│    ├─ Is user the RFQ creator? → Yes ✓                        │
│    └─ Permission granted                                      │
│                                                                 │
│ 2. Update Database                                             │
│    ├─ Table: rfq_responses                                    │
│    ├─ Set: status = 'accepted'                                │
│    ├─ Where: id = {quoteId}                                   │
│    └─ Result: Updated ✓                                       │
│                                                                 │
│ 3. Show Feedback                                               │
│    ├─ Message: "✅ Quote accepted successfully!"               │
│    ├─ Duration: 2 seconds                                     │
│    └─ Style: Green background                                 │
│                                                                 │
│ 4. Refresh Data                                                │
│    ├─ Call: fetchRFQDetails()                                 │
│    ├─ Fetch: All vendor responses                             │
│    └─ Update: Component state                                 │
│                                                                 │
│ 5. Update UI                                                   │
│    ├─ Status badge: "submitted" → "Accepted" ✓               │
│    ├─ Status color: gray → green                             │
│    ├─ Buttons: hidden/disabled                                │
│    └─ Card: shows acceptance confirmation                     │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ UPDATED QUOTE DISPLAY                                           │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Quote 1: ABC Furniture Ltd                                  ││
│ │ • Price: KSh 150,000                                        ││
│ │ • Status: Accepted ✓ [GREEN BADGE]                          ││
│ │ ┌──────────────────────────────────────────────────────────┤│
│ │ │ Section 1: Overview  ▼                                   ││
│ │ │  Proposal text, timeline, validity...                    ││
│ │ ├──────────────────────────────────────────────────────────┤│
│ │ │ Section 2: Pricing   ▼                                   ││
│ │ │  Line items, costs, VAT, total...                        ││
│ │ ├──────────────────────────────────────────────────────────┤│
│ │ │ Section 3: Inclusions ▼                                  ││
│ │ │  Inclusions, terms, warranty...                          ││
│ │ └──────────────────────────────────────────────────────────┘│
│ │                                                              ││
│ │ Status: ✓ Quote Accepted                                    ││
│ │ [Accept & Reject buttons HIDDEN]                            ││
│ │                                                              ││
│ │ [Other vendor quotes still visible with their buttons]      ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Next Step (on Quote Comparison page):                          │
│ ┌─────────────────┐                                           │
│ │ Assign Job 🎯   │ ← Click to create work assignment        │
│ └─────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Sequence Diagram

```
User                 UI Component        Database
 │                        │                   │
 │ Click "Accept Quote"    │                   │
 ├───────────────────────►│                   │
 │                        │ Verify Creator   │
 │                        │ (Check auth)     │
 │                        │                   │
 │                        │ UPDATE query     │
 │                        │ status='accepted'│
 │                        ├──────────────────►│
 │                        │                   │
 │                        │◄──────────────────┤
 │                        │ Success ✓         │
 │                        │                   │
 │ Show Success Msg ◄─────│                   │
 │ "Quote accepted!"      │                   │
 │                        │ fetchRFQDetails  │
 │                        ├──────────────────►│
 │                        │                   │
 │                        │◄──────────────────┤
 │                        │ Return all data   │
 │                        │                   │
 │ Update Display ◄───────│                   │
 │ • Status: Accepted ✓   │                   │
 │ • Buttons: Hidden      │                   │
 │ • Color: Green         │                   │
 │                        │                   │
 │ Can now click          │                   │
 │ "Assign Job" or        │                   │
 │ View other quotes      │                   │
 │                        │                   │
```

---

## 🎯 State Transitions

```
                    [INITIAL STATE]
                     Quote Card
                    ┌─────────────┐
                    │ submitted   │
                    │ (gray badge)│
                    │ Accept ✓    │
                    │ Reject ✗    │
                    └─────────────┘
                          ▲
                          │
                   [Not Accepted Yet]
                          │
                          │
         ┌────────────────┴────────────────┐
         │                                  │
    User clicks                        User clicks
    "Accept Quote"                    "Reject Quote"
         │                                  │
         ▼                                  ▼
    [PROCESSING]                     [PROCESSING]
    Button disabled                  Button disabled
    Spinner shows                    Spinner shows
         │                                  │
         │                                  │
    [API UPDATE]                     [API UPDATE]
    Database write                   Database write
         │                                  │
         │                                  │
         ▼                                  ▼
    ┌─────────────┐                 ┌─────────────┐
    │ accepted    │                 │ rejected    │
    │ (green)     │                 │ (red)       │
    │ ✓ Accepted  │                 │ ✗ Rejected  │
    │ No buttons  │                 │ No buttons  │
    │ Show status │                 │ Show status │
    └─────────────┘                 └─────────────┘
         │                                  │
         │ [CAN PROCEED]                   │ [QUOTE DISMISSED]
         │                                  │
    Can click                         Quote remains
    "Assign Job"                      for reference
    button                            but marked rejected

```

---

## 🔄 Detailed Sequence: Accept Quote

```
STEP 1: User Interaction
────────────────────────
User Location:     /rfqs/{id} or /quote-comparison/{rfqId}
Visible Element:   "Accept Quote" button (orange/green)
User Action:       Click button
Context:           User is RFQ creator, quote is 'submitted'

                          ▼

STEP 2: Handler Invoked
────────────────────────
Function:          handleAcceptQuote(quoteId)
Input:             quoteId = "abc123"
Initial Check:     Is user the RFQ creator?
   └─ YES → Continue
   └─ NO  → Show error, return

                          ▼

STEP 3: UI Feedback
────────────────────────
Button State:      Disabled (opacity 50%)
Loading Indicator: Show spinner/disable
Message:           Clear previous messages
Visual:            Indicate processing

                          ▼

STEP 4: Database Update
────────────────────────
Table:             rfq_responses
Operation:         UPDATE
Condition:         WHERE id = quoteId
Update Field:      status = 'accepted'
Side Effects:      updated_at timestamp auto-updates

SQL (Conceptual):
─────────────────
UPDATE rfq_responses
SET status = 'accepted'
WHERE id = 'abc123'

Result:            1 row updated ✓

                          ▼

STEP 5: Success Handling
────────────────────────
Error Check:       No errors? Continue
Message:           Set "✅ Quote accepted successfully!"
Message Color:     Green background
Message Duration:  2 seconds (auto-clear)

                          ▼

STEP 6: Data Refresh
────────────────────
Delay:             Wait 2 seconds
Function:          fetchRFQDetails()
Fetches:           • RFQ data
                   • All vendor responses
                   • Vendor details

Update State:      New data in component state

                          ▼

STEP 7: UI Update
────────────────────────
Status Badge:      "submitted" → "Accepted ✓"
Badge Color:       Gray → Green
Buttons:           Hide Accept/Reject buttons
Card Border:       May highlight in green
Overall:           Quote card shows accepted state

                          ▼

STEP 8: Final State
────────────────────────
Card Shows:        Accepted status with green badge
Buttons:           No Accept/Reject buttons visible
Available Actions: • View quote details (always)
                   • Assign Job (if on comparison page)
                   • View other quotes
                   • Reject (NO - can't undo easily)

User Can:          Accept other quotes OR
                   Proceed to assign job

Persistence:       Data persists across page refresh

```

---

## 🚨 Error Scenarios

### Scenario 1: User is Not Creator
```
User tries to accept quote
          ▼
Authorization check fails
          ▼
Message: "Only the RFQ creator can accept quotes"
          ▼
Button remains enabled
Data unchanged
```

### Scenario 2: Database Error
```
UPDATE query fails
          ▼
Catch error
          ▼
Message: "❌ Error: [database error message]"
          ▼
Button re-enabled
State reverted
User can retry
```

### Scenario 3: Network Error
```
Supabase connection fails
          ▼
UPDATE times out or connection error
          ▼
Message: "❌ Error: Network error"
          ▼
Button re-enabled
User can retry
```

---

## 📝 Code Walkthrough

```javascript
// Step 1: Check authorization
const handleAcceptQuote = async (quoteId) => {
  if (!isCreator) {
    setActionMessage('Only the RFQ creator can accept quotes');
    return; // ← EXIT if not creator
  }

  // Step 2: Set loading state
  try {
    setActingQuoteId(quoteId);
    setActionMessage('');

    // Step 3: Update database
    const { error } = await supabase
      .from('rfq_responses')
      .update({ status: 'accepted' })
      .eq('id', quoteId);

    if (error) throw error; // ← Handle errors

    // Step 4: Show success message
    setActionMessage('✅ Quote accepted successfully!');

    // Step 5: Refresh data and clear message
    setTimeout(() => {
      fetchRFQDetails();        // ← Refetch all data
      setActionMessage('');     // ← Clear message
    }, 2000);

  } catch (err) {
    console.error('Error accepting quote:', err);
    setActionMessage(`❌ Error: ${err.message}`);

  } finally {
    // Always clear loading state
    setActingQuoteId(null);
  }
};
```

---

## 📱 Mobile/Responsive View

```
Mobile View (375px):
┌─────────────────────────┐
│ Quote 1: ABC Furniture  │
│ Price: 150,000 KSh      │
│ Status: submitted       │
│                         │
│ 📂 Overview    ▼        │
│ 💰 Pricing     ▼        │
│ ✓ Inclusions  ▼        │
│                         │
│ ┌───────────────────┐   │
│ │ Accept Quote      │   │
│ └───────────────────┘   │
│ ┌───────────────────┐   │
│ │ Reject Quote      │   │
│ └───────────────────┘   │
└─────────────────────────┘

After Accept:
┌─────────────────────────┐
│ Quote 1: ABC Furniture  │
│ Price: 150,000 KSh      │
│ ✓ Accepted [GREEN]      │
│                         │
│ 📂 Overview    ▼        │
│ 💰 Pricing     ▼        │
│ ✓ Inclusions  ▼        │
│                         │
│ [No buttons - HIDDEN]   │
│                         │
│ ✓ Quote Accepted        │
│   Status confirmed      │
└─────────────────────────┘
```

---

## 🔐 Security Flow

```
User submits "Accept Quote"
        │
        ▼
Client-side check:
Is user the RFQ creator?
        │
    ┌───┴────┐
    │        │
   YES      NO
    │        │
    ▼        ▼
Continue   Error msg
    │        │
    ├────────┘
    │
    ▼
Send to Supabase API
        │
        ▼
Server-side RLS Check:
Does user own the RFQ?
        │
    ┌───┴────┐
    │        │
   YES      NO
    │        │
    ▼        ▼
Update   Reject
    │      401
    │
    ▼
Return success
        │
        ▼
Client refreshes data
        │
        ▼
Display updated status
```

---

## 📊 Data State Changes

| Field | Before Accept | After Accept | Changed |
|-------|---------------|--------------|---------|
| id | abc123 | abc123 | ❌ No |
| rfq_id | xyz789 | xyz789 | ❌ No |
| vendor_id | vend456 | vend456 | ❌ No |
| status | 'submitted' | 'accepted' | ✅ Yes |
| quoted_price | 150000 | 150000 | ❌ No |
| created_at | 2026-01-24... | 2026-01-24... | ❌ No |
| updated_at | 2026-01-24... | 2026-01-24 NEW | ✅ Yes |

---

## ✅ Success Criteria

When "Accept Quote" is successfully completed:
- ✅ Quote status changed from 'submitted' to 'accepted'
- ✅ Database updated
- ✅ User sees green success message
- ✅ Status badge shows "Accepted" in green
- ✅ Accept/Reject buttons hidden
- ✅ Data persists across refresh
- ✅ Other quotes remain unchanged
- ✅ "Assign Job" button becomes available (on comparison page)

---

## 🎯 Next Action

After successfully accepting a quote, users typically:

1. **Accept Other Quotes**
   - Review alternative quotes
   - Accept multiple if undecided

2. **Assign Job**
   - Click "Assign Job" button
   - Fill in start date
   - Add notes
   - Confirm assignment

3. **Leave for Later**
   - Close the page
   - Come back to assign later
   - Quote status persists

---

This comprehensive documentation explains the complete "Accept Quote" flow with all technical details, visual representations, and user experience flows.
