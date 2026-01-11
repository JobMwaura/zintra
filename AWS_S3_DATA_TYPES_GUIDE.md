# 📦 AWS S3 Data Types Guide - What to Push to S3

**Date**: January 11, 2026  
**Status**: ✅ Complete Reference  
**Purpose**: Understand what data belongs in AWS S3 vs. Supabase Database

---

## 📊 EXECUTIVE SUMMARY

### ✅ PUSH TO AWS S3 (Heavy Binary Data)
| Data Type | Purpose | Size | Example |
|-----------|---------|------|---------|
| **Images** | Visual content | 1-10MB | RFQ reference images, vendor logos, gallery photos |
| **Documents** | PDFs, blueprints | 2-50MB | Technical drawings, proposals, quotes (future) |
| **Videos** | Demonstrations | 50-500MB | Product videos, installation guides (future) |
| **Archives** | Bulk uploads | 10-100MB | Multiple files zipped (future) |
| **Media Files** | Any binary | Varies | Watermarked images, resized versions |

### ✅ STAY IN SUPABASE (Structured Data)
| Data Type | Purpose | Size | Example |
|-----------|---------|------|---------|
| **Metadata** | File references | <1KB | File URLs, S3 keys, timestamps |
| **Text Content** | Descriptions | 1-100KB | RFQ descriptions, vendor bios, quote notes |
| **Structured Data** | Business logic | <10KB | Pricing, categories, vendor info |
| **JSON Data** | Complex forms | 10-100KB | RFQ details, quote line items, form responses |

---

## 🎯 CURRENT IMPLEMENTATION (What's Already Set Up)

### Currently Pushing to S3 ✅

**1. RFQ Reference Images**
- **Location**: `/rfq-images/` folder in S3
- **File Types**: PNG, JPG, WebP, GIF
- **Max Size**: 10MB per file
- **Purpose**: Visual reference for construction/renovation projects
- **Database Storage**: Only the S3 URL stored in `rfqs.attachments` (JSONB)
- **Implementation**: `RFQImageUpload.jsx` component
- **API Endpoint**: `/api/rfq/upload-image.js`

**Example Data Structure in Database**:
```json
{
  "rfqs": {
    "id": "uuid-123",
    "attachments": {
      "referenceImages": [
        {
          "fileKey": "rfq-images/1736520000-abc123-site-plan.jpg",
          "fileUrl": "https://s3.amazonaws.com/...",
          "fileName": "site-plan.jpg",
          "uploadedAt": "2026-01-11T10:30:00Z"
        }
      ]
    }
  }
}
```

**2. Vendor Profile Images**
- **Location**: `/vendor-profiles/` folder in S3
- **File Types**: PNG, JPG, WebP, GIF
- **Max Size**: 10MB per file
- **Purpose**: Logo, banner, profile pictures, portfolio images
- **Database Storage**: Only the S3 URL stored in vendor record
- **Implementation**: `VendorImageUpload.js` component
- **API Endpoint**: `/api/vendor/upload-image.js`

**Example Data Structure in Database**:
```json
{
  "vendors": {
    "id": "uuid-456",
    "logo_url": "https://s3.amazonaws.com/vendor-profiles/...",
    "banner_url": "https://s3.amazonaws.com/vendor-profiles/..."
  }
}
```

---

## 🚀 RECOMMENDED TO PUSH TO S3 (Next Phase)

### 1. Quote Documents (PDF Export)
**Status**: ⏳ Not Yet Implemented

```
Current State:
  └─ Quotes stored in Supabase: rfq_responses table
     └─ Contains: title, pricing, terms, inclusions, exclusions
     └─ Size: ~10-50KB per quote

Recommended:
  ├─ Keep quote details in Supabase (for database queries, sorting, filtering)
  └─ Generate PDF and push to S3 for:
     - Archival (permanent record)
     - Email delivery to clients
     - Long-term retention (after 5+ years)
     - Downloads from portal
```

**Implementation Example**:
```javascript
// When quote is finalized:
1. Generate PDF from quote data using library (e.g., pdfkit, puppeteer)
2. Upload PDF to S3: /vendor-quotes/{vendor_id}/quote-{rfq_id}-{timestamp}.pdf
3. Store S3 URL in database: rfq_responses.pdf_url
4. Delete local PDF file after successful S3 upload
```

**Why?**
- PDFs are large (2-50MB) and slow down database
- Database queries don't need full PDF content
- S3 is optimized for file storage and retrieval
- Can set S3 lifecycle policies to archive old PDFs

