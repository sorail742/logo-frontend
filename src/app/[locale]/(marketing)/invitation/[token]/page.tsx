import { Suspense } from "react";
import type { Metadata } from "next";
import { AcceptInvitation } from "@/components/auth/accept-invitation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function InvitationPage() {
  return (
    <div className="flex justify-center px-4 py-16">
      <Suspense>
        <AcceptInvitation />
      </Suspense>
    </div>
  );
}
