const { createCanvas, loadImage, registerFont } = require('canvas');
const sharp = require('sharp');

/**
 * Generate share card PNG image (1080x1920px)
 * Matches PRD specifications: Section 3.1 F3
 */
async function generateShareCardImage(shareData) {
  const width = 1080;
  const height = 1920;
  
  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background: Solid #0F0F1E with subtle gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0F0F1E');
  gradient.addColorStop(1, '#1A1A2E');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Load user image if available (as background)
  try {
    if (shareData.image_url) {
      const userImage = await loadImage(shareData.image_url);
      // Draw image as blurred background (subtle)
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.drawImage(userImage, 0, 0, width, height);
      ctx.globalAlpha = 1.0;
      ctx.restore();
    }
  } catch (err) {
    console.warn('Could not load user image for share card:', err.message);
  }

  // Score: Large, centered, neon pink (#FF0080)
  ctx.fillStyle = '#FF0080';
  ctx.font = 'bold 120px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const scoreText = shareData.score.toFixed(1);
  ctx.fillText(scoreText, width / 2, height * 0.25);

  // Add "Score" label below
  ctx.fillStyle = '#B8BACC';
  ctx.font = '36px Inter, sans-serif';
  ctx.fillText('Attractiveness Score', width / 2, height * 0.32);

  // Breakdown: 6 categories with scores
  const breakdown = shareData.breakdown || {};
  const categories = [
    { key: 'symmetry', label: 'Symmetry' },
    { key: 'jawline', label: 'Jawline' },
    { key: 'eyes', label: 'Eyes' },
    { key: 'lips', label: 'Lips' },
    { key: 'skin', label: 'Skin Quality' },
    { key: 'bone_structure', label: 'Bone Structure' },
  ];

  const startY = height * 0.4;
  const lineHeight = 80;
  const leftMargin = 100;
  const rightMargin = width - 100;

  categories.forEach((category, index) => {
    const y = startY + (index * lineHeight);
    const score = breakdown[category.key] || 0;
    
    // Category label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(category.label, leftMargin, y);

    // Score value
    ctx.fillStyle = '#00D9FF';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(score.toFixed(1), rightMargin, y);

    // Progress bar background
    const barY = y + 15;
    const barWidth = rightMargin - leftMargin;
    const barHeight = 6;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(leftMargin, barY, barWidth, barHeight);

    // Progress bar fill (gradient)
    const progressWidth = (barWidth * score) / 10;
    const barGradient = ctx.createLinearGradient(leftMargin, barY, leftMargin + progressWidth, barY);
    barGradient.addColorStop(0, '#FF0080');
    barGradient.addColorStop(1, '#00D9FF');
    ctx.fillStyle = barGradient;
    ctx.fillRect(leftMargin, barY, progressWidth, barHeight);
  });

  // Referral code: Mono font, centered
  if (shareData.referral_code) {
    const codeY = height * 0.75;
    ctx.fillStyle = '#B8BACC';
    ctx.font = '20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Use my referral code:', width / 2, codeY);
    
    ctx.fillStyle = '#00FF41';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.fillText(shareData.referral_code, width / 2, codeY + 50);
  }

  // QR code placeholder (would need actual QR generation)
  // For now, draw a placeholder square
  const qrSize = 120;
  const qrX = (width - qrSize) / 2;
  const qrY = height * 0.85;
  
  ctx.fillStyle = '#FF0080';
  ctx.fillRect(qrX, qrY, qrSize, qrSize);
  ctx.fillStyle = '#0F0F1E';
  ctx.font = '14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('QR', qrX + qrSize / 2, qrY + qrSize / 2 + 5);

  // Watermark: "black-pill.app" footer
  ctx.fillStyle = 'rgba(184, 186, 204, 0.5)';
  ctx.font = '18px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('black-pill.app', width / 2, height - 40);

  // Convert canvas to PNG buffer
  return canvas.toBuffer('image/png');
}

/**
 * Generate QR code for referral link
 * Uses a simple approach - for production, use qrcode library
 */
async function generateQRCode(text) {
  // Placeholder - in production, use 'qrcode' npm package
  // For now, return null and we'll skip QR in the image
  return null;
}

module.exports = {
  generateShareCardImage,
  generateQRCode,
};