---

### 2. Blueprint/Technical Drawings
**Status**: ⏳ Not Yet Implemented

```
Data Type: DWG, PDF, PNG (technical drawings)
Size: 5-50MB each
Purpose: Architectural/engineering reference for complex projects
Storage: S3 /rfq-blueprints/{rfq_id}/
Database: Store key/URL only
```

**Why?**
- Technical drawings are large binary files
- Slow to download from database
- Need to be accessible without loading RFQ record
- Can be organized by project in S3 folders

---

### 3. Portfolio Images & Gallery (High-Resolution)
**Status**: ⏳ Partially Implemented

```
Current: Storing URLs only (good!)
Recommended: Add high-res versions to S3 with CDN

For each portfolio item:
├─ Thumbnail: 200x200px (50-100KB) → S3 /thumbnails/
├─ Display: 800x600px (200-300KB) → S3 /gallery/
└─ Original: Full-res (2-10MB) → S3 /originals/

Database stores: All 3 URLs
CDN delivers: Thumbnail & display sizes
```

---

### 4. Document Uploads (Certifications, Licenses)
**Status**: ⏳ Not Yet Implemented

```
Data Type: PDF, JPG (business documents)
Size: 1-5MB each
Purpose: Proof of certification, business license, insurance
Storage: S3 /vendor-documents/{vendor_id}/{doc_type}/
Database: Store key/URL only with metadata

Example:
{
  "certifications": [
    {
      "type": "electrical_license",
      "fileUrl": "s3://bucket/vendor-documents/v123/electrical-license.pdf",
      "expiresAt": "2027-01-15",
      "verified": true
    }
  ]
}
```

---

## ❌ SHOULD NEVER PUSH TO S3

### 1. Sensitive Personal Data
```
❌ Phone numbers (keep in Supabase with encryption)
❌ Email addresses (keep in Supabase)
❌ ID numbers (national ID, passport - never store)
❌ Payment information (card data, bank details)
❌ Passwords or tokens (keep in secure database only)
```

**Why?**
- S3 files are retrievable by key if URL is known
- Easier to accidentally expose with misconfigured CORS
- Should be in encrypted database with access control
- Compliance regulations require strict data protection

### 2. Large Datasets/Exports
```
❌ Export entire vendor database as CSV to S3
❌ Dump all RFQs as JSON to S3
❌ Archive full user transaction history
```

**Why?**
- Not practical for active data access
- Can't query data in S3 directly
- Creates multiple copies of truth (hard to maintain)
- Better to keep queryable data in database, snapshot exports separately

### 3. Real-Time Data
```
❌ Live notifications
❌ Active user sessions
❌ Real-time chat messages
❌ Current quotes being edited
```

**Why?**
- S3 is optimized for storage, not access
- Unsuitable for low-latency operations
- Database is designed for real-time queries
- Would require constant S3 polling

### 4. Structured Data (Even if Large)
```
❌ Quote details with pricing/line items
❌ RFQ form responses (unless text-heavy)
❌ Vendor profile information
❌ User registration data
```

**Why?**
- Needs to be searchable/sortable
- Database queries are necessary
- Relationships with other data
- JSONB in Supabase is ideal for complex structures

---

## 📋 DATA MIGRATION GUIDE: What to Move to S3

### Phase 1: Images (Already Done ✅)
- ✅ RFQ reference images
- ✅ Vendor profile images
- ✅ Vendor logos and banners

### Phase 2: Document Exports (Recommended Next)
```sql
-- Add URL columns to rfq_responses table
ALTER TABLE rfq_responses ADD COLUMN IF NOT EXISTS pdf_export_url TEXT;
ALTER TABLE rfq_responses ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;

-- When quote is finalized:
UPDATE rfq_responses
SET pdf_export_url = 's3://bucket/vendor-quotes/...',
    pdf_generated_at = NOW()
WHERE id = $1;
```

### Phase 3: Portfolio High-Resolution Images
```sql
-- Add high-res image support to vendor_portfolio_projects
ALTER TABLE vendor_portfolio_projects ADD COLUMN IF NOT EXISTS images JSONB;

-- Example data structure:
{
  "images": [
    {
      "original": "s3://bucket/originals/photo-123.jpg",
      "display": "s3://bucket/gallery/photo-123-800x600.jpg",
      "thumbnail": "s3://bucket/thumbnails/photo-123-200x200.jpg",
      "uploadedAt": "2026-01-11T10:30:00Z"
    }
  ]
}
```

