import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { env } from "~/env";

// Fonction de validation sécurisée pour les User-Agents
function isValidMobileUserAgent(userAgent: string): boolean {
  // Patterns plus stricts et moins falsifiables
  const mobilePatterns = [
    /Android\s+[\d.]+/i, // Android avec version
    /iPhone\s+OS\s+[\d_]+/i, // iOS avec version
    /iPad.*OS\s+[\d_]+/i, // iPad avec version
    /Windows\s+Phone\s+[\d.]+/i, // Windows Phone avec version
    /BlackBerry\s+[\d.]+/i, // BlackBerry avec version
    /webOS\s+[\d.]+/i, // webOS avec version
  ];

  return mobilePatterns.some((pattern) => pattern.test(userAgent));
}

// Fonction de validation des redirections
function isValidRedirectUrl(url: string, baseUrl: string): boolean {
  try {
    const redirectUrl = new URL(url, baseUrl);
    const base = new URL(baseUrl);

    // Vérifier que c'est le même domaine
    return (
      redirectUrl.hostname === base.hostname &&
      redirectUrl.protocol === base.protocol
    );
  } catch {
    return false;
  }
}

// Middleware principal sécurisé
export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;

    // === SÉCURITÉ : Validation d'origine pour les routes API ===
    if (
      pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/auth")
    ) {
      const origin = req.headers.get("origin");
      const referer = req.headers.get("referer");
      const host = req.headers.get("host");

      // En dev, autoriser localhost
      if (env.NODE_ENV === "development") {
        if (
          !origin?.includes("localhost") &&
          !referer?.includes("localhost") &&
          !host?.includes("localhost") &&
          (origin || referer)
        ) {
          return NextResponse.json(
            { error: "Origine non autorisée" },
            { status: 403 },
          );
        }
      } else {
        // En production, vérifier l'origine
        const allowedHost = env.NEXTAUTH_URL
          ? new URL(env.NEXTAUTH_URL).hostname
          : null;
        if (allowedHost) {
          const isValid =
            (origin && origin.includes(allowedHost)) ||
            (referer && referer.includes(allowedHost)) ||
            (host && host.includes(allowedHost));

          if (!isValid && (origin || referer)) {
            return NextResponse.json(
              { error: "Origine non autorisée" },
              { status: 403 },
            );
          }
        }
      }
    }

    // === SÉCURITÉ : Validation des routes publiques ===
    const publicRoutes = [
      "/mobile",
      "/api/auth",
      "/api/static",
      "/api/manifest",
    ];

    // Vérifier si c'est une route publique
    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(route),
    );

    // === SÉCURITÉ : Page mobile uniquement pour les vrais mobiles ===
    if (pathname === "/mobile") {
      // Vérification supplémentaire : s'assurer que c'est vraiment un mobile
      const userAgent = req.headers.get("user-agent") || "";
      const isMobile = isValidMobileUserAgent(userAgent);

      if (!isMobile) {
        // Si ce n'est pas un mobile, rediriger vers l'accueil
        return NextResponse.redirect(new URL("/", req.url));
      }

      return NextResponse.next();
    }

    // === SÉCURITÉ : Détection mobile avec validation stricte ===
    const userAgent = req.headers.get("user-agent") || "";
    const isMobile = isValidMobileUserAgent(userAgent);

    // Rediriger vers la page mobile si détecté (sauf pour les routes publiques et API)
    if (isMobile && !isPublicRoute && !pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/mobile", req.url));
    }

    // === SÉCURITÉ : Validation des redirections ===
    if (
      pathname === "/" &&
      req.nextauth.token &&
      !pathname.startsWith("/api/")
    ) {
      const redirectUrl = new URL("/home", req.url);
      if (isValidRedirectUrl(redirectUrl.toString(), req.url)) {
        return NextResponse.redirect(redirectUrl);
      }
    }

    if (
      pathname === "/" &&
      !req.nextauth.token &&
      !pathname.startsWith("/api/")
    ) {
      const redirectUrl = new URL("/auth", req.url);
      if (isValidRedirectUrl(redirectUrl.toString(), req.url)) {
        return NextResponse.redirect(redirectUrl);
      }
    }

    // === Nouveau utilisateur : rester sur /home (version locale, pas de billing) ===
    if (pathname === "/home" && req.nextauth.token) {
      return NextResponse.next();
    }

    // === SÉCURITÉ : Contrôle d'accès support ===
    if (pathname.startsWith("/support")) {
      const role = req.nextauth.token?.role;
      if (role !== "support" && role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // === SÉCURITÉ : Headers de sécurité ===
    const response = NextResponse.next();

    // Headers de sécurité de base
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Headers de sécurité avancés (OWASP)
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    );
    response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

    // Content Security Policy (CSP) - Version permissive pour commencer
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
        "style-src 'self' 'unsafe-inline' https:; " +
        "img-src 'self' data: https: blob:; " +
        "font-src 'self' data: https:; " +
        "connect-src 'self' ws://localhost:3001 ws://localhost:3000 https: wss:; " +
        "frame-src 'self' https:; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'; " +
        "frame-ancestors 'none'; " +
        "upgrade-insecure-requests;",
    );

    // Headers de cache sécurisés
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // === SÉCURITÉ : Vérification stricte de l'autorisation ===
        const { pathname } = req.nextUrl;

        // Routes publiques autorisées
        const publicRoutes = [
          "/mobile",
          "/api/auth",
          "/api/static",
          "/api/manifest",
        ];

        if (
          publicRoutes.some(
            (route) => pathname === route || pathname.startsWith(route),
          )
        ) {
          return true;
        }

        // Toutes les autres routes nécessitent une authentification
        return !!token;
      },
    },
    pages: {
      signIn: "/auth",
      signOut: "/auth",
      error: "/auth/error",
      newUser: "/home",
    },
  },
);

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|manifest.json|icons/|styles/|public/|api/|LogoClara_light.webp|LogoClara_Dark.webp|LogoClaraAICercle.svg|LogoCai.png|Banner|StoreBanner).*)",
  ],
};
