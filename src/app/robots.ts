import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/app", "/admin", "/en/app", "/en/admin", "/kit/", "/invitation/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
