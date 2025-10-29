const { supabaseAdmin } = require('../../../utils/supabase');
const handler = require('../../../api/share/generate-card');

describe('GET /api/share/generate-card', () => {
  let req, res;

  beforeEach(() => {
    req = {
      method: 'GET',
      query: {
        analysis_id: 'test-analysis-id',
      },
      user: {
        id: 'test-user-id',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if analysis_id is missing', async () => {
    req.query.analysis_id = undefined;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing analysis_id',
    });
  });

  it('should return 404 if analysis not found', async () => {
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Analysis not found',
    });
  });

  it('should generate and upload share card successfully', async () => {
    const mockAnalysis = {
      id: 'test-analysis-id',
      score: 7.5,
      breakdown: {
        symmetry: 8.0,
        jawline: 7.5,
        eyes: 8.0,
        lips: 7.0,
        skin: 7.5,
        bone_structure: 8.0,
      },
      image_url: 'https://example.com/image.jpg',
    };

    const mockUser = {
      referral_code: 'INVITE-1234-5678',
    };

    const mockImageBuffer = Buffer.from('fake-image-data');

    // Mock analysis lookup
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAnalysis,
              error: null,
            }),
          }),
        }),
      }),
    });

    // Mock user lookup
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockUser,
            error: null,
          }),
        }),
      }),
    });

    // Mock storage upload
    supabaseAdmin.storage.from.mockReturnValue({
      upload: jest.fn().mockResolvedValue({
        data: { path: 'share-cards/test-analysis-id.png' },
        error: null,
      }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/share-card.png' },
      }),
    });

    // Mock share log insert
    supabaseAdmin.from.mockReturnValueOnce({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    // Mock the share card generator
    jest.mock('../../../utils/share-card-generator', () => ({
      generateShareCardImage: jest.fn().mockResolvedValue(mockImageBuffer),
    }));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      image_url: 'https://example.com/share-card.png',
      share_url: expect.any(String),
      analysis_id: 'test-analysis-id',
    });
  });
});

