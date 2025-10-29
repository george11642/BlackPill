const { generateShareCardImage } = require('../../utils/share-card-generator');

describe('Share Card Generator', () => {
  const mockShareData = {
    score: 7.5,
    breakdown: {
      symmetry: 8.0,
      jawline: 7.5,
      eyes: 8.0,
      lips: 7.0,
      skin: 7.5,
      bone_structure: 8.0,
    },
    referral_code: 'INVITE-1234-5678',
    share_url: 'https://black-pill.app/ref/INVITE-1234-5678',
    image_url: 'https://example.com/image.jpg',
  };

  it('should generate share card image buffer', async () => {
    const imageBuffer = await generateShareCardImage(mockShareData);

    expect(imageBuffer).toBeInstanceOf(Buffer);
    expect(imageBuffer.length).toBeGreaterThan(0);
  });

  it('should handle missing image URL gracefully', async () => {
    const dataWithoutImage = {
      ...mockShareData,
      image_url: null,
    };

    const imageBuffer = await generateShareCardImage(dataWithoutImage);

    expect(imageBuffer).toBeInstanceOf(Buffer);
    expect(imageBuffer.length).toBeGreaterThan(0);
  });

  it('should handle missing breakdown gracefully', async () => {
    const dataWithoutBreakdown = {
      ...mockShareData,
      breakdown: {},
    };

    const imageBuffer = await generateShareCardImage(dataWithoutBreakdown);

    expect(imageBuffer).toBeInstanceOf(Buffer);
    expect(imageBuffer.length).toBeGreaterThan(0);
  });

  it('should handle missing referral code', async () => {
    const dataWithoutCode = {
      ...mockShareData,
      referral_code: '',
    };

    const imageBuffer = await generateShareCardImage(dataWithoutCode);

    expect(imageBuffer).toBeInstanceOf(Buffer);
    expect(imageBuffer.length).toBeGreaterThan(0);
  });
});

