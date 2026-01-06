-- Update test users to set phone_verified=true for verified user
UPDATE public.users 
SET phone_verified = true,
    phone_verified_at = now()
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Keep unverified user with phone_verified=false
UPDATE public.users
SET phone_verified = false,
    phone_verified_at = null
WHERE id = '22222222-2222-2222-2222-222222222222';
