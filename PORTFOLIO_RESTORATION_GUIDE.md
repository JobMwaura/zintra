# Portfolio Restoration Guide

## Portfolio was working perfectly before - let's restore it!

The portfolio tables and RPC function were accidentally missing from your Supabase database. We're going to recreate them.

---

## Step 1: Create Portfolio Tables

Go to **https://supabase.com/dashboard** → SQL Editor → **New Query**

**Copy and paste this entire SQL:**

```sql
-- ============================================================================
-- CREATE PORTFOLIO PROJECT TABLE
-- ============================================================================

CREATE TABLE public.PortfolioProject (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category_slug text,
  timeline text,
  budget_min numeric,
  budget_max numeric,
  completion_date date,
  location text,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_portfolio_project_vendor_id ON public.PortfolioProject(vendor_id);
CREATE INDEX idx_portfolio_project_created_at ON public.PortfolioProject(created_at DESC);
CREATE INDEX idx_portfolio_project_status ON public.PortfolioProject(status);

-- Enable RLS
ALTER TABLE public.PortfolioProject ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies
CREATE POLICY "portfolio_project_select" ON public.PortfolioProject FOR SELECT USING (true);
CREATE POLICY "portfolio_project_insert" ON public.PortfolioProject FOR INSERT WITH CHECK (true);
CREATE POLICY "portfolio_project_update" ON public.PortfolioProject FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "portfolio_project_delete" ON public.PortfolioProject FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.PortfolioProject TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.PortfolioProject TO service_role;

-- ============================================================================
-- CREATE PORTFOLIO PROJECT IMAGE TABLE
-- ============================================================================

CREATE TABLE public.PortfolioProjectImage (
  id TEXT PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.PortfolioProject(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_type text DEFAULT 'before',
  caption text,
  display_order integer DEFAULT 0,
  uploaded_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_portfolio_project_image_project_id ON public.PortfolioProjectImage(project_id);
CREATE INDEX idx_portfolio_project_image_display_order ON public.PortfolioProjectImage(project_id, display_order);

-- Enable RLS
ALTER TABLE public.PortfolioProjectImage ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies
CREATE POLICY "portfolio_project_image_select" ON public.PortfolioProjectImage FOR SELECT USING (true);
CREATE POLICY "portfolio_project_image_insert" ON public.PortfolioProjectImage FOR INSERT WITH CHECK (true);
CREATE POLICY "portfolio_project_image_update" ON public.PortfolioProjectImage FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "portfolio_project_image_delete" ON public.PortfolioProjectImage FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.PortfolioProjectImage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.PortfolioProjectImage TO service_role;

-- Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%Portfolio%'
ORDER BY table_name;
```

**Click RUN** ✅

You should see 2 rows returned:
- PortfolioProject
- PortfolioProjectImage

---

## Step 2: Create Portfolio RPC Function

In the same SQL Editor, **create a NEW Query** and paste:

```sql
-- Create the create_portfolio_project function
CREATE OR REPLACE FUNCTION public.create_portfolio_project(
  p_vendor_id uuid,
  p_title text,
  p_description text,
  p_category_slug text DEFAULT NULL,
  p_timeline text DEFAULT NULL,
  p_budget_min numeric DEFAULT NULL,
  p_budget_max numeric DEFAULT NULL,
  p_completion_date date DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_status text DEFAULT 'active',
  p_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  vendor_id uuid,
  title text,
  description text,
  category_slug text,
  timeline text,
  budget_min numeric,
  budget_max numeric,
  completion_date date,
  location text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.PortfolioProject (
    id,
    vendor_id,
    title,
    description,
    category_slug,
    timeline,
    budget_min,
    budget_max,
    completion_date,
    location,
    status,
    created_at,
    updated_at
  )
  VALUES (
    COALESCE(p_id, gen_random_uuid()),
    p_vendor_id,
    p_title,
    p_description,
    p_category_slug,
    p_timeline,
    p_budget_min,
    p_budget_max,
    p_completion_date,
    p_location,
    p_status,
    now(),
    now()
  )
  RETURNING
    PortfolioProject.id,
    PortfolioProject.vendor_id,
    PortfolioProject.title,
    PortfolioProject.description,
    PortfolioProject.category_slug,
    PortfolioProject.timeline,
    PortfolioProject.budget_min,
    PortfolioProject.budget_max,
    PortfolioProject.completion_date,
    PortfolioProject.location,
    PortfolioProject.status,
    PortfolioProject.created_at,
    PortfolioProject.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_portfolio_project TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_portfolio_project TO service_role;

-- Verify function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_portfolio_project';
```

**Click RUN** ✅

You should see 1 row returned:
- create_portfolio_project

---

## Step 3: Test Portfolio Feature

1. **Hard refresh your app** (Cmd+Shift+R)
2. **Go to your vendor profile**
3. **Click "Add Portfolio Project"**
4. **Fill in project details** (title, description, images)
5. **Click Save**
6. **Verify the project appears** in your portfolio

---

## What We Created

### PortfolioProject Table
```
id (uuid) → Unique project ID
vendor_id (uuid) → Which vendor owns this
title (text) → Project name
description (text) → Project description
category_slug (text) → Category (e.g., 'construction')
timeline (text) → How long it took
budget_min, budget_max (numeric) → Budget range
completion_date (date) → When it was done
location (text) → Where the project was
status (text) → 'active', 'archived', etc.
created_at, updated_at (timestamps)
```

### PortfolioProjectImage Table
```
id (text) → Unique image ID
project_id (uuid) → FK to PortfolioProject
image_url (text) → S3 URL to the image
image_type (text) → 'before', 'during', or 'after'
caption (text) → Image caption
display_order (int) → Sort order in gallery
uploaded_at (timestamp)
```

### create_portfolio_project RPC Function
- Takes: vendor_id, title, description, and optional fields
- Returns: Complete portfolio project record
- Used by: `/api/portfolio/projects` endpoint

---

## Comparison: Portfolio vs Status Updates

| Aspect | Portfolio | Status Updates |
|--------|-----------|-----------------|
| **Main Table** | PortfolioProject | vendor_status_updates |
| **Images** | Separate PortfolioProjectImage table | Text array in main table |
| **Image Types** | before/during/after | Just URLs |
| **Created Today** | ❌ (being restored) | ✅ (fresh) |
| **API** | Uses RPC function | Direct CRUD |

---

## After Restoration

✅ Portfolio feature should work again
✅ You can create projects with before/during/after images
✅ Status updates carousel continues to work
✅ Both features coexist without conflict

---

**Run both SQL queries in order, then test the portfolio feature!**
