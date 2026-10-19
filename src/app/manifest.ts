import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Marka — Identité de marque",
    short_name: "Marka",
    description: "Nom, logo et signatures pour votre structure.",
    start_url: "/app",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f6b5c",
    lang: "fr",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
