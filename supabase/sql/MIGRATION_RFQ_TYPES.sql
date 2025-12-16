-- RFQ Types Migration
-- Extends existing RFQs table to support three RFQ types: direct, matched, public

-- 1. Add new columns to rfqs table
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS rfq_type VARCHAR(20) DEFAULT 'public' CHECK (rfq_type IN ('direct', 'matched', 'public'));
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('private', 'semi-private', 'public'));
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS matched_vendors JSONB;

-- 2. Create rfq_recipients table for direct and matched RFQs
CREATE TABLE IF NOT EXISTS rfq_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('direct', 'matched')),
  notification_sent_at TIMESTAMP,
  viewed_at TIMESTAMP,
  quote_submitted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(rfq_id, vendor_id)
);

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rfqs_rfq_type ON rfqs(rfq_type);
CREATE INDEX IF NOT EXISTS idx_rfqs_visibility ON rfqs(visibility);
CREATE INDEX IF NOT EXISTS idx_rfqs_user_id_type ON rfqs(user_id, rfq_type);
CREATE INDEX IF NOT EXISTS idx_rfqs_category_location ON rfqs(category, location) WHERE rfq_type = 'public';
CREATE INDEX IF NOT EXISTS idx_rfqs_deadline ON rfqs(deadline) WHERE rfq_type = 'public';

CREATE INDEX IF NOT EXISTS idx_rfq_recipients_rfq_id ON rfq_recipients(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_recipients_vendor_id ON rfq_recipients(vendor_id);
CREATE INDEX IF NOT EXISTS idx_rfq_recipients_recipient_type ON rfq_recipients(recipient_type);
CREATE INDEX IF NOT EXISTS idx_rfq_recipients_viewed ON rfq_recipients(viewed_at) WHERE viewed_at IS NULL;

-- 4. Create quotes table (if not exists) for tracking vendor responses
CREATE TABLE IF NOT EXISTS rfq_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KES',
  timeline_days INTEGER,
  payment_terms TEXT,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected', 'withdrawn')),
  submitted_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(rfq_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_rfq_quotes_rfq_id ON rfq_quotes(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_quotes_vendor_id ON rfq_quotes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_rfq_quotes_status ON rfq_quotes(status);
CREATE INDEX IF NOT EXISTS idx_rfq_quotes_submitted ON rfq_quotes(submitted_at);

-- 5. Add comment documenting RFQ types
COMMENT ON COLUMN rfqs.rfq_type IS 'RFQ type: direct (customer selects vendors), matched (system auto-matches), public (marketplace)';
COMMENT ON COLUMN rfqs.visibility IS 'Visibility level: private (direct only), semi-private (matched vendors), public (marketplace)';
COMMENT ON TABLE rfq_recipients IS 'Tracks which vendors received direct or matched RFQs';
COMMENT ON TABLE rfq_quotes IS 'Vendor quotes/responses to RFQs';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON rfq_recipients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rfq_quotes TO authenticated;
