# Phase 1: Photo Saving — Plan 01

## Objective
Fix photos not saving to Supabase Storage when users capture/analyze photos in the mobile app.

## Execution Context
@mobile/screens/CameraScreen.tsx
@supabase/functions/ai/index.ts
@supabase/functions/_shared/supabase.ts
@supabase/migrations/003_storage_buckets.sql
@supabase/migrations/023_convert_analyses_bucket_to_private.sql

## Context

### Current Flow
1. User captures photo or picks from gallery in `CameraScreen.tsx`
2. Image resized to 1920x1920 with 0.8 compression via expo-image-manipulator
3. FormData created with image file attached
4. POST to `/functions/v1/ai?action=analyze` with Bearer auth token
5. Edge Function receives image, validates, and uploads to `analyses` bucket
6. Signed URLs generated for main image and thumbnail
7. Analysis saved to `analyses` table with URLs

### Storage Configuration
- Bucket: `analyses` (private)
- Structure: `{user_id}/{file_id}.jpg`
- Policies:
  - `analyses_select_own`: Authenticated users see own files
  - `analyses_service_role_all`: Service role has full access
  - `analyses_upload_own`: Users can upload to their own folder

### Potential Failure Points (Requires Investigation)
1. **Bucket doesn't exist** — Migration may not have run in production
2. **Service role key not configured** — Edge Function can't authenticate as admin
3. **Storage policies conflicting** — Upload policy may block service role
4. **File data not reaching Edge Function** — FormData parsing issue on Deno
5. **Image bytes empty** — Uint8Array conversion fails silently

### Files to Modify
| File | Purpose |
|------|---------|
| `supabase/functions/ai/index.ts` | Add diagnostic logging for upload failures |
| `mobile/screens/CameraScreen.tsx` | Add error details to failure alerts |
| `shemax-mobile/screens/CameraScreen.tsx` | Mirror mobile changes |

## Tasks

### Task 1: Add Diagnostic Logging to Edge Function
**File:** `supabase/functions/ai/index.ts`

Add detailed logging around the upload flow to identify exactly where failure occurs:
- Log image file size and type before upload
- Log Uint8Array length after conversion
- Log bucket upload attempt with filename
- Log full error object on upload failure
- Log signed URL generation attempts

### Task 2: Verify Bucket Exists via Supabase CLI
**Action:** Check if `analyses` bucket exists in production

```bash
# List buckets to verify 'analyses' exists
npx supabase storage ls --project-ref wzsxpxwwgaqiaoxdyhnf
```

If bucket missing, document for manual creation in Supabase dashboard.

### Task 3: Verify Service Role Configuration
**Action:** Confirm Edge Function has SUPABASE_SERVICE_ROLE_KEY

Check `supabase/functions/_shared/supabase.ts` for service role client creation.
Verify environment variable is set in Supabase Functions settings.

### Task 4: Add Client-Side Error Details
**File:** `mobile/screens/CameraScreen.tsx`

Improve error handling in `analyzePhoto()`:
- Extract full error response body
- Show specific error message from server
- Log error details for debugging

### Task 5: Test Upload Flow End-to-End
**Action:** Manual test with logging enabled

1. Deploy Edge Function with new logging
2. Attempt photo upload via mobile app
3. Check Supabase Function logs for failure point
4. Document specific error found

### Task 6: Apply Fix Based on Investigation
**Action:** Fix the root cause identified in Task 5

Likely fixes:
- If bucket missing: Create via migration or dashboard
- If service role issue: Configure environment variable
- If policy issue: Update storage policies
- If FormData issue: Adjust parsing in Edge Function

### Task 7: Mirror Changes to shemax-mobile
**File:** `shemax-mobile/screens/CameraScreen.tsx`

Copy all CameraScreen changes from `mobile/` to `shemax-mobile/`.

### Task 8: Verify Fix Works
**Action:** End-to-end test

1. Capture photo in app
2. Confirm upload succeeds (no error alert)
3. Check `analyses` table has new record
4. Check Storage bucket has image file
5. Verify signed URL works (image loads in app)

## Verification

### Automated Checks
- [ ] TypeScript compiles without errors
- [ ] App builds successfully

### Manual Checks
- [ ] Photo capture completes without error
- [ ] `analyses` table has new record with valid image_url
- [ ] Storage bucket shows uploaded image
- [ ] Image displays correctly in ProgressPicturesScreen

## Success Criteria
- Photos captured in app successfully upload to Supabase Storage
- Analysis records saved with valid signed URLs
- Images can be retrieved and displayed in the app
- No regression in existing functionality

## Output
- Working photo upload flow
- Diagnostic logging in place for future debugging
- Both mobile apps updated
- Root cause documented in session notes

---
*Created: 2026-01-10*
*Phase: 1 of 5*
*Estimated scope: Small-Medium (investigation + fix)*
