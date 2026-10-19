"use client";

import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field } from "@/components/common/field";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api } from "@/lib/api";
import { canAccessAdmin } from "@/lib/permissions";
import { qk } from "@/lib/query-keys";
import { useSessionStore } from "@/stores/session";

export default function AdminUsersPage() {
  const t = useTranslations("admin.users");
  const tr = useTranslations("common.roles");
  const format = useFormatter();
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const role = useSessionStore((s) => s.user?.role);
  const [q, setQ] = useState("");
  const query = useDeferredValue(q);
  const [workspaceId, setWorkspaceId] = useState("");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const isAdmin = canAccessAdmin(role, "library"); // Admin ou Super admin

  const { data: users = [] } = useQuery({ queryKey: qk.admin("users", query), queryFn: () => api.admin.users(query) });
  const update = useMutation({
    mutationFn: ({ uid, patch }: { uid: string; patch: { suspended?: boolean; reset2fa?: boolean } }) => api.admin.updateUser(uid, patch),
    onSuccess: () => {
      toast.success(t("updated"));
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError,
  });
  const adjust = useMutation({
    mutationFn: () => api.admin.adjustCredits({ workspaceId: workspaceId.trim(), delta: Number(delta), reason }),
    onSuccess: () => {
      toast.success(t("adjusted"));
      setDelta("");
      setReason("");
    },
    onError,
  });

  return (
    <div className="grid gap-6">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="max-w-sm" />
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("created")}</TableHead>
              <TableHead>{t("twoFactor")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </TableCell>
                <TableCell>{tr(user.role)}</TableCell>
                <TableCell>{format.dateTime(new Date(user.createdAt), { dateStyle: "medium" })}</TableCell>
                <TableCell>{user.totpEnabled ? "✓" : "—"}</TableCell>
                <TableCell>
                  <Badge variant={user.suspendedAt ? "destructive" : "secondary"}>{user.suspendedAt ? t("suspended") : t("active")}</Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="sm" onClick={() => update.mutate({ uid: user.id, patch: { suspended: !user.suspendedAt } })}>
                    {user.suspendedAt ? t("reactivate") : t("suspend")}
                  </Button>
                  {user.totpEnabled && (
                    <Button variant="ghost" size="sm" onClick={() => update.mutate({ uid: user.id, patch: { reset2fa: true } })}>
                      {t("reset2fa")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isAdmin && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="text-sm">{t("credits")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                adjust.mutate();
              }}
            >
              <Field label={t("workspaceId")} htmlFor="adj-ws">
                <Input id="adj-ws" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} placeholder="w_demo" />
              </Field>
              <Field label={t("delta")} htmlFor="adj-delta">
                <Input id="adj-delta" type="number" value={delta} onChange={(e) => setDelta(e.target.value)} />
              </Field>
              <Field label={t("reason")} htmlFor="adj-reason">
                <Input id="adj-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
              <Button type="submit" disabled={!workspaceId.trim() || !Number(delta) || !reason.trim() || adjust.isPending}>
                {t("adjust")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
