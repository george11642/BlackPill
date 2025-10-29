import Head from 'next/head';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  keywords?: string;
  author?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterHandle?: string;
  structuredData?: Record<string, any>;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage = 'https://black-pill.app/og-image.png',
  ogType = 'website',
  keywords,
  author = 'BlackPill',
  twitterCard = 'summary_large_image',
  twitterHandle = '@blackpillapp',
  structuredData,
}) => {
  const siteUrl = 'https://black-pill.app';
  const canonicalUrl = canonical || siteUrl;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title} | BlackPill</title>
      <meta name="title" content={`${title} | BlackPill`} />
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="charset" content="utf-8" />
      <meta name="language" content="English" />
      <meta name="author" content={author} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="BlackPill" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={ogTitle || title} />
      <meta property="twitter:description" content={ogDescription || description} />
      <meta property="twitter:image" content={ogImage} />
      {twitterHandle && <meta property="twitter:creator" content={twitterHandle} />}

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="theme-color" content="#0F0F1E" />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
    </Head>
  );
};
