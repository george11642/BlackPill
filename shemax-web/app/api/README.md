# API Routes

This directory contains Next.js API routes migrated from Express.js backend.

## Migration Status

All API routes need to be migrated from `backend/api/` to `web/app/api/`.

## Migration Pattern

**Express.js Format:**
```javascript
// backend/api/analyze/index.js
app.post('/api/analyze', async (req, res) => {
  const result = await analyzeImage(req.body);
  res.json(result);
});
```

**Next.js Format:**
```typescript
// web/app/api/analyze/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await analyzeImage(body);
  return NextResponse.json(result);
}
```

## Endpoints to Migrate

See `docs/MIGRATION_GUIDE.md` for the complete list of 60+ endpoints.

## Example Migrations

- `api/auth/me/route.ts` - Basic auth endpoint (example)
- `api/analyze/route.ts` - Analysis endpoint (placeholder)

