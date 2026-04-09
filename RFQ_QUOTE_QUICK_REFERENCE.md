# 🚀 RFQ & Quote System - Quick Reference Guide

## For Buyers

### Creating an RFQ
1. Go to `/vendor-profile/[vendorId]` → "Get Quote" button
   - OR go to `/rfq/create` → Fill form → Select vendors
2. Fill RFQ details:
   - Title, description, category, budget
   - Select vendor(s) to send to
3. Submit
4. RFQ appears in vendor's inbox
5. Wait for quotes

### Viewing & Comparing Quotes
1. After vendor submits quote, go to `/quote-comparison/[rfqId]`
2. See statistics: Lowest price, highest rating, average
3. **Toggle "Detailed View"** (default) to see:
   - Quote title and vendor info
   - **Full pricing breakdown** with line items
   - **All costs** (transport, labour, VAT, etc.)
   - **What's included/excluded**
   - **Payment terms & warranty**
4. **Click quote** to select
5. Click sections to expand/collapse details
6. Compare multiple vendor quotes
7. Select best quote → **[ACCEPT]**

### After Accepting Quote
1. Click **[ASSIGN JOB]**
2. Fill project details:
   - Start date (required)
   - Project notes (optional)
3. Submit → Project created
4. Vendor notified and can start work

---

## For Vendors

### Responding to RFQs
1. Go to `/vendor/dashboard` → "RFQs" tab
2. See list of RFQs assigned to you
3. Click "Respond" on any RFQ
4. Fill quote form with 3 sections:

#### Section 1: Quote Overview
- Quote title (e.g., "Website Redesign")
- Intro/description
- Validity period (7, 14, 30 days)
- Earliest start date
- Delivery timeline

#### Section 2: Pricing & Breakdown (Most Important!)
- Choose pricing model:
  - **Fixed:** Single total price
  - **Range:** Min-max pricing
  - **Per Unit:** Price per item + quantity
  - **Per Day:** Daily rate + number of days
- Add line items (detailed breakdown):
  - Item description
  - Quantity
  - Unit price
  - → Auto-calculates line total
- Add extra costs:
  - Transport cost
  - Labour cost
  - Other charges
- Check VAT included checkbox if applicable
- System auto-calculates subtotal, VAT, total

#### Section 3: Inclusions & Exclusions
- **What's Included:** List features/services you'll provide
- **What's NOT Included:** List what's outside scope
- **Client Responsibilities:** What buyer must provide
- **Warranty (optional):** Support/maintenance period
- **Payment Terms (optional):** 50/50, upfront, etc.

5. Submit quote → Confirmation
6. Buyer sees your quote in comparison page

