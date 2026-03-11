////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import type { Metadata, Viewport } from "next";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface AuthLayoutProps {
  children: React.ReactNode;
}
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////CONSTANTS///////////////////////////////////////////////////////////////////////////////////////
export const metadata: Metadata = {
  title: "Clara AI - Connexion",
  description:
    "Connectez-vous à Clara AI pour accéder à l&apos;intelligence artificielle avancée",
  keywords: [
    "Clara AI",
    "IA",
    "intelligence artificielle",
    "connexion",
    "authentification",
  ],
  authors: [{ name: "Clara AI Team" }],
  creator: "Clara AI",
  publisher: "Clara AI",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/auth",
    title: "Clara AI - Connexion",
    description:
      "Connectez-vous à Clara AI pour accéder à l&apos;intelligence artificielle avancée",
    siteName: "Clara AI",
    images: [
      {
        url: "/img/BannerLight.png",
        width: 1200,
        height: 630,
        alt: "Clara AI - Intelligence Artificielle",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clara AI - Connexion",
    description:
      "Connectez-vous à Clara AI pour accéder à l&apos;intelligence artificielle avancée",
    images: ["/img/BannerLight.png"],
  },
  icons: {
    icon: "/favicon/favicon-96.png",
    apple: "/favicon/favicon-180.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};
////////////////////////////////////////////////////////////////////////////////CONSTANTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
export default function AuthLayout({ children }: AuthLayoutProps) {
  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <>
      {/* DNS prefetch for external domains */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />

      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />

      {/* Critical CSS inline */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS for auth page */
            .logo-gradient-wa {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            
            /* Prevent layout shift */
            .animate-pulse {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: .5; }
            }
            
            /* Optimize loading states */
            .loading {
              display: inline-block;
              width: 1rem;
              height: 1rem;
              border: 2px solid currentColor;
              border-radius: 50%;
              border-top-color: transparent;
              animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            
            /* Security: Prevent clickjacking */
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            /* Performance: Optimize animations */
            * {
              box-sizing: border-box;
            }
            
            /* Accessibility: Focus management */
            :focus {
              outline: 2px solid #667eea;
              outline-offset: 2px;
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              body {
                background-color: #000000;
                color: #ffffff;
              }
            }
            
            /* Fix logo sizing issues on different browsers */
            .auth-logo-container {
              max-width: 100% !important;
              max-height: 100% !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
            }
            
            .auth-logo-image {
              max-width: 100% !important;
              max-height: 100% !important;
              width: auto !important;
              height: auto !important;
              object-fit: contain !important;
              object-position: center !important;
            }
            
            /* Fallback for older browsers */
            @supports not (object-fit: contain) {
              .auth-logo-image {
                width: 100% !important;
                height: 100% !important;
              }
            }
            
            /* Specific fixes for WebKit browsers (Safari, Chrome) */
            @supports (-webkit-appearance: none) {
              .auth-logo-container {
                -webkit-box-sizing: border-box !important;
              }
              
              .auth-logo-image {
                -webkit-max-width: 100% !important;
                -webkit-max-height: 100% !important;
              }
            }
            
            /* Specific fixes for Firefox */
            @supports (-moz-appearance: none) {
              .auth-logo-container {
                -moz-box-sizing: border-box !important;
              }
            }
            
            /* Specific fixes for Edge/IE */
            @supports (-ms-ime-align: auto) {
              .auth-logo-container {
                -ms-box-sizing: border-box !important;
              }
            }
          `,
        }}
      />
      {children}
    </>
  );
}
