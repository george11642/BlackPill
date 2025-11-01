-- Migration: Create analysis comparisons view
-- Date: 2025-10-30
-- Description: F8 - Before/After Comparison View for tracking progress

-- Create view for easy comparisons
CREATE OR REPLACE VIEW public.analysis_comparisons AS
SELECT 
  a1.id as before_id,
  a1.user_id,
  a1.image_url as before_image,
  a1.image_thumbnail_url as before_thumbnail,
  a1.score as before_score,
  a1.breakdown as before_breakdown,
  a1.created_at as before_date,
  a2.id as after_id,
  a2.image_url as after_image,
  a2.image_thumbnail_url as after_thumbnail,
  a2.score as after_score,
  a2.breakdown as after_breakdown,
  a2.created_at as after_date,
  (a2.score - a1.score) as score_delta,
  EXTRACT(DAY FROM (a2.created_at - a1.created_at)) as days_between
FROM public.analyses a1
CROSS JOIN public.analyses a2
WHERE a1.user_id = a2.user_id
  AND a1.created_at < a2.created_at
  AND a1.deleted_at IS NULL
  AND a2.deleted_at IS NULL;

-- Grant access
GRANT SELECT ON public.analysis_comparisons TO authenticated;

-- Comments
COMMENT ON VIEW public.analysis_comparisons IS 'View for comparing any two analyses from the same user';

