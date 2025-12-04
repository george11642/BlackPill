# Apple App Store Review Response - Guideline 2.1: Face Data Collection

## Response to Apple's Questions About Face Data

### 1. What face data does the app collect?

The app collects the following face data:

- **Facial photographs**: Users voluntarily upload or capture selfie photographs through the app's camera interface
- **Facial feature analysis data**: The app uses AI (OpenAI Vision API) to analyze facial features and generates:
  - Overall attractiveness score (1-10 scale)
  - Detailed breakdown scores for 8 facial feature categories:
    - Masculinity (facial structure strength, brow ridge, angularity)
    - Skin quality (texture, clarity, tone)
    - Jawline (definition, angularity, chin projection)
    - Cheekbones (zygomatic prominence, midface structure)
    - Eyes (canthal tilt, spacing, shape)
    - Symmetry (left-right balance, facial harmony)
    - Lips (shape, proportion, fullness)
    - Hair (density, hairline, styling)
  - Personalized descriptions for each feature category
  - Actionable improvement tips based on the analysis

**Important Notes:**
- The app does NOT extract or store biometric templates, facial recognition templates, or any data that could be used for facial recognition identification
- The app does NOT collect facial landmarks coordinates or geometric measurements
- The app does NOT create facial recognition profiles or templates
- The analysis is performed on-demand when users submit photos, and the results are stored as text-based scores and descriptions

### 2. Provide a complete and clear explanation of all planned uses of the collected face data.

**Primary Uses:**
1. **Facial Attractiveness Analysis**: The app analyzes uploaded photos to provide users with personalized attractiveness scores and detailed feedback on 8 facial feature categories
2. **Self-Improvement Guidance**: Based on the analysis, the app generates personalized, actionable tips to help users improve their appearance
3. **Progress Tracking**: Users can track their progress over time by comparing multiple analyses
4. **Goal Setting**: Users can set improvement goals based on their analysis results
5. **Comparison Features**: Users can compare their current analysis with previous analyses to track improvements

**Technical Processing:**
- Photos are processed using OpenAI's Vision API (GPT-4 Vision) for analysis
- The AI analyzes the image and returns structured JSON data containing scores and descriptions
- The original photo and analysis results are stored securely in Supabase (PostgreSQL database and object storage)
- Photos are stored in a private Supabase Storage bucket with user-specific access controls
- Analysis results (scores, descriptions, tips) are stored in the database as JSONB data

**What We Do NOT Use Face Data For:**
- Facial recognition or identification
- Training facial recognition models
- Creating biometric templates
- Sharing with third parties for advertising or marketing
- Any purpose other than providing the analysis service to the user

### 3. Will the face data be shared with any third parties? Where will this information be stored?

**Third-Party Sharing:**
- **OpenAI (GPT-4 Vision API)**: Photos are temporarily sent to OpenAI's Vision API for analysis. This is necessary to provide the core functionality of the app. OpenAI's privacy policy and data usage terms apply. According to OpenAI's current policy, they do not use API data to train their models.
- **No other third parties**: Face data (photos and analysis results) are NOT shared with any other third parties, including:
  - Advertising networks
  - Data brokers
  - Marketing companies
  - Social media platforms
  - Any other service providers

**Storage Location:**
- **Primary Storage**: Supabase (PostgreSQL database and object storage)
  - Database: Stores analysis results (scores, breakdowns, tips) in the `analyses` table
  - Object Storage: Stores original photos and thumbnails in the private `analyses` bucket
  - Location: Supabase cloud infrastructure (data residency depends on Supabase region configuration)
  - Access Control: Photos are stored in a private bucket with Row Level Security (RLS) policies ensuring only the user who uploaded the photo can access it
  - Encryption: Data is encrypted at rest and in transit