### Best Practices for Quotes
- Be detailed in line items (shows you're transparent)
- Clearly list exclusions to avoid disputes
- Include payment terms to set expectations
- Add warranty info to show confidence
- Use realistic delivery timelines

---

## System Architecture

```
BUYER SIDE                    DATABASE                    VENDOR SIDE
═══════════════════════════════════════════════════════════════════════════

Create RFQ ─────────────────→ rfqs table
(RFQModal)                   rfq_recipients table
                             rfq_requests table
                                    ↓
                            ← RFQ in inbox
                         (RFQs Dashboard)
                                    ↓
View Quotes             ← rfq_responses table ← Submit Quote
(Quote Comparison)      (pricing, inclusions)  (QuoteFormSections)
  ├─ Detail Cards                              3-section form
  ├─ Full breakdown
  ├─ All sections
  └─ Select & Accept
```

---

## Key Pages

### Buyer Pages
- `/rfq/create` - Create new RFQ
- `/vendor-profile/[id]` - View vendor, get quote
- `/quote-comparison/[rfqId]` - View and compare quotes
- `/projects/[id]` - View assigned projects

### Vendor Pages
- `/vendor/dashboard` - See RFQs and projects
- `/vendor/rfq/[rfq_id]/respond` - Submit quote
- `/vendor/profile/[id]` - Vendor profile

---

## Database Quick Reference

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `rfqs` | RFQ record | id, user_id, title, assigned_vendor_id |
| `rfq_recipients` | Who quote was sent to | rfq_id, vendor_id |
| `rfq_requests` | Legacy vendor inbox | rfq_id, vendor_id |
| `rfq_responses` | Vendor quotes | rfq_id, vendor_id, quote_title, pricing_model, line_items, inclusions, exclusions, total_price_calculated |
| `vendors` | Vendor details | id, company_name, rating, verified |

---

## Troubleshooting

### "Vendor doesn't see RFQ in inbox"
- Check if RFQ was created with vendor selected
- Verify rfq_requests table has entry for vendor
- Check if vendor.id matches assigned_vendor_id

### "Quote form won't submit"
- Description must be > 20 characters
- Quote title required
- Pricing model required
- At least 1 line item or quoted_price required

### "Buyer doesn't see quote"
- Check if vendor submitted (rfq_responses has entry)
- Verify rfq_id matches
- Buyer must be RFQ creator (unless public RFQ)

### "Can't see full quote details"
- Make sure you're in "Detailed View" (toggle at top right)
- Click quote card to select it
- Expand sections by clicking chevrons

---

## Tips & Tricks

### For Buyers
- **Detailed View is Default** - Toggle to Table view if you want quick overview
- **Click Sections** - Expand/collapse sections to focus on what matters
- **Compare Costs** - Look at line items breakdown, not just total
- **Check Exclusions** - Important to see what's NOT included
- **Export Before Deciding** - Download CSV/PDF for record keeping

### For Vendors
- **Be Specific in Line Items** - Shows professionalism and transparency
- **Clear Exclusions** - Prevents disputes later
- **Realistic Timelines** - Build trust with accurate delivery dates
- **Include Terms** - Payment terms and warranty show confidence
- **Proofread Before Submit** - Can't edit after submission

---

## Common Workflows

### Workflow 1: Quick Direct RFQ (Buyer)
```
1. Find vendor on site
2. Click "Get Quote"
3. Fill quick RFQ form
4. Vendor sees it immediately
5. Vendor submits quote
6. You see detailed quote
7. Accept if good, reject if not
```

### Workflow 2: Detailed Competitive Bidding (Buyer)
```
1. Create comprehensive RFQ
2. Send to 3-5 vendors
3. Wait for all quotes
4. Compare detailed quotes
5. Review costs, inclusions, warranties
6. Accept best option
7. Assign job and start project
```

### Workflow 3: New Vendor Response (Vendor)
```
1. See RFQ in dashboard
2. Click "Respond"
3. Fill 3-section quote form carefully
4. Add detailed line items
5. Clear inclusions/exclusions
6. Include payment terms
7. Submit
8. Buyer sees your quote
9. Wait for accept/reject
10. If accepted, wait for job assignment
```

---

## Important Notes

⚠️ **After Quote Submission**
- Vendors cannot edit quotes (must contact buyer)
- Buyer sees all submission details
- Quotes don't expire automatically (check validity period)

⚠️ **Quote Acceptance**
- Accepting a quote doesn't create project
- Must click "Assign Job" to create project
- Vendor doesn't start work until job assigned

⚠️ **Data Visibility**
- Vendors can only see their own quotes
- Buyers see all quotes for their RFQ
- Non-creator buyers cannot see RFQ (unless public)

---

## Support Resources

📚 **Detailed Docs:**
- `QUOTE_DISPLAY_ENHANCEMENT_COMPLETE.md` - Full technical details
- `QUOTE_DISPLAY_QUICK_SUMMARY.md` - Visual summary with examples
- `RFQ_QUOTE_SYSTEM_COMPLETE.md` - Complete end-to-end system

🔧 **API Docs:**
- `POST /api/rfq/create` - Create RFQ
- `POST /api/rfq/[rfq_id]/response` - Submit quote
- `POST /api/rfq/accept` - Accept quote
- `POST /api/rfq/assign-job` - Assign job

---

## Quick Stats

✅ **System Status:** Fully Functional
✅ **Quote Details:** All 3 sections visible
✅ **Cost Breakdown:** Complete with line items
✅ **Buyer Display:** Professional card layout + table option
✅ **Vendor Form:** Comprehensive 3-section form
✅ **Job Assignment:** Automated project creation

---

**Happy quoting! 🎉**

Need help? Check the detailed docs or contact support.
