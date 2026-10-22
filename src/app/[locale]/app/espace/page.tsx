"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { DoorOpen, Link2, Mail, Trash2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/common/field";
import { NativeSelect } from "@/components/common/native-select";
import { PageHeader } from "@/components/common/page-header";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useWorkspace } from "@/hooks/use-workspace";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { WorkspaceRole } from "@/lib/types";
import { useSessionStore } from "@/stores/session";

function WorkspaceContent() {
  const t = useTranslations("app.workspace");
  const tr = useTranslations("common.roles");
  const format = useFormatter();
  const queryClient = useQueryClient();
  const onError = useApiErrorToast();
  const searchParams = useSearchParams();
  const user = useSessionStore((s) => s.user);
  const setWorkspace = useSessionStore((s) => s.setWorkspace);
  const { workspace, can } = useWorkspace();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("EDITOR");
  const [newName, setNewName] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const wid = workspace?.id ?? "none";
  const isOwner = can("members.manage");
  const isOrganization = workspace?.kind === "ORGANIZATION";

  const { data: members = [] } = useQuery({ queryKey: qk.members(wid), queryFn: () => api.workspaces.members(wid), enabled: Boolean(workspace) });
  const { data: invitations = [] } = useQuery({ queryKey: qk.invitations(wid), queryFn: () => api.workspaces.invitations(wid), enabled: Boolean(workspace) && isOwner });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: qk.members(wid) });
    queryClient.invalidateQueries({ queryKey: qk.invitations(wid) });
  };

  const invite = useMutation({
    mutationFn: (asLink: boolean) => api.workspaces.invite(wid, { email: asLink ? undefined : email, role, asLink }),
    onSuccess: async (invitation, asLink) => {
      if (asLink && invitation.link) {
        await navigator.clipboard.writeText(`${window.location.origin}${invitation.link}`).catch(() => undefined);
        toast.success(t("linkCreated"));
      } else {
        toast.success(t("invited"));
        setEmail("");
      }
      refresh();
    },
    onError,
  });
  const changeRole = useMutation({
    mutationFn: ({ uid, role }: { uid: string; role: WorkspaceRole }) => api.workspaces.updateMember(wid, uid, role),
    onSuccess: () => {
      toast.success(t("roleUpdated"));
      refresh();
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (uid: string) => api.workspaces.removeMember(wid, uid),
    onSuccess: () => {
      toast.success(t("removed"));
      refresh();
    },
    onError,
  });
  // Réglages du propriétaire, départ volontaire et suppression (§3).
  const afterLeaving = () => {
    queryClient.invalidateQueries({ queryKey: qk.workspaces });
    const personal = queryClient.getQueryData<{ id: string; kind: string }[]>(qk.workspaces)?.find((w) => w.kind === "PERSONAL");
    if (personal) setWorkspace(personal.id);
  };
  const settings = useMutation({
    mutationFn: (viewerDownloads: boolean) => api.workspaces.update(wid, { viewerDownloads }),
    onSuccess: () => {
      toast.success(t("settingsSaved"));
      queryClient.invalidateQueries({ queryKey: qk.workspaces });
    },
    onError,
  });
  const leave = useMutation({
    mutationFn: () => api.workspaces.removeMember(wid, user!.id),
    onSuccess: () => {
      toast.success(t("left"));
      afterLeaving();
    },
    onError,
  });
  const destroy = useMutation({
    mutationFn: () => api.workspaces.remove(wid, confirmName),
    onSuccess: () => {
      toast.success(t("deleted"));
      setConfirmName("");
      afterLeaving();
    },
    onError,
  });
  const owners = members.filter((m) => m.role === "OWNER").length;
  const soleOwner = isOwner && owners <= 1;

  const create = useMutation({
    mutationFn: () => api.workspaces.create({ name: newName.trim() }),
    onSuccess: (created) => {
      toast.success(t("created"));
      setNewName("");
      queryClient.invalidateQueries({ queryKey: qk.workspaces });
      setWorkspace(created.id);
    },
    onError,
  });

  return (
    <>
      <PageHeader
        title={workspace?.name ?? t("title")}
        description={workspace ? t(`kind.${workspace.kind}`) : undefined}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("members")}</CardTitle>
              {!isOwner && <CardDescription>{t("ownerOnly")}</CardDescription>}
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {members.map((member) => (
                  <li key={member.userId} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-medium">{member.fullName.slice(0, 1)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {member.fullName}
                        {member.userId === user?.id && <span className="text-muted-foreground"> ({t("you")})</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    {isOwner && member.userId !== user?.id ? (
                      <>
                        <NativeSelect
                          className="w-36"
                          value={member.role}
                          onChange={(e) => changeRole.mutate({ uid: member.userId, role: e.target.value as WorkspaceRole })}
                          aria-label={t("inviteRole")}
                        >
                          {(["OWNER", "EDITOR", "VIEWER"] as const).map((r) => (
                            <option key={r} value={r}>
                              {tr(r)}
                            </option>
                          ))}
                        </NativeSelect>
                        <Button variant="ghost" size="icon" onClick={() => remove.mutate(member.userId)} aria-label={t("remove")}>
                          <UserMinus />
                        </Button>
                      </>
                    ) : (
                      <Badge variant="secondary">{tr(member.role)}</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          {isOwner && invitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("pending")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm">
                  {invitations.map((invitation) => (
                    <li key={invitation.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{invitation.email || t("linkInvitation")}</span>
                      <span className="text-xs text-muted-foreground">
                        {tr(invitation.role)} · {t("expires", { date: format.dateTime(new Date(invitation.expiresAt), { dateStyle: "medium" }) })}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid content-start gap-6">
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("invite")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Field label={t("inviteEmail")} htmlFor="invite-email">
                  <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label={t("inviteRole")} htmlFor="invite-role">
                  <NativeSelect id="invite-role" value={role} onChange={(e) => setRole(e.target.value as WorkspaceRole)}>
                    <option value="EDITOR">{tr("EDITOR")}</option>
                    <option value="VIEWER">{tr("VIEWER")}</option>
                  </NativeSelect>
                </Field>
                <Button onClick={() => invite.mutate(false)} disabled={!/^\S+@\S+\.\S+$/.test(email) || invite.isPending}>
                  <Mail />
                  {t("inviteByEmail")}
                </Button>
                <Button variant="outline" onClick={() => invite.mutate(true)} disabled={invite.isPending}>
                  <Link2 />
                  {t("inviteByLink")}
                </Button>
              </CardContent>
            </Card>
          )}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("settings")}</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex items-start justify-between gap-3 text-sm">
                  <span>
                    <span className="font-medium">{t("viewerDownloads")}</span>
                    <span className="block text-xs text-muted-foreground">{t("viewerDownloadsBody")}</span>
                  </span>
                  <Switch checked={Boolean(workspace?.viewerDownloads)} onCheckedChange={(checked) => settings.mutate(checked)} disabled={settings.isPending} />
                </label>
              </CardContent>
            </Card>
          )}
          <Card className={searchParams.get("nouveau") ? "ring-2 ring-primary" : undefined}>
            <CardHeader>
              <CardTitle className="text-sm">{t("createTitle")}</CardTitle>
              <CardDescription className="text-xs">{t("createBody")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (newName.trim().length >= 2) create.mutate();
                }}
              >
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} aria-label={t("name")} placeholder={t("name")} autoFocus={Boolean(searchParams.get("nouveau"))} />
                <Button type="submit" variant="outline" disabled={newName.trim().length < 2 || create.isPending}>
                  {t("create")}
                </Button>
              </form>
            </CardContent>
          </Card>
          {isOrganization && (!isOwner || !soleOwner) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("leaveTitle")}</CardTitle>
                <CardDescription className="text-xs">{t("leaveBody")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => window.confirm(t("leaveConfirm")) && leave.mutate()} disabled={leave.isPending}>
                  <DoorOpen />
                  {t("leave")}
                </Button>
              </CardContent>
            </Card>
          )}
          {isOrganization && can("workspace.delete") && (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-sm text-destructive">{t("deleteTitle")}</CardTitle>
                <CardDescription className="text-xs">{t("deleteBody")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (confirmName.trim() === workspace?.name) destroy.mutate();
                  }}
                >
                  <Field label={t("deleteConfirm", { name: workspace?.name ?? "" })} htmlFor="delete-confirm">
                    <Input id="delete-confirm" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} autoComplete="off" />
                  </Field>
                  <Button type="submit" variant="destructive" disabled={confirmName.trim() !== workspace?.name || destroy.isPending}>
                    <Trash2 />
                    {t("delete")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense>
      <WorkspaceContent />
    </Suspense>
  );
}
