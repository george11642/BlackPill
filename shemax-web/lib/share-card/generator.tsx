import React from 'react';
import { ImageResponse } from '@vercel/og';

interface ShareData {
  score: number;
  breakdown: Record<string, number>;
  referral_code?: string;
}

/**
 * Generate share card PNG image (1080x1920px) using Vercel OG
 * Serverless-compatible replacement for canvas-based generation
 */
export async function generateShareCardImage(shareData: ShareData): Promise<ArrayBuffer> {
  const { score, breakdown, referral_code } = shareData;

  // Categories for display
  const categories = [
    { key: 'symmetry', label: 'Symmetry' },
    { key: 'jawline', label: 'Jawline' },
    { key: 'eyes', label: 'Eyes' },
    { key: 'lips', label: 'Lips' },
    { key: 'skin', label: 'Skin Quality' },
    { key: 'bone_structure', label: 'Bone Structure' },
    { key: 'hair', label: 'Hair Quality' },
  ];

  // Generate the image using React-like JSX syntax
  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '1080px',
          height: '1920px',
          backgroundColor: '#0F0F1E',
          backgroundImage: 'linear-gradient(180deg, #0F0F1E 0%, #1A1A2E 100%)',
          padding: '80px',
          fontFamily: 'Inter, sans-serif',
          color: 'white',
        }}
      >
        {/* Score Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '120px',
            marginBottom: '80px',
          }}
        >
          <div
            style={{
              fontSize: '180px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #FF0080 0%, #00D9FF 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {score.toFixed(1)}
          </div>
          <div
            style={{
              fontSize: '36px',
              color: '#B8BACC',
              marginTop: '20px',
            }}
          >
            Beauty Score
          </div>
        </div>

        {/* Breakdown Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
            marginBottom: '80px',
          }}
        >
          {categories.map((category) => {
            const categoryScore = breakdown[category.key] || 0;
            const percentage = (categoryScore / 10) * 100;

            return (
              <div
                key={category.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '28px',
                      color: 'white',
                    }}
                  >
                    {category.label}
                  </div>
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: '#00D9FF',
                    }}
                  >
                    {categoryScore.toFixed(1)}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #FF0080 0%, #00D9FF 100%)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Referral Code Section */}
        {referral_code && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              marginTop: 'auto',
              marginBottom: '60px',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                color: '#B8BACC',
              }}
            >
              Use my referral code:
            </div>
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                color: '#00FF41',
                padding: '20px 40px',
                backgroundColor: 'rgba(0, 255, 65, 0.1)',
                borderRadius: '12px',
                border: '2px solid #00FF41',
              }}
            >
              {referral_code}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 'auto',
            fontSize: '24px',
            color: 'rgba(184, 186, 204, 0.5)',
          }}
        >
          shemax.app
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
    }
  );

  // Return the image as an ArrayBuffer
  return await imageResponse.arrayBuffer();
}