### Phase 4: Document Verification (Certifications, Licenses)
```sql
-- New table for vendor documents
CREATE TABLE vendor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  document_type VARCHAR(50), -- 'license', 'certification', 'insurance'
  file_url TEXT NOT NULL, -- S3 URL
  file_key TEXT NOT NULL, -- S3 key for deletion
  expires_at DATE,
  verified BOOLEAN DEFAULT false,
  verified_by UUID, -- Admin ID
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔒 SECURITY CHECKLIST: What NOT to Store in S3

### Personal Identifiable Information (PII)
```
Chart: Where Each Data Type Goes

DATA TYPE                    | DATABASE | S3  | API BODY | SESSION
─────────────────────────────┼──────────┼─────┼─────────┼─────────
Phone Number                 |    ✅    | ❌  |    ❌   |   ✅
Email Address                |    ✅    | ❌  |    ❌   |   ✅
National ID / Passport       |    ❌    | ❌  |    ❌   |   ❌
Home Address                 |    ✅    | ⚠️  |    ❌   |   ✅
Bank Account Details         |    ❌    | ❌  |    ❌   |   ❌
Credit Card Number           |    ❌    | ❌  |    ❌   |   ❌
─────────────────────────────┼──────────┼─────┼─────────┼─────────
Image File (JPG/PNG)         |    ⚠️    | ✅  |    ❌   |   ✅
Public Profile Picture       |    ⚠️    | ✅  |    ⚠️   |   ✅
Business Registration Doc    |    ⚠️    | ✅  |    ❌   |   ✅
Project Reference Photo      |    ⚠️    | ✅  |    ❌   |   ✅
─────────────────────────────┼──────────┼─────┼─────────┼─────────
Quote PDF (public)           |    ✅    | ✅  |    ⚠️   |   ✅
RFQ Description (public)     |    ✅    | ⚠️  |    ✅   |   ✅
Vendor Bio (public)          |    ✅    | ⚠️  |    ✅   |   ✅

Legend:
✅ YES - Store here
❌ NO - Never store
⚠️  MAYBE - Only if necessary and encrypted
```

---

## 📐 ARCHITECTURE: Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      USER SUBMITS RFQ                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
      ┌──────────────┴──────────────┐
      │                             │
      ↓                             ↓
┌─────────────────┐      ┌──────────────────┐
│  FORM DATA      │      │   IMAGE FILES    │
├─────────────────┤      ├──────────────────┤
│ Text fields     │      │ PNG, JPG, WebP   │
│ Pricing info    │      │ 1-10MB each      │
│ Categories      │      │ 1-5 files max    │
│ Location        │      │                  │
└────────┬────────┘      └────────┬─────────┘
         │                        │
         │                        │
    SMALL (KB)            LARGE (MB)
         │                        │
         ↓                        ↓
    ┌─────────────────────────────────────┐
    │                                     │
    │  AWS S3 ← Large Binary Data         │
    │  ├─ /rfq-images/                    │
    │  │  └─ 1736520000-abc123-site.jpg  │
    │  └─ Returns: S3 URL & Key           │
    │                                     │
    └──────────────┬──────────────────────┘
                   │
                   │ (S3 URL only)
                   ↓
         ┌─────────────────────┐
         │                     │
         │  SUPABASE DB        │
         │  ├─ rfqs table      │
         │  └─ attachments     │
         │     {JSONB}         │
         │     ├─ title        │
         │     ├─ description  │
         │     ├─ category     │
         │     └─ images       │
         │        [S3 URLs]    │
         │                     │
         └─────────┬───────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ↓                   ↓
    ┌──────────────┐  ┌────────────────┐
    │ When Vendor  │  │ When Client    │
    │ Views RFQ   │  │ Views Quotes   │
    ├──────────────┤  ├────────────────┤
    │ Fetch RFQ   │  │ Fetch quotes   │
    │ Get S3 URLs │  │ Get S3 URLs    │
    │ Load images │  │ Load images    │
    │ Display all │  │ Display all    │
    └──────────────┘  └────────────────┘
```

---

## 🎯 DECISION TREE: Should It Go to S3?

