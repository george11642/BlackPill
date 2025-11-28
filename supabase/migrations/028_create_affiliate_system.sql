-- Migration: Create affiliate system tables
-- Date: 2025-01-30
-- Description: Create tables and functions for affiliate/referral system with commission tracking

-- Affiliates table (for affiliate program, separate from bonus referrals)
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'base' CHECK (tier IN ('base', 'tier_2', 'tier_3')),
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate referrals table (click tracking and conversions)
CREATE TABLE public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  click_timestamp TIMESTAMPTZ DEFAULT NOW(),
  conversion_timestamp TIMESTAMPTZ,
  attribution_window_days INTEGER DEFAULT 30,
  is_converted BOOLEAN DEFAULT FALSE,
  is_fraudulent BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commissions table
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.affiliate_referrals(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  commission_rate DECIMAL(5,2) NOT NULL,
  subscription_revenue DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  payout_id UUID,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  notes TEXT,
  processed_by UUID REFERENCES public.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from commissions to payouts
ALTER TABLE public.commissions 
ADD CONSTRAINT commissions_payout_id_fkey 
FOREIGN KEY (payout_id) REFERENCES public.payouts(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_referral_code ON public.affiliates(referral_code);
CREATE INDEX idx_affiliates_is_active ON public.affiliates(is_active);
CREATE INDEX idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);
CREATE INDEX idx_affiliate_referrals_referred_user_id ON public.affiliate_referrals(referred_user_id);
CREATE INDEX idx_affiliate_referrals_is_converted ON public.affiliate_referrals(is_converted);
CREATE INDEX idx_commissions_affiliate_id ON public.commissions(affiliate_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);
CREATE INDEX idx_commissions_referral_id ON public.commissions(referral_id);
CREATE INDEX idx_payouts_affiliate_id ON public.payouts(affiliate_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_affiliate_system_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_affiliates_updated_at 
BEFORE UPDATE ON public.affiliates
FOR EACH ROW 
EXECUTE FUNCTION update_affiliate_system_updated_at();

CREATE TRIGGER update_affiliate_referrals_updated_at 
BEFORE UPDATE ON public.affiliate_referrals
FOR EACH ROW 
EXECUTE FUNCTION update_affiliate_system_updated_at();

CREATE TRIGGER update_commissions_updated_at 
BEFORE UPDATE ON public.commissions
FOR EACH ROW 
EXECUTE FUNCTION update_affiliate_system_updated_at();

CREATE TRIGGER update_payouts_updated_at 
BEFORE UPDATE ON public.payouts
FOR EACH ROW 
EXECUTE FUNCTION update_affiliate_system_updated_at();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_affiliate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    code := SUBSTRING(encode(gen_random_bytes(6), 'hex') FROM 1 FOR 8) || 
            '-' || 
            SUBSTRING(encode(gen_random_bytes(4), 'hex') FROM 1 FOR 4);
    code := UPPER(code);
    
    SELECT EXISTS(SELECT 1 FROM public.affiliates WHERE referral_code = code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate commission rate based on active referrals
CREATE OR REPLACE FUNCTION calculate_affiliate_commission_rate(p_affiliate_id UUID)
RETURNS TABLE (tier TEXT, commission_rate DECIMAL) AS $$
DECLARE
  active_referrals_count INTEGER;
  calculated_tier TEXT;
  calculated_rate DECIMAL;
BEGIN
  -- Count active referrals (converted and not fraudulent)
  SELECT COUNT(*) INTO active_referrals_count
  FROM public.affiliate_referrals ar
  WHERE ar.affiliate_id = p_affiliate_id
    AND ar.is_converted = TRUE
    AND ar.is_fraudulent = FALSE;
  
  -- Determine tier and commission rate based on active referrals
  IF active_referrals_count >= 50 THEN
    calculated_tier := 'tier_3';
    calculated_rate := 30.00;
  ELSIF active_referrals_count >= 10 THEN
    calculated_tier := 'tier_2';
    calculated_rate := 25.00;
  ELSE
    calculated_tier := 'base';
    calculated_rate := 20.00;
  END IF;
  
  RETURN QUERY SELECT calculated_tier, calculated_rate;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliates
CREATE POLICY "Users can view their own affiliate record"
  ON public.affiliates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all affiliates"
  ON public.affiliates FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Service role can manage affiliates"
  ON public.affiliates FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for affiliate_referrals
CREATE POLICY "Affiliates can view their own referrals"
  ON public.affiliate_referrals FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM public.affiliates
    WHERE id = affiliate_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all referrals"
  ON public.affiliate_referrals FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Service role can manage referrals"
  ON public.affiliate_referrals FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for commissions
CREATE POLICY "Affiliates can view their own commissions"
  ON public.commissions FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM public.affiliates
    WHERE id = affiliate_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all commissions"
  ON public.commissions FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Service role can manage commissions"
  ON public.commissions FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for payouts
CREATE POLICY "Affiliates can view their own payouts"
  ON public.payouts FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM public.affiliates
    WHERE id = affiliate_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all payouts"
  ON public.payouts FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Service role can manage payouts"
  ON public.payouts FOR ALL
  USING (auth.role() = 'service_role');

