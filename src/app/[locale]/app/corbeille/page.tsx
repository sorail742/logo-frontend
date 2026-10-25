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
        <ul className="divide-y rounded-xl border">
          {data?.map((project) => (
            <li key={project.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{project.chosenName?.value ?? project.title}</p>
                <p className="text-xs text-muted-foreground">
                  {t("app.trash.deletedOn", { date: format.dateTime(new Date(project.deletedAt!), { dateStyle: "medium" }) })}
                </p>
              </div>
              {can("project.delete") && (
                <Button variant="outline" onClick={() => restore.mutate(project.id)} disabled={restore.isPending}>
                  <RotateCcw />
                  {t("common.actions.restore")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
