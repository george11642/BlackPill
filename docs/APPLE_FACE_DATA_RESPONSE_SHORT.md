# Apple App Store Review Response - Guideline 2.1 (Short Version for App Store Connect)

Copy and paste this response into App Store Connect:

---

## 1. What face data does the app collect?

The app collects:
- **Facial photographs**: Users voluntarily upload or capture selfie photographs
- **Facial feature analysis data**: AI-generated scores and descriptions for 8 facial feature categories (masculinity, skin quality, jawline, cheekbones, eyes, symmetry, lips, hair)

**Important**: The app does NOT extract biometric templates, facial recognition templates, facial landmarks coordinates, or create facial recognition profiles. Only on-demand analysis results (scores and text descriptions) are stored.

## 2. Complete explanation of all planned uses of collected face data

**Primary Uses:**
1. Facial attractiveness analysis to provide users with personalized scores and feedback
2. Generate personalized, actionable self-improvement tips based on analysis
3. Enable users to track progress over time by comparing multiple analyses
4. Support goal setting based on analysis results

**Technical Processing:**
- Photos are processed using OpenAI's Vision API (GPT-4 Vision) for analysis
- Original photos and analysis results are stored securely in Supabase (PostgreSQL database and private object storage)
- Analysis results are stored as JSONB data containing scores, descriptions, and tips

**What We Do NOT Use Face Data For:**
- Facial recognition or identification
- Training facial recognition models
- Creating biometric templates
- Sharing with third parties for advertising or marketing
- Any purpose other than providing the analysis service to the user

## 3. Will the face data be shared with any third parties? Where will this information be stored?

**Third-Party Sharing:**
- **OpenAI (GPT-4 Vision API)**: Photos are temporarily sent to OpenAI's Vision API for analysis. This is necessary to provide the core functionality. According to OpenAI's current policy, they do not use API data to train their models.
- **No other third parties**: Face data is NOT shared with advertising networks, data brokers, marketing companies, social media platforms, or any other service providers.

**Storage Location:**
- **Supabase (PostgreSQL database and object storage)**
  - Database: Stores analysis results in the `analyses` table
  - Object Storage: Stores original photos and thumbnails in a private `analyses` bucket
  - Access Control: Photos stored in private bucket with Row Level Security (RLS) policies ensuring only the uploading user can access
  - Encryption: Data encrypted at rest and in transit
  - Access Method: Photos accessed only through time-limited signed URLs (1 hour expiration)

## 4. How long will face data be retained?

- **Photos**: Automatically deleted from our servers after **90 days** from upload date
- **Analysis Results**: Retained as long as the user's account is active, unless manually deleted by the user
- **User Control**: Users can manually delete individual photos and analyses at any time
- **Account Deletion**: When a user deletes their account, all associated photos, analyses, and data are permanently deleted (CASCADE delete)

## 5. Where in the privacy policy is face data explained? Identify specific sections.

**Privacy Policy URL**: https://www.black-pill.app/privacy

**Relevant Sections:**
- **Section 2: Information We Collect** - Lists "Photos you upload for analysis"
- **Section 3: How We Use Your Information** - States "Process your photo analysis"
- **Section 4: Face Data Policy** - Dedicated section specifically addressing face data

## 6. Quote the specific text from the privacy policy concerning face data.

**Section 4: Face Data Policy** (exact quote):

> "We take the privacy of your biometric data seriously. Photos uploaded for analysis are processed securely and are automatically deleted from our servers after 90 days. We do not use your photos for facial recognition training or share them with third parties without your explicit consent."

**Section 2: Information We Collect**:
> "We collect information that you provide directly to us, including:
> - Photos you upload for analysis
> - Account information (email address, username)
> - Usage data and preferences"

**Section 3: How We Use Your Information**:
> "We use the information we collect to:
> - Provide, maintain, and improve our services
> - Process your photo analysis
> - Send you technical notices and support messages
> - Respond to your comments and questions"

---

## Additional Compliance Information

- All photos stored in private Supabase Storage bucket (not publicly accessible)
- Database access requires authentication via Supabase JWT tokens
- Row Level Security (RLS) policies ensure users can only access their own data
- All API communications use HTTPS/TLS encryption
- No facial recognition or biometric template creation occurs
- Data is not used for advertising or marketing purposes
- Users have full control to delete their data at any time

