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
import { canAdmin, outranks } from "@/lib/permissions";
import type { CreditRequest } from "@/lib/types";
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
  const actorId = useSessionStore((s) => s.user?.id);
  // Suspension et 2FA : admin, sur un rang inférieur. Crédits : l'admin applique, le support propose.
  const canManage = canAdmin("users.manage", role);
  const canAdjust = canAdmin("credits.adjust", role);
  const canRequest = canAdmin("credits.request", role);

  const { data: users = [] } = useQuery({ queryKey: qk.admin("users", query), queryFn: () => api.admin.users(query) });
  const update = useMutation({
    mutationFn: ({ uid, patch }: { uid: string; patch: { suspended?: boolean; reset2fa?: boolean } }) => api.admin.updateUser(uid, patch),
    onSuccess: () => {
      toast.success(t("updated"));
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError,
  });
  const { data: requests = [] } = useQuery({ queryKey: qk.admin("credit-requests"), queryFn: () => api.admin.creditRequests(), enabled: canRequest });
  const refreshRequests = () => queryClient.invalidateQueries({ queryKey: qk.admin("credit-requests") });
  const adjust = useMutation({
    mutationFn: () => {
      const input = { workspaceId: workspaceId.trim(), delta: Number(delta), reason };
      return canAdjust ? api.admin.adjustCredits(input) : api.admin.requestCredits(input).then(() => undefined);
    },
    onSuccess: () => {
      toast.success(canAdjust ? t("adjusted") : t("requested"));
      setDelta("");
      setReason("");
      refreshRequests();
    },
    onError,
  });
  const decide = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => api.admin.decideCreditRequest(id, approve),
    onSuccess: (request: CreditRequest) => {
      toast.success(request.status === "APPROVED" ? t("approved") : t("rejected"));
      refreshRequests();
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
                  {canManage && user.id !== actorId && outranks(role, user.role) && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => update.mutate({ uid: user.id, patch: { suspended: !user.suspendedAt } })}>
                        {user.suspendedAt ? t("reactivate") : t("suspend")}
                      </Button>
                      {user.totpEnabled && (
                        <Button variant="ghost" size="sm" onClick={() => update.mutate({ uid: user.id, patch: { reset2fa: true } })}>
                          {t("reset2fa")}
                        </Button>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {canRequest && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="text-sm">{canAdjust ? t("credits") : t("requestCredits")}</CardTitle>
            {!canAdjust && <p className="text-xs text-muted-foreground">{t("requestHelp")}</p>}
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
              <Button type="submit" disabled={!workspaceId.trim() || !Number(delta) || reason.trim().length < 5 || adjust.isPending}>
                {canAdjust ? t("adjust") : t("request")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {canRequest && requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("requests")}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("workspace")}</TableHead>
                  <TableHead>{t("delta")}</TableHead>
                  <TableHead>{t("reason")}</TableHead>
                  <TableHead>{t("requestedBy")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.workspaceName}</TableCell>
                    <TableCell className="tabular-nums">{request.delta > 0 ? `+${request.delta}` : request.delta}</TableCell>
                    <TableCell className="max-w-64 truncate" title={request.reason}>
                      {request.reason}
                    </TableCell>
                    <TableCell>
                      {request.requestedBy}
                      <span className="block text-xs text-muted-foreground">{format.dateTime(new Date(request.createdAt), { dateStyle: "medium" })}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={request.status === "PENDING" ? "outline" : request.status === "APPROVED" ? "secondary" : "destructive"}>{t(`requestStatus.${request.status}`)}</Badge>
                      {request.decidedBy && <span className="block text-xs text-muted-foreground">{request.decidedBy}</span>}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {canAdjust && request.status === "PENDING" && (
                        <>
                          <Button size="sm" onClick={() => decide.mutate({ id: request.id, approve: true })} disabled={decide.isPending}>
                            {t("approve")}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => decide.mutate({ id: request.id, approve: false })} disabled={decide.isPending}>
                            {t("reject")}
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
