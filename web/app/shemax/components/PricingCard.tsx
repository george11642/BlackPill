import React from 'react';
import Link from 'next/link';
import { Button } from './Button';

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  tier: string;
  commission: number;
  requirement: string;
  features: PricingFeature[];
  isPopular?: boolean;
  ctaText?: string;
  ctaAction?: 'apply' | 'upgrade';
  tierIndex?: number;
  isEntryTier?: boolean;
  upgradeNote?: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  tier,
  commission,
  requirement,
  features,
  isPopular = false,
  ctaText = 'Get Started',
  ctaAction = 'apply',
  tierIndex = 0,
  isEntryTier = true,
  upgradeNote,
}) => {
  return (
    <div
      className={`card relative ${isPopular ? 'ring-2 ring-[#FF0080] scale-105' : ''}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="badge badge-success">Most Popular</span>
        </div>
      )}

      <div className="mb-md">
        <h3 className="text-2xl font-bold mb-sm">{tier}</h3>
        <div className="mb-md">
          <span className="text-4xl font-bold text-gradient">{commission}%</span>
          <span className="text-secondary ml-sm">commission</span>
        </div>
        <p className="text-sm text-secondary">{requirement}</p>
      </div>

      <div className="mb-lg">
        {isEntryTier ? (
          <Link href="/shemax/apply">
            <Button
              variant={isPopular ? 'primary' : 'secondary'}
              size="lg"
              className="w-full"
            >
              {ctaText}
            </Button>
          </Link>
        ) : (
          <div className="space-y-2">
            <Button
              variant="secondary"
              size="lg"
              className="w-full opacity-60 cursor-not-allowed"
              disabled
            >
              {ctaText}
            </Button>
            {upgradeNote && (
              <p className="text-xs text-secondary text-center px-2">
                {upgradeNote}
              </p>
            )}
            <p className="text-xs text-secondary text-center">
              Start with Bronze tier to begin earning
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-[rgba(255,255,255,0.1)] pt-md">
        <p className="text-sm font-semibold mb-md">Includes:</p>
        <ul className="space-y-sm">
          {features.map((feature, index) => (
            <li
              key={index}
              className={`text-sm flex items-center gap-sm ${
                feature.included ? 'text-[#00FF41]' : 'text-secondary opacity-50'
              }`}
            >
              <span>{feature.included ? '✓' : '✗'}</span>
              {feature.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

