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
      <output className="flex min-h-svh items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </output>
    );
  }
  return <StudioEditor sdid={sdid} />;
}
