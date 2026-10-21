"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/components/layout/app-shell";
import { StudioEditor } from "@/components/studio/editor";

export default function StudioPage() {
  const { sdid } = useParams<{ sdid: string }>();
  const status = useRequireAuth();
  if (status !== "authenticated") {
    return (
      <div className="flex min-h-svh items-center justify-center" role="status">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }
  return <StudioEditor sdid={sdid} />;
}
