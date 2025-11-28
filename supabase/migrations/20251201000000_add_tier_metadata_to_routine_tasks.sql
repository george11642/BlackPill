-- Add 3-tier action plan metadata columns to routine_tasks table
ALTER TABLE routine_tasks
ADD COLUMN tier TEXT DEFAULT 'DIY' CHECK (tier IN ('DIY', 'OTC', 'Professional')),
ADD COLUMN estimated_cost TEXT,
ADD COLUMN time_to_results TEXT,
ADD COLUMN effectiveness TEXT CHECK (effectiveness IN ('low', 'medium', 'high', 'very high')),
ADD COLUMN science_backing TEXT,
ADD COLUMN professional_warning TEXT;

-- Create indexes for better query performance
CREATE INDEX idx_routine_tasks_tier ON routine_tasks(tier);
CREATE INDEX idx_routine_tasks_effectiveness ON routine_tasks(effectiveness);

-- Add comments for clarity
COMMENT ON COLUMN routine_tasks.tier IS 'Tier level: DIY (free), OTC (products), or Professional (medical treatments)';
COMMENT ON COLUMN routine_tasks.estimated_cost IS 'Estimated cost range for this task (e.g., "$0-30", "$50-150")';
COMMENT ON COLUMN routine_tasks.time_to_results IS 'Expected time to see results (e.g., "4-8 weeks")';
COMMENT ON COLUMN routine_tasks.effectiveness IS 'Effectiveness rating: low, medium, high, or very high';
COMMENT ON COLUMN routine_tasks.science_backing IS 'Scientific explanation of why this works';
COMMENT ON COLUMN routine_tasks.professional_warning IS 'Safety or warning information for professional tier tasks';

