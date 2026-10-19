import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const PUBLIC_PATHS = ["", "/tarifs", "/outils/generateur-de-noms", "/outils/signature-email", "/legal/cgu", "/legal/confidentialite"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path || "/"}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
    alternates: { languages: { fr: `${SITE_URL}${path || "/"}`, en: `${SITE_URL}/en${path}` } },
  }));
}
