-- Migration: Create product marketplace tables
-- Date: 2025-10-30
-- Description: F15 - In-App Product Marketplace

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'skincare', 'grooming', 'fitness', 'style'
  subcategory TEXT, -- 'cleanser', 'moisturizer', 'serum', 'sunscreen', etc.
  price NUMERIC,
  currency TEXT DEFAULT 'USD',
  affiliate_link TEXT NOT NULL,
  image_url TEXT,
  rating NUMERIC CHECK (rating >= 0 AND rating <= 5),
  review_count INT DEFAULT 0,
  recommended_for TEXT[], -- ['skin', 'jawline', 'acne', 'dry_skin']
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product recommendations (AI-generated)
CREATE TABLE public.product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  relevance_score NUMERIC CHECK (relevance_score >= 0 AND relevance_score <= 1),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product clicks tracking
CREATE TABLE public.product_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_category ON public.products(category, is_active);
CREATE INDEX idx_products_recommended_for ON public.products USING GIN(recommended_for);
CREATE INDEX idx_product_recommendations_analysis ON public.product_recommendations(analysis_id);
CREATE INDEX idx_product_recommendations_user ON public.product_recommendations(user_id);
CREATE INDEX idx_product_clicks_product ON public.product_clicks(product_id, clicked_at DESC);
CREATE INDEX idx_product_clicks_user ON public.product_clicks(user_id, clicked_at DESC);

-- RLS Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

-- Products are public (read-only for authenticated users)
CREATE POLICY "Authenticated users can view products" ON public.products 
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users see own recommendations
CREATE POLICY "Users see own recommendations" ON public.product_recommendations 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own recommendations" ON public.product_recommendations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users see own clicks
CREATE POLICY "Users see own clicks" ON public.product_clicks 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own clicks" ON public.product_clicks 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE public.products IS 'Curated marketplace products with affiliate links';
COMMENT ON TABLE public.product_recommendations IS 'AI-generated product recommendations based on analysis';
COMMENT ON TABLE public.product_clicks IS 'Tracks product link clicks for analytics';

