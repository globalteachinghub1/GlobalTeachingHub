import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // pdfkit loads its font metrics relative to __dirname at runtime; bundling
  // it rewrites that path and breaks asset resolution, so keep it external.
  serverExternalPackages: ["pdfkit"],
  // Tailwind output is small (~19 KiB gzipped), so inline it into <head> to
  // remove the render-blocking stylesheet request flagged by Lighthouse.
  // Next always ships a small polyfill block (Array.prototype.at/flat,
  // Object.hasOwn, ...) in the client runtime, which Lighthouse flags as
  // "Legacy JavaScript". Every browser Next supports has these natively, so
  // swap it for an empty module in browser bundles. Revisit on Next upgrades:
  // if the import path in next/dist/client/app-globals.js changes, this
  // alias silently stops matching (harmless — the polyfills just come back).
  turbopack: {
    resolveAlias: {
      "../build/polyfills/polyfill-module": { browser: "./src/lib/polyfills/empty.js" },
    },
  },
  experimental: {
    inlineCss: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Private portals must never appear in search results. robots.txt
      // already blocks crawling them, but a disallowed URL can still be
      // indexed from inbound links; this header covers that case too.
      ...["/admin", "/dashboard", "/teacher", "/parent"].flatMap((prefix) => [
        { source: prefix, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
        {
          source: `${prefix}/:path*`,
          headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
        },
      ]),
    ];
  },
};

export default withNextIntl(nextConfig);
