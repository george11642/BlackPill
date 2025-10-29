const { supabaseAdmin } = require('../../../utils/supabase');
const handler = require('../../../api/analyses/index');

describe('GET /api/analyses', () => {
  let req, res;

  beforeEach(() => {
    req = {
      method: 'GET',
      query: {
        limit: '10',
        offset: '0',
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

  it('should return user analyses successfully', async () => {
    const mockAnalyses = [
      {
        id: '1',
        score: 7.5,
        breakdown: {},
        tips: [],
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        score: 8.0,
        breakdown: {},
        tips: [],
        created_at: new Date().toISOString(),
      },
    ];

    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          is: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockAnalyses,
                error: null,
                count: 2,
              }),
            }),
          }),
        }),
      }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      analyses: mockAnalyses,
      total: 2,
    });
  });

  it('should handle pagination correctly', async () => {
    req.query.limit = '5';
    req.query.offset = '10';

    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          is: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0,
              }),
            }),
          }),
        }),
      }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      analyses: [],
      total: 0,
    });
  });

  it('should handle database errors', async () => {
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          is: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to get analyses',
      message: 'Database error',
    });
  });
});

