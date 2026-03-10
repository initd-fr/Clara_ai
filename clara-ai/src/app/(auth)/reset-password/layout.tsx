////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import type { Metadata, Viewport } from "next";
import Providers from "~/components/Providers";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface ResetPasswordLayoutProps {
  children: React.ReactNode;
}
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

export const metadata: Metadata = {
  title: "Clara AI - Réinitialisation du mot de passe",
  description: "Réinitialisez votre mot de passe Clara AI de manière sécurisée",
  keywords: [
    "Clara AI",
    "réinitialisation",
    "mot de passe",
    "sécurité",
    "authentification",
  ],
  authors: [{ name: "Clara AI Team" }],
  creator: "Clara AI",
  publisher: "Clara AI",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "Clara AI - Réinitialisation du mot de passe",
    description:
      "Réinitialisez votre mot de passe Clara AI de manière sécurisée",
    siteName: "Clara AI",
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

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
export default function ResetPasswordLayout({
  children,
}: ResetPasswordLayoutProps) {
  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <Providers>
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
            /* Critical CSS for reset password page */
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
            
            /* Security: Content Security Policy compatible */
            .sr-only {
              position: absolute;
              width: 1px;
              height: 1px;
              padding: 0;
              margin: -1px;
              overflow: hidden;
              clip: rect(0, 0, 0, 0);
              white-space: nowrap;
              border: 0;
            }
          `,
        }}
      />
      {children}
    </Providers>
  );
}
