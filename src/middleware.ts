import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createIntlMiddleware(routing);

// Routes outside the [locale] segment — internal portals and API routes —
// are English-only and must never be run through locale detection/redirect,
// or a non-English Accept-Language header could bounce a staff/student
// login into a "/ur/admin" URL that doesn't exist.
const PORTAL_PREFIXES = ["/admin", "/api", "/dashboard", "/teacher", "/parent"];

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  // React's dev-mode debugging features (stack-trace reconstruction, Fast
  // Refresh) call eval(). It never does in production, so only relax the
  // policy for local development — the deployed site stays fully strict.
  const isDev = process.env.NODE_ENV === "development";

  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    font-src 'self';
    connect-src 'self';
    frame-src https://www.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const pathname = request.nextUrl.pathname;
  const isPortalRoute = PORTAL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const response = isPortalRoute
    ? NextResponse.next({ request: { headers: requestHeaders } })
    : handleI18nRouting(request);

  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    // Skip static assets, image-optimizer requests, and any request whose
    // last path segment has a file extension (covers everything under
    // public/ — logos, fonts, icons, sitemap.xml, robots.txt, ... — plus
    // metadata routes like favicon.ico/icon.png). Without this, next-intl's
    // routing middleware treats those paths as page routes and rewrites
    // them to a locale-prefixed URL that doesn't exist, 404ing the asset.
    "/((?!_next/static|_next/image|.*\\..*).*)",
  ],
};
