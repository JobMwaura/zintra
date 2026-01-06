-- Week 1 Testing: Create Test Users for RFQ Submission Flow Testing
-- Uses existing vendors in your database (no new vendor creation needed)

-- Create corresponding users in public.users table with verification status
-- Verified user: phone_verified=true
-- Unverified user: phone_verified=false
INSERT INTO public.users (id, email, phone, phone_verified, phone_verified_at, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'test-verified@example.com', '+254712345678', true, now(), now()),
('22222222-2222-2222-2222-222222222222', 'test-unverified@example.com', '+254712345679', false, null, now())
ON CONFLICT (id) DO UPDATE SET
  phone_verified = EXCLUDED.phone_verified,
  phone_verified_at = EXCLUDED.phone_verified_at,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;
