-- Task 10: Quote Negotiation System Database Schema
-- Creates tables for managing quote negotiations, counter offers, Q&A, and revision tracking
-- Updated to use rfq_quotes and user_id instead of quotes and buyer_id

-- Create negotiation_threads table
-- Tracks the main negotiation thread for each RFQ quote
CREATE TABLE IF NOT EXISTS negotiation_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_quote_id UUID NOT NULL REFERENCES rfq_quotes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  vendor_id UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'accepted', 'rejected')),
  total_counter_offers INTEGER DEFAULT 0,
  current_price DECIMAL(12,2),
  original_price DECIMAL(12,2),
  final_price DECIMAL(12,2),
  final_scope TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for negotiation_threads
CREATE INDEX IF NOT EXISTS idx_negotiation_threads_rfq_quote_id ON negotiation_threads(rfq_quote_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_threads_user_id ON negotiation_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_threads_vendor_id ON negotiation_threads(vendor_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_threads_status ON negotiation_threads(status);

-- Enable RLS for negotiation_threads
ALTER TABLE negotiation_threads ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own negotiations
CREATE POLICY "Users can view their negotiations" ON negotiation_threads
  FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = vendor_id
  );

-- RLS Policy: Users can create negotiations
CREATE POLICY "Users can create negotiations" ON negotiation_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Participants can update negotiations
CREATE POLICY "Participants can update negotiations" ON negotiation_threads
  FOR UPDATE USING (
    auth.uid() = user_id OR auth.uid() = vendor_id
  );


-- Create counter_offers table
-- Stores each counter offer version in a negotiation
CREATE TABLE IF NOT EXISTS counter_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negotiation_id UUID NOT NULL REFERENCES negotiation_threads(id) ON DELETE CASCADE,
  rfq_quote_id UUID NOT NULL REFERENCES rfq_quotes(id),
  proposed_by UUID NOT NULL REFERENCES users(id),
  proposed_price DECIMAL(12,2) NOT NULL,
  scope_changes TEXT,
  delivery_date DATE,
  payment_terms TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
  response_by_date TIMESTAMP,
  rejected_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for counter_offers
CREATE INDEX IF NOT EXISTS idx_counter_offers_negotiation_id ON counter_offers(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_counter_offers_rfq_quote_id ON counter_offers(rfq_quote_id);
CREATE INDEX IF NOT EXISTS idx_counter_offers_proposed_by ON counter_offers(proposed_by);
CREATE INDEX IF NOT EXISTS idx_counter_offers_status ON counter_offers(status);

-- Enable RLS for counter_offers
ALTER TABLE counter_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view counter offers in their negotiations
CREATE POLICY "Users can view counter offers in their negotiations" ON counter_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM negotiation_threads
      WHERE negotiation_threads.id = counter_offers.negotiation_id
      AND (auth.uid() = negotiation_threads.user_id OR auth.uid() = negotiation_threads.vendor_id)
    )
  );

-- RLS Policy: Users can create counter offers in their negotiations
CREATE POLICY "Users can create counter offers" ON counter_offers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM negotiation_threads
      WHERE negotiation_threads.id = counter_offers.negotiation_id
      AND (auth.uid() = negotiation_threads.user_id OR auth.uid() = negotiation_threads.vendor_id)
    )
  );

-- RLS Policy: Users can update their counter offers
CREATE POLICY "Users can update their counter offers" ON counter_offers
  FOR UPDATE USING (
    auth.uid() = proposed_by OR
    EXISTS (
      SELECT 1 FROM negotiation_threads
      WHERE negotiation_threads.id = counter_offers.negotiation_id
      AND auth.uid() = negotiation_threads.vendor_id AND counter_offers.status = 'pending'
    )
  );


-- Create negotiation_qa table
-- Q&A conversation within a negotiation
CREATE TABLE IF NOT EXISTS negotiation_qa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negotiation_id UUID NOT NULL REFERENCES negotiation_threads(id) ON DELETE CASCADE,
  rfq_quote_id UUID NOT NULL REFERENCES rfq_quotes(id),
  asked_by UUID NOT NULL REFERENCES users(id),
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMP,
  answered_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for negotiation_qa
