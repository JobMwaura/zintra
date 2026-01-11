-- ============================================================================
-- PORTFOLIO RPC FUNCTION
-- ============================================================================
-- Create the create_portfolio_project function that the API expects
-- ============================================================================

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

-- Test the function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_portfolio_project';
