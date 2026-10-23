import { Suspense } from "react";
import type { Metadata } from "next";
import { PublicProof } from "@/components/apparel/public-proof";

export const metadata: Metadata = { title: "BAT", robots: { index: false, follow: false } };

export default function PublicProofPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Suspense>
        <PublicProof />
      </Suspense>
    </div>
  );
}
