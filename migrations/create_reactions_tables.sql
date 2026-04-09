-- Create vendor_status_update_reactions table
CREATE TABLE IF NOT EXISTS vendor_status_update_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  update_id UUID NOT NULL REFERENCES vendor_status_updates(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure one reaction per user per emoji per update
  UNIQUE(update_id, emoji, user_id)
);

-- Create vendor_status_update_comment_reactions table
CREATE TABLE IF NOT EXISTS vendor_status_update_comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES vendor_status_update_comments(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure one reaction per user per emoji per comment
  UNIQUE(comment_id, emoji, user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_reactions_update_id ON vendor_status_update_reactions(update_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON vendor_status_update_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON vendor_status_update_comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON vendor_status_update_comment_reactions(user_id);

-- Enable RLS on both tables
ALTER TABLE vendor_status_update_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_status_update_comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_status_update_reactions
-- Anyone can read reactions
CREATE POLICY "Anyone can read reactions" 
  ON vendor_status_update_reactions 
  FOR SELECT 
  USING (true);

-- Users can create their own reactions
CREATE POLICY "Users can create their own reactions" 
  ON vendor_status_update_reactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions" 
  ON vendor_status_update_reactions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for vendor_status_update_comment_reactions
-- Anyone can read comment reactions
CREATE POLICY "Anyone can read comment reactions" 
  ON vendor_status_update_comment_reactions 
  FOR SELECT 
  USING (true);

-- Users can create their own comment reactions
CREATE POLICY "Users can create their own comment reactions" 
  ON vendor_status_update_comment_reactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comment reactions
CREATE POLICY "Users can delete their own comment reactions" 
  ON vendor_status_update_comment_reactions 
  FOR DELETE 
  USING (auth.uid() = user_id);
