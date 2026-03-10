////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import "~/styles/globals.css";
import { TRPCReactProvider } from "~/trpc/react";
import ClientProviders from "~/components/ClientProviders";
import MobileDetector from "~/components/MobileDetector";
import type { Metadata, Viewport } from "next";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface RootLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title:
    "Clara AI - Plateforme IA Professionnelle | Assistant IA Conversationnel",
  description:
    "Clara AI : Plateforme d'intelligence artificielle. Interface conversationnelle avancée pour entreprises et particuliers.",
  keywords: [
    "intelligence artificielle",
    "assistant IA",
    "chatbot professionnel",
    "RAG",
    "modèles de langage",
    "GPT",
    "Claude",
    "Mistral",
    "plateforme IA",
    "agent conversationnel",
    "productivité",
    "créativité",
    "entreprise",
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
    url:
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    title: "Clara AI - Plateforme IA Professionnelle",
    description:
      "Plateforme d'IA conversationnelle avec RAG, modèles personnalisés et agents spécialisés pour professionnels.",
    siteName: "Clara AI",
    images: [
      {
        url: "/LogoClaraAICercle.svg",
        width: 1200,
        height: 630,
        alt: "Logo Clara AI - Intelligence Artificielle",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clara AI - Plateforme IA Professionnelle",
    description:
      "Plateforme d'IA conversationnelle avec RAG, modèles personnalisés et agents spécialisés.",
    images: ["/LogoClaraAICercle.svg"],
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/favicon-180-precomposed.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/icons/favicon.ico",
  },
  manifest: "/manifest.json",
  other: {
    "msapplication-TileColor": "#667eea",
    "msapplication-config": "/browserconfig.xml",
    referrer: "strict-origin-when-cross-origin",
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#667eea",
};
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
export default function RootLayout({ children }: RootLayoutProps) {
  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Sitemap et robots - Next.js ne gère pas ces balises automatiquement */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />

        {/* Le CSS global est déjà importé en module, pas de preload direct sur /styles/globals.css */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Script de thème optimisé */}
        <script
          id="theme-script"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem("theme");
                  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  const initialTheme = savedTheme || (systemDark ? "dark" : "light");
                  document.documentElement.setAttribute("data-theme", initialTheme);
                } catch (e) {
                  // Fallback en cas d'erreur
                  document.documentElement.setAttribute("data-theme", "light");
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <TRPCReactProvider>
          <ClientProviders>
            <MobileDetector>{children}</MobileDetector>
          </ClientProviders>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
