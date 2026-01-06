-- Week 1 Testing: Create Test Users for RFQ Submission Flow Testing

-- Create test users (using valid UUIDs)
INSERT INTO auth.users (id, email, phone, raw_app_meta_data) VALUES
('11111111-1111-1111-1111-111111111111', 'test-verified@example.com', '+254712345678', '{"phone_verified": true}'),
('22222222-2222-2222-2222-222222222222', 'test-unverified@example.com', '+254712345679', '{"phone_verified": false}');

INSERT INTO public.users (id, email, phone_verified, email_verified, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'test-verified@example.com', true, true, NOW()),
('22222222-2222-2222-2222-222222222222', 'test-unverified@example.com', false, false, NOW());

-- Test vendor IDs from existing vendors (for cURL testing)
-- Use these vendor IDs in your test requests:
-- Direct RFQ: 8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11, f3a72a11-91b8-4a90-8b82-24b35bfc9801
-- Wizard/Public RFQ: 2cb95bde-4e5a-4b7c-baa4-7d50978b7a33, cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11
-- Vendor Request: aa64bff8-7e1b-4a9f-9b09-775b9d78e201
-- Other vendors: 3b72d211-3a11-4b45-b7a5-3212c4219e08, b4f2c6ef-81b3-45d7-b42b-8036cbf210d4, 3688f0ab-4c1d-4a5e-9345-2df1da846544
