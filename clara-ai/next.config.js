/**
 * Charger le .env à la racine du dépôt (un seul fichier partagé Clara + Archibald).
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation (Docker).
 */
import path from "path";
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: path.resolve(process.cwd(), "..", ".env") });

await import("./src/env.js");

// Bundle analyzer
const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? (await import("@next/bundle-analyzer")).default({ enabled: true })
    : (/** @type {any} */ config) => config;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Désactiver les SourceMaps en développement
  productionBrowserSourceMaps: false,

  // Optimisations de performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["lucide-react"],
    // Désactiver la collecte de données pour les routes API
    serverComponentsExternalPackages: ["minio"],
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },

  // Optimisation des images
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Configuration pour les images locales
    unoptimized: false,
    loader: "default",
    // Autoriser les images locales
    domains: [],
    remotePatterns: [],
  },

  // Optimisation du bundle
  webpack: (config, { dev, isServer }) => {
    // Optimisation pour la production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    // Optimisation des SVG
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },

  // Optimisation des headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Exclure les routes API problématiques du build statique
  async rewrites() {
    return [
      {
        source: "/api/cron/cleanup",
        destination: "/api/cron/cleanup",
        has: [
          {
            type: "header",
            key: "authorization",
          },
        ],
      },
      // Rediriger les fichiers statiques vers nos API routes
      {
        source: "/_next/static/:path*",
        destination: "/api/static/:path*",
      },
      // Rediriger le manifest.json vers notre API route
      {
        source: "/manifest.json",
        destination: "/api/manifest",
      },
    ];
  },

  // Configuration pour servir les fichiers statiques
  async redirects() {
    return [
      {
        source: "/auth/login",
        destination: "/auth?tab=login",
        permanent: true,
      },
      {
        source: "/auth/register",
        destination: "/auth?tab=register",
        permanent: true,
      },
    ];
  },

  // Optimisation du cache
  // Pas de réécritures spécifiques requises

  // Optimisation du build
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: false,

  // ESLint et TypeScript activés pour la qualité du code
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  // Désactiver les avertissements de hooks en développement
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default withBundleAnalyzer(nextConfig);
