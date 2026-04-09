-- ============================================================================
-- COMMENT REACTIONS TABLE
-- ============================================================================
-- Tracks emoji reactions on comments (👍 👎 ❤️ 😂 🔥 etc.)

CREATE TABLE IF NOT EXISTS public.vendor_status_update_comment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.vendor_status_update_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL, -- Single emoji character
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(comment_id, user_id, emoji) -- One reaction type per user per comment
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON public.vendor_status_update_comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON public.vendor_status_update_comment_reactions(user_id);

-- Enable RLS
ALTER TABLE public.vendor_status_update_comment_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view reactions
CREATE POLICY "Anyone can view reactions" 
ON public.vendor_status_update_comment_reactions FOR SELECT 
USING (true);

-- Policy: Authenticated users can add reactions
CREATE POLICY "Users can add reactions" 
ON public.vendor_status_update_comment_reactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions" 
ON public.vendor_status_update_comment_reactions FOR DELETE 
USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.vendor_status_update_comment_reactions TO authenticated;

-- Comment for clarity
COMMENT ON TABLE public.vendor_status_update_comment_reactions IS 'Tracks emoji reactions on status update comments';
