import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Textile", robots: { index: false, follow: false } };

// Éditeur client plein écran (session, tenue) : rendu à la demande, sous Suspense.
export default function ApparelLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Suspense
      fallback={
        <output className="bg-muted flex min-h-svh items-center justify-center" aria-busy="true" />
      }
    >
      {children}
    </Suspense>
  );
}
