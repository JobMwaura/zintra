-- Fix: Enable RLS on vendor_products table with proper policies
-- Issue: Product insert was failing with "new row violates row-level security policy"
-- Root cause: RLS enabled but no INSERT policy

-- Step 1: Enable RLS on vendor_products table
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;

-- Step 2: Create RLS Policies

-- Policy 1: Anyone can VIEW products (public marketplace)
CREATE POLICY "Anyone can view products" 
  ON public.vendor_products 
  FOR SELECT 
  USING (true);

-- Policy 2: Vendors can CREATE their own products
CREATE POLICY "Vendors can create their own products" 
  ON public.vendor_products 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.vendors WHERE id = vendor_id
    )
  );

-- Policy 3: Vendors can UPDATE their own products
CREATE POLICY "Vendors can update their own products" 
  ON public.vendor_products 
  FOR UPDATE 
  USING (
    auth.uid() = (
      SELECT user_id FROM public.vendors WHERE id = vendor_id
    )
  );

-- Policy 4: Vendors can DELETE their own products
CREATE POLICY "Vendors can delete their own products" 
  ON public.vendor_products 
  FOR DELETE 
  USING (
    auth.uid() = (
      SELECT user_id FROM public.vendors WHERE id = vendor_id
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor_id ON public.vendor_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_created_at ON public.vendor_products(created_at DESC);