```
START: Do I have new data to store?
│
├─→ Is it a FILE? (image, PDF, video, document)
│   ├─→ YES
│   │   ├─→ Is it > 1MB?
│   │   │   ├─→ YES → 🎯 PUSH TO S3
│   │   │   └─→ NO  → Store URL/path in DB, or embed if critical
│   │   └─→ Contains sensitive data?
│   │       ├─→ YES → 🔒 Encrypt in DB, reference S3
│   │       └─→ NO  → 🎯 PUSH TO S3
│   │
│   └─→ NO (It's TEXT/STRUCTURED DATA)
│       ├─→ Is it QUERYABLE? (need to search/filter)
│       │   ├─→ YES → 📊 KEEP IN SUPABASE
│       │   └─→ NO  → Is it > 100KB?
│       │       ├─→ YES → 🎯 Consider S3 (archive only)
│       │       └─→ NO  → 📊 KEEP IN SUPABASE
│       │
│       └─→ Does it need RELATIONSHIPS?
│           ├─→ YES → 📊 KEEP IN SUPABASE
│           └─→ NO  → Is it HISTORICAL?
│               ├─→ YES → 🎯 S3 (for archival)
│               └─→ NO  → 📊 KEEP IN SUPABASE
│
END: Decision made
```

---

## 💰 COST COMPARISON: S3 vs Supabase

### Storage Costs (per GB/month)
| Service | Cost | Best For |
|---------|------|----------|
| **Supabase** | $0.025/GB | Small files, structured data |
| **AWS S3** | $0.023/GB | Large files, infrequent access |
| **S3 Intelligent Tiering** | $0.0125/GB | Mixed access patterns |

### Data Transfer Costs
| Scenario | Cost | Optimization |
|----------|------|---------------|
| Download from S3 | $0.09/GB (first 1GB free) | Use CloudFront CDN |
| Upload to S3 | FREE | No limits |
| Database queries | $1/month per 1M reads | Optimize queries |

### Recommendation for Zintra
```
Estimate: 1000 RFQs, 5 images each = 5000 images

Scenario A: All in Supabase
  └─ 5000 images × 2MB avg = 10GB
  └─ Cost: 10GB × $0.025 = $0.25/month
  └─ Problem: Slow queries, data bloat

Scenario B: Images in S3, references in DB ✅
  └─ S3: 10GB images = $0.23/month
  └─ DB: 5000 URLs (1KB each) = $0.0005/month
  └─ Total: $0.23/month
  └─ Benefit: Fast queries, optimized storage

SAVE: Faster performance + negligible cost difference
```

---

## 📚 QUICK REFERENCE: File Size Limits

### Current Limits (Configured)
```javascript
// RFQ Images
Maximum File Size: 10MB
Allowed Types: image/jpeg, image/png, image/webp, image/gif
Max Files: 5 per RFQ

// Vendor Images
Maximum File Size: 10MB
Allowed Types: image/jpeg, image/png, image/webp, image/gif
Max Files: Unlimited (but recommend limiting in UI)
```

### Recommended Limits (Future)
```javascript
// PDFs/Documents
Maximum File Size: 50MB
Allowed Types: application/pdf, image/*
Max Files: 10

// Videos (Phase 3)
Maximum File Size: 500MB
Allowed Types: video/mp4, video/quicktime
Max Files: 3

// Archives (Phase 4)
Maximum File Size: 100MB
Allowed Types: application/zip
Max Files: 5
```

---

## ✅ IMPLEMENTATION CHECKLIST

### What's Ready Now ✅
- [x] RFQ reference images → S3
- [x] Vendor profile images → S3
- [x] Environment variables configured
- [x] Upload APIs functional
- [x] CORS configured (pending manual AWS step)
- [x] Frontend components integrated

### What to Implement Next ⏳
- [ ] Document upload for certifications
- [ ] PDF export of quotes to S3
- [ ] Portfolio image high-res versions
- [ ] Image optimization/resizing
- [ ] CDN integration for faster delivery
- [ ] Automated cleanup of old files

### What to Plan (Phase 2)
- [ ] Video uploads for portfolio
- [ ] Watermarking for professional images
- [ ] Image metadata extraction (EXIF)
- [ ] Bulk upload functionality
- [ ] Archive/backup to Glacier for old files

---

## 🔗 RELATED FILES

**Setup & Configuration**:
- `AWS_S3_SETUP_COMPLETE_FINAL.md` - Full setup guide
- `AWS_S3_TODAY_COMPLETION.md` - Quick 30-min guide
- `.env.local` - Credentials and configuration

**Implementation**:
- `/lib/aws-s3.js` - Core S3 utilities (268 lines)
- `/pages/api/rfq/upload-image.js` - RFQ upload API
- `/pages/api/vendor/upload-image.js` - Vendor upload API
- `/components/RFQModal/RFQImageUpload.jsx` - RFQ upload UI
- `/components/vendor/VendorImageUpload.js` - Vendor upload UI

