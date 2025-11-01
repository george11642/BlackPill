/**
 * GET /api/scoring/methodology
 * Get full scoring methodology documentation (no auth required)
 */
const METHODOLOGY = {
  overview: {
    title: 'How Your Score is Calculated',
    description:
      'BlackPill uses a transparent, evidence-based scoring system. Your overall score is calculated as a weighted average of six key facial features.',
  },
  categories: {
    symmetry: {
      name: 'Symmetry',
      defaultWeight: 20,
      adjustableRange: [15, 25],
      factors: [
        'Face horizontal symmetry (left/right)',
        'Eye alignment and spacing',
        'Nose centering',
        'Mouth symmetry',
      ],
      measurement: 'Facial landmark analysis (68 points)',
      scientificBasis: 'Studies show <5% deviation is ideal (Rhodes et al., 2007)',
      howItWorks:
        'We analyze 68 facial landmarks to measure horizontal symmetry. Perfect symmetry has 0% deviation, but natural faces typically have 2-5% deviation.',
    },
    skin: {
      name: 'Skin Quality',
      defaultWeight: 20,
      adjustableRange: [15, 25],
      factors: [
        'Texture uniformity',
        'Blemish detection',
        'Under-eye darkness',
        'Overall complexion',
      ],
      measurement: 'Computer vision texture analysis',
      scientificBasis: 'Clear skin correlates with health perception (Fink et al., 2012)',
      howItWorks:
        'Using computer vision, we analyze skin texture, detect blemishes, and assess overall complexion quality.',
    },
    jawline: {
      name: 'Jawline Definition',
      defaultWeight: 15,
      adjustableRange: [10, 20],
      factors: [
        'Jaw angle and definition',
        'Chin prominence',
        'Facial width-to-height ratio',
        'Mandible structure',
      ],
      measurement: 'Geometric facial analysis',
      scientificBasis: 'Strong jawline associated with masculinity and health (Fink et al., 2005)',
      howItWorks:
        'We measure jaw angles, chin prominence, and facial proportions to assess jawline definition.',
    },
    eyes: {
      name: 'Eye Features',
      defaultWeight: 15,
      adjustableRange: [10, 20],
      factors: [
        'Eye spacing (interpupillary distance)',
        'Eye size and shape',
        'Brow position',
        'Eyelid symmetry',
      ],
      measurement: 'Facial landmark ratios',
      scientificBasis: 'Eye spacing and size contribute to facial attractiveness (Langlois et al., 2000)',
      howItWorks:
        'We measure eye spacing relative to face width, eye size, and brow position to assess eye attractiveness.',
    },
    lips: {
      name: 'Lip Features',
      defaultWeight: 15,
      adjustableRange: [10, 20],
      factors: [
        'Lip fullness and symmetry',
        'Lip-to-nose ratio',
        'Cupid\'s bow definition',
        'Lip color and texture',
      ],
      measurement: 'Facial proportion analysis',
      scientificBasis: 'Fuller lips associated with youth and attractiveness (Fink et al., 2006)',
      howItWorks:
        'We analyze lip fullness, symmetry, and proportions relative to other facial features.',
    },
    bone_structure: {
      name: 'Bone Structure',
      defaultWeight: 15,
      adjustableRange: [10, 20],
      factors: [
        'Cheekbone prominence',
        'Forehead width and height',
        'Facial harmony and proportions',
        'Overall bone structure balance',
      ],
      measurement: '3D facial structure analysis',
      scientificBasis: 'Facial bone structure contributes to perceived attractiveness (Rhodes, 2006)',
      howItWorks:
        'We assess overall facial bone structure, cheekbone prominence, and facial harmony.',
    },
  },
  customization: {
    title: 'Customize Your Scoring',
    description:
      'You can adjust the weight of each category within a reasonable range. This allows you to prioritize features that matter most to you.',
    note: 'Total weight must always equal 100%. Adjusting one category will require adjusting others.',
  },
  disclaimers: {
    algorithmic: 'Scores are algorithmic estimates based on conventional beauty standards, not absolute truth.',
    scientific: 'Our methodology is based on peer-reviewed research, but beauty is subjective and culturally influenced.',
    personal: 'Your worth as a person extends far beyond physical appearance.',
    medical: 'This is NOT medical advice. Consult healthcare professionals for health concerns.',
  },
};

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    methodology: METHODOLOGY,
  });
};

