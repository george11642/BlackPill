-- Create AI transformations table for "You as a 10/10" feature
CREATE TABLE IF NOT EXISTS ai_transformations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  scenario TEXT NOT NULL,
  scenario_name TEXT NOT NULL,
  original_image_url TEXT,
  transformed_image_url TEXT NOT NULL,
  prompt_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ai_transformations_user_id ON ai_transformations(user_id);
CREATE INDEX idx_ai_transformations_analysis_id ON ai_transformations(analysis_id);
CREATE INDEX idx_ai_transformations_created_at ON ai_transformations(created_at DESC);

-- Enable RLS
ALTER TABLE ai_transformations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own transformations
CREATE POLICY "Users can view own transformations" ON ai_transformations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transformations" ON ai_transformations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transformations" ON ai_transformations
  FOR DELETE USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE ai_transformations IS 'Stores AI-generated "You as a 10/10" transformation images';