**Data Security:**
- All photos are stored in a private Supabase Storage bucket (not publicly accessible)
- Access is controlled through Supabase Row Level Security (RLS) policies
- Photos are accessed only through signed URLs with time-limited expiration (1 hour)
- Database access requires authentication via Supabase JWT tokens
- All API communications use HTTPS/TLS encryption

### 4. How long will face data be retained?

**Retention Period:**
- **Photos**: Automatically deleted from our servers after **90 days** from the date of upload
- **Analysis Results**: Retained as long as the user's account is active, unless the user manually deletes them
- **User Deletion**: Users can manually delete individual photos and analyses at any time through the app
- **Account Deletion**: When a user deletes their account, all associated photos, analyses, and data are permanently deleted (CASCADE delete in database)

**Implementation Notes:**
- The privacy policy states automatic deletion after 90 days
- Users are informed of this retention period in the privacy policy
- The `analyses` table includes a `deleted_at` timestamp field for soft deletion tracking

### 5. Where in the privacy policy is the app's collection, use, disclosure, sharing, and retention of face data explained? Identify the specific sections in the privacy policy where this information is located.

**Privacy Policy Location:**
The privacy policy is available at: `https://www.black-pill.app/privacy` (or the app's privacy policy URL)

**Relevant Sections:**

**Section 2: Information We Collect**
- States: "Photos you upload for analysis"

**Section 3: How We Use Your Information**
- States: "Process your photo analysis"

**Section 4: Face Data Policy** (Dedicated Section)
- This section specifically addresses face data collection, use, and retention

### 6. Quote the specific text from the privacy policy concerning face data.

**Exact Quote from Privacy Policy (Section 4: Face Data Policy):**

> "We take the privacy of your biometric data seriously. Photos uploaded for analysis are processed securely and are automatically deleted from our servers after 90 days. We do not use your photos for facial recognition training or share them with third parties without your explicit consent."

**Additional Relevant Quotes:**

**Section 2: Information We Collect**
> "We collect information that you provide directly to us, including:
> - Photos you upload for analysis
> - Account information (email address, username)
> - Usage data and preferences"

**Section 3: How We Use Your Information**
> "We use the information we collect to:
> - Provide, maintain, and improve our services
> - Process your photo analysis
> - Send you technical notices and support messages
> - Respond to your comments and questions"

---

## Additional Information for Apple Review

### Technical Implementation Details

**Photo Upload Flow:**
1. User captures or selects a photo through the app
2. Photo is uploaded to `/api/analyze` endpoint with user authentication
3. Photo is processed (resized, optimized) using Sharp image processing library
4. Processed photo is uploaded to Supabase Storage in private `analyses` bucket
5. Photo URL is sent to OpenAI Vision API for analysis
6. Analysis results are stored in database
7. User receives analysis results in the app

**Data Access Controls:**
- All database queries use Supabase Row Level Security (RLS)
- Users can only access their own photos and analyses
- Photos are accessed via time-limited signed URLs (1 hour expiration)
- API endpoints require valid JWT authentication tokens

**Compliance:**
- The app complies with user privacy expectations
- Users are informed about data collection and retention
- Users have control to delete their data at any time
- No facial recognition or biometric template creation occurs
- Data is not used for advertising or marketing purposes

---

## Recommendations for Implementation

**Note**: The privacy policy states automatic deletion after 90 days, but you should verify that this is actually implemented. If not, you should either:

1. **Implement automatic deletion**: Create a cron job or scheduled task to delete photos older than 90 days from Supabase Storage and mark corresponding database records as deleted
2. **Update privacy policy**: If automatic deletion is not implemented, update the privacy policy to reflect the actual retention period

**Suggested Implementation for 90-Day Deletion:**
- Create a Supabase Edge Function or cron job that runs daily
- Query the `analyses` table for records older than 90 days where `deleted_at IS NULL`
- Delete corresponding files from Supabase Storage
- Update database records with `deleted_at` timestamp
- Consider notifying users before deletion (optional)