**Database**:
- `rfqs.attachments` (JSONB) - Stores RFQ data including S3 URLs
- `rfq_responses` (table) - Stores quote data
- `vendors.logo_url` - Vendor logo S3 URL
- `vendors.banner_url` - Vendor banner S3 URL

---

## 💡 BEST PRACTICES

### 1. Always Store URL + Key
```javascript
// Good ✅
{
  fileUrl: "https://s3.amazonaws.com/...",
  fileKey: "rfq-images/1736520000-abc123-site.jpg"
}

// Bad ❌
{
  onlyUrl: "https://s3.amazonaws.com/..."
  // If you need to delete, you can't without the key
}
```

### 2. Use Metadata for Searchability
```javascript
// Good ✅
S3 Metadata:
├─ vendor-id: "vendor-123"
├─ rfq-id: "rfq-456"
├─ uploaded-by: "user@example.com"
└─ uploaded-at: "2026-01-11T10:30:00Z"

// Then search in database by these relationships
```

### 3. Generate Unique Filenames
```javascript
// Good ✅
fileKey = `rfq-images/${timestamp}-${randomId}-${originalFileName}`
// Result: rfq-images/1736520000-abc7d9-site-plan.jpg

// Prevents overwrites and conflicts
```

### 4. Validate Before Upload
```javascript
// Always validate on client AND server
if (file.size > 10 * 1024 * 1024) {
  return error("File too large");
}
if (!['image/jpeg', 'image/png'].includes(file.type)) {
  return error("Invalid file type");
}
```

### 5. Clean Up on Failure
```javascript
// If database insert fails after S3 upload,
// delete the S3 file
try {
  const s3Result = await uploadToS3(file);
  const dbResult = await saveToDatabase(s3Result);
} catch (error) {
  // If DB fails, remove S3 file
  if (s3Result) {
    await deleteFromS3(s3Result.key);
  }
  throw error;
}
```

---

## 🎓 QUICK EXAMPLES

### Example 1: Adding a New Image Type to S3

```javascript
// 1. Create API endpoint
// /pages/api/rework-upload-image.js

export default async function handler(req, res) {
  // Authenticate user
  // Validate file
  // Generate presigned URL using lib/aws-s3.js
  // Return upload details
}

// 2. Create component
// /components/ReworkImageUpload.jsx

function ReworkImageUpload() {
  // Get presigned URL from API
  // Upload file directly to S3
  // Store URL in Supabase rework table
  // Display success message
}

// 3. Update database
// Add rework.images JSONB column to store S3 URLs

// 4. Test
// Navigate to component, upload image, verify in S3
```

### Example 2: Exporting Data to S3

```javascript
// When user clicks "Export Quote as PDF"

async function exportQuoteToPDF(quoteId) {
  // 1. Fetch quote from Supabase
  const quote = await getQuoteFromDB(quoteId);
  
  // 2. Generate PDF from data
  const pdfBuffer = await generatePDFFromQuote(quote);
  
  // 3. Upload to S3
  const uploadResult = await uploadFileToS3(
    `vendor-quotes/${quote.vendor_id}/quote-${quoteId}.pdf`,
    pdfBuffer,
    'application/pdf'
  );
  
  // 4. Save URL in database
  await saveQuotePDFUrl(quoteId, uploadResult.fileUrl);
  
  // 5. Return download link to user
  return uploadResult.fileUrl;
}
```

---

## ❓ FAQ

**Q: Can I search files in S3?**
A: S3 is not designed for searching. Keep searchable data in Supabase. Use S3 for reference/storage only.

**Q: How do I delete files from S3?**
A: Use `deleteFileFromS3(fileKey)` from `/lib/aws-s3.js`. Always store the fileKey in database.

**Q: What if a file upload fails halfway?**
A: Presigned URLs handle this. If browser closes mid-upload, S3 discards incomplete upload (no charges).

**Q: Can I make S3 files public?**
A: Currently using presigned URLs (temporary access). Can be made public by updating bucket policy, but recommend keeping presigned approach for security.

**Q: How do I backup S3 files?**
A: S3 has built-in redundancy. For long-term backup, enable S3 Versioning or set up AWS Backup.

**Q: What about file expiration?**
A: Presigned URLs expire in 1 hour (upload) or 10 hours (download). Files stay in S3 forever unless deleted or lifecycle policy removes them.

---

**Status**: ✅ **READY FOR IMPLEMENTATION**

This guide covers all data types for your Zintra platform. Use it as reference when deciding where to store new data (S3 vs Supabase).

