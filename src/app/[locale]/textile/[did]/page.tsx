"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/components/layout/app-shell";
import { ApparelEditor } from "@/components/apparel/editor";

export default function ApparelEditorPage() {
  const { did } = useParams<{ did: string }>();
  const status = useRequireAuth();
  if (status !== "authenticated") {
    return (
      <output className="flex min-h-svh items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </output>
    );
  }
  return <ApparelEditor did={did} />;
}