CREATE INDEX IF NOT EXISTS idx_negotiation_qa_negotiation_id ON negotiation_qa(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_qa_rfq_quote_id ON negotiation_qa(rfq_quote_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_qa_asked_by ON negotiation_qa(asked_by);
CREATE INDEX IF NOT EXISTS idx_negotiation_qa_answered ON negotiation_qa(answered_at);

-- Enable RLS for negotiation_qa
ALTER TABLE negotiation_qa ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view Q&A in their negotiations
CREATE POLICY "Users can view Q&A in their negotiations" ON negotiation_qa
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM negotiation_threads
      WHERE negotiation_threads.id = negotiation_qa.negotiation_id
      AND (auth.uid() = negotiation_threads.user_id OR auth.uid() = negotiation_threads.vendor_id)
    )
  );

-- RLS Policy: Users can create questions
CREATE POLICY "Users can create questions" ON negotiation_qa
  FOR INSERT WITH CHECK (
    auth.uid() = asked_by AND
    EXISTS (
      SELECT 1 FROM negotiation_threads
      WHERE negotiation_threads.id = negotiation_qa.negotiation_id
      AND (auth.uid() = negotiation_threads.user_id OR auth.uid() = negotiation_threads.vendor_id)
    )
  );

-- RLS Policy: Users can answer questions
CREATE POLICY "Users can answer questions" ON negotiation_qa
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM negotiation_threads
      WHERE negotiation_threads.id = negotiation_qa.negotiation_id
      AND (
        (negotiation_threads.vendor_id = auth.uid() AND negotiation_qa.asked_by = negotiation_threads.user_id) OR
        (negotiation_threads.user_id = auth.uid() AND negotiation_qa.asked_by = negotiation_threads.vendor_id)
      )
    )
  );


-- Create quote_revisions table
-- Tracks all changes to a quote during negotiation
CREATE TABLE IF NOT EXISTS quote_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_quote_id UUID NOT NULL REFERENCES rfq_quotes(id) ON DELETE CASCADE,
  revision_number INTEGER DEFAULT 1,
  price DECIMAL(12,2),
  scope_summary TEXT,
  delivery_date DATE,
  payment_terms TEXT,
  changed_by UUID NOT NULL REFERENCES users(id),
  change_reason TEXT NOT NULL,
  revision_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for quote_revisions
CREATE INDEX IF NOT EXISTS idx_quote_revisions_rfq_quote_id ON quote_revisions(rfq_quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_revisions_changed_by ON quote_revisions(changed_by);
CREATE INDEX IF NOT EXISTS idx_quote_revisions_created_at ON quote_revisions(created_at);

-- Enable RLS for quote_revisions
ALTER TABLE quote_revisions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view revisions of quotes they're involved in
CREATE POLICY "Users can view quote revisions" ON quote_revisions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rfq_quotes rq
      INNER JOIN rfqs r ON rq.rfq_id = r.id
      WHERE rq.id = quote_revisions.rfq_quote_id
      AND (auth.uid() = r.user_id OR auth.uid() = rq.vendor_id)
    )
  );


-- Create trigger to update negotiation_threads updated_at
CREATE OR REPLACE FUNCTION update_negotiation_threads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE negotiation_threads
  SET updated_at = NOW()
  WHERE id = NEW.negotiation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER counter_offers_update_negotiation_timestamp
AFTER INSERT OR UPDATE ON counter_offers
FOR EACH ROW
EXECUTE FUNCTION update_negotiation_threads_updated_at();

CREATE TRIGGER negotiation_qa_update_negotiation_timestamp
AFTER INSERT OR UPDATE ON negotiation_qa
FOR EACH ROW
EXECUTE FUNCTION update_negotiation_threads_updated_at();


-- Create trigger to track quote revisions automatically
CREATE OR REPLACE FUNCTION log_quote_revision()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount IS DISTINCT FROM OLD.amount THEN
    
    INSERT INTO quote_revisions (
      rfq_quote_id,
      revision_number,
      price,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      (SELECT COALESCE(MAX(revision_number), 0) + 1 FROM quote_revisions WHERE rfq_quote_id = NEW.id),
      NEW.amount,
      auth.uid(),
      'Quote amount updated'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotes_auto_revision_log
AFTER UPDATE ON rfq_quotes
FOR EACH ROW
EXECUTE FUNCTION log_quote_revision();
