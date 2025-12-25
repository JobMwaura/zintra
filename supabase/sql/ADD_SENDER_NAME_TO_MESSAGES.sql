-- Add sender_name field to vendor_messages table
-- This allows vendors to see the name/email of who sent the message
-- Instead of just seeing "user" they'll see actual sender name

ALTER TABLE public.vendor_messages
ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255);

-- Add comment explaining the field
COMMENT ON COLUMN public.vendor_messages.sender_name IS 'Name or email of the message sender - populated when message is sent';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_messages_sender_name ON public.vendor_messages(sender_name);

-- If there are existing messages without sender_name, we can try to populate them
-- This query will set sender_name based on user email from auth.users table
UPDATE public.vendor_messages vm
SET sender_name = (
  SELECT email FROM auth.users WHERE id = vm.user_id
)
WHERE sender_type = 'user' AND sender_name IS NULL;

-- For vendor messages, set sender_name to "You" (the vendor will know it's themselves)
UPDATE public.vendor_messages vm
SET sender_name = 'You'
WHERE sender_type = 'vendor' AND sender_name IS NULL;
