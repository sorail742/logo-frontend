import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Studio", robots: { index: false, follow: false } };

// Éditeur client plein écran (session, document) : rendu à la demande, sous Suspense.
// La langue est déjà fixée par la mise en page [locale].
export default function StudioLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="flex min-h-svh items-center justify-center bg-muted" role="status" aria-busy="true" />}>{children}</Suspense>;
}
