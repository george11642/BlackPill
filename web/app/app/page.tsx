import { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'BlackPill Web App - Try in Browser',
  description: 'Try BlackPill in your browser - AI-powered attractiveness analysis',
};

export default function ExpoWebAppPage() {
  return (
    <>
      <div id="root" style={{ minHeight: '100vh', backgroundColor: '#0F0F1E' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '1rem',
          color: '#fff'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Loading BlackPill Web App...</h1>
          <p style={{ color: '#B8BACC' }}>If this page doesn't load, make sure to run the build script first.</p>
        </div>
      </div>
      {/* Expo web app scripts will be injected here by the build process */}
      <Script src="/app/_expo/static/js/web/index.js" strategy="lazyOnload" />
    </>
  );
}
