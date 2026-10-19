import { Suspense } from "react";
import type { Metadata } from "next";
import { PublicKit } from "@/components/kit/public-kit";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PublicKitPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Suspense>
        <PublicKit />
      </Suspense>
    </div>
  );
}
