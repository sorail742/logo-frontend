"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useWorkspace } from "@/hooks/use-workspace";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";

export default function TrashPage() {
  const t = useTranslations();
  const format = useFormatter();
  const { workspace, can } = useWorkspace();
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const filters = { trash: true };
  const { data } = useQuery({
    queryKey: qk.projects(workspace?.id ?? "none", filters),
    queryFn: () => api.projects.list(workspace!.id, filters),
    enabled: Boolean(workspace) && can("trash.view"),
  });
  const restore = useMutation({
    mutationFn: api.projects.restore,
    onSuccess: () => {
      toast.success(t("app.trash.restored"));
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspace?.id, "projects"] });
    },
    onError,
  });

  return (
    <>
      <PageHeader title={t("app.trash.title")} description={t("app.trash.description")} />
      {workspace && !can("trash.view") ? (
        <EmptyState icon={Trash2} title={t("app.trash.ownerOnly")} />
      ) : data?.length === 0 ? (
        <EmptyState icon={Trash2} title={t("app.trash.empty")} />
      ) : (
        <div className="grid gap-3">
          {data?.map((project) => (
            <div
              key={project.id}
              className="glow-card bg-card hover:border-primary/40 flex items-center justify-between gap-4 rounded-2xl border p-4 shadow-2xs transition"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="bg-destructive/10 text-destructive flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <Trash2 className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{project.chosenName?.value ?? project.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {t("app.trash.deletedOn", {
                      date: format.dateTime(new Date(project.deletedAt!), { dateStyle: "medium" }),
                    })}
                  </p>
                </div>
              </div>
              {can("project.delete") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => restore.mutate(project.id)}
                  disabled={restore.isPending}
                  className="shrink-0 gap-1.5"
                >
                  <RotateCcw className="size-4" />
                  {t("common.actions.restore")}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
