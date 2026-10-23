import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Textile", robots: { index: false, follow: false } };

// Éditeur client plein écran (session, tenue) : rendu à la demande, sous Suspense.
export default function ApparelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="bg-muted flex min-h-svh items-center justify-center" role="status" aria-busy="true" />
      }
    >
      {children}
    </Suspense>
  );
}
