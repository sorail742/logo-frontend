"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowLeft, Check, CloudOff, Download, Keyboard, Loader2, MessageSquarePlus, Redo2, SlidersHorizontal, Sparkles, Undo2, Wand2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { Link } from "@/i18n/navigation";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { api } from "@/lib/api";
import { can } from "@/lib/permissions";
import { qk } from "@/lib/query-keys";
import { svgToPngDataUrl } from "@/lib/render/export";
import { renderLogoSvg } from "@/lib/render/logo";
import type { IconNode } from "@/lib/render/icons";
import { buildBrand, type BrandLogos } from "@/lib/studio/brand";
import { documentFonts } from "@/lib/studio/doc";
import { imageFiles, prepareImage } from "@/lib/studio/images";
import { renderPage } from "@/lib/studio/render";
import { ensureFonts } from "@/lib/studio/text";
import { useWorkspace } from "@/hooks/use-workspace";
import { useStudio } from "@/stores/studio";
import { StudioCanvas } from "./canvas";
import { useDesignThreads } from "./comments";
import { StudioContext, type StudioContextValue } from "./context";
import { ExportDialog } from "./export-dialog";
import { Inspector } from "./inspector";
import { PageStrip } from "./page-strip";
import { placeImages } from "./placement";
import { ResizeDialog } from "./resize-dialog";
import { SidePanel, type PanelId } from "./side-panel";
import { useStudioShortcuts } from "./use-shortcuts";
import { VariationsDialog } from "./variations-dialog";

// Éditeur plein écran du Studio : chargement de la création et de l'identité du projet,
// sauvegarde automatique (document et aperçu), import de photos (bouton, dépôt, collage).

const SAVE_DELAY_MS = 1500;
const THUMBNAIL_SIZE = 400;

type SaveState = "saved" | "pending" | "saving" | "error";

/** Logos du projet : déclinaisons du serveur (texte vectorisé), sinon rendues dans le navigateur. */
export function useBrandLogos(lid: string | undefined) {
  const logo = useQuery({ queryKey: qk.logo(lid ?? ""), queryFn: () => api.logos.get(lid!), enabled: Boolean(lid) });
  const variants = useQuery({ queryKey: qk.logoVariants(lid ?? ""), queryFn: () => api.logos.variants(lid!, { transparent: true }), enabled: Boolean(lid), staleTime: 5 * 60_000, retry: false });
  return useMemo<BrandLogos>(() => {
    const list = variants.data?.variants;
    if (list?.length) return Object.fromEntries(list.filter((v) => ["color", "white", "black", "icon", "horizontal", "vertical"].includes(v.id)).map((v) => [v.id, v.svg]));
    const version = logo.data?.current;
    if (!version) return {};
    if (version.svg) return { color: version.svg };
    const render = (variant: "color" | "white" | "black", layout?: "icon") => renderLogoSvg(version.spec, { variant, layout, withBackground: false }).svg;
    return { color: render("color"), white: render("white"), black: render("black"), ...(version.spec.iconId ? { icon: render("color", "icon") } : {}) };
  }, [variants.data, logo.data]);
}

export function StudioEditor({ sdid }: { sdid: string }) {
  const t = useTranslations("studio");
  const onError = useApiErrorToast();
  const queryClient = useQueryClient();
  const { workspaces } = useWorkspace();
  const design = useQuery({ queryKey: qk.studioDesign(sdid), queryFn: () => api.studio.get(sdid), staleTime: Infinity, refetchOnWindowFocus: false });
  const pid = design.data?.projectId;
  const project = useQuery({ queryKey: qk.project(pid ?? ""), queryFn: () => api.projects.get(pid!), enabled: Boolean(pid) });
  const logos = useQuery({ queryKey: qk.logos(pid ?? ""), queryFn: () => api.logos.list(pid!), enabled: Boolean(pid) });
  const slogans = useQuery({ queryKey: qk.slogans(pid ?? ""), queryFn: () => api.slogans.list(pid!), enabled: Boolean(pid) && api.isAvailable("slogans") });
  const mainLogo = logos.data?.find((l) => l.isFavorite) ?? logos.data?.[0];
  const brandLogos = useBrandLogos(mainLogo?.id);
  const [icons, setIcons] = useState<Record<string, IconNode> | null>(null);

  const meta = useStudio((s) => s.meta);
  const doc = useStudio((s) => s.doc);
  const revision = useStudio((s) => s.revision);
  const canUndo = useStudio((s) => s.past.length > 0);
  const commentMode = useStudio((s) => s.commentMode);
  const canRedo = useStudio((s) => s.future.length > 0);

  // Petits écrans : le panneau d'outils s'ouvre en surimpression, fermé au départ.
  const [panel, setPanel] = useState<PanelId | null>(() => (typeof window !== "undefined" && window.innerWidth < 768 ? null : "templates"));
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [dialog, setDialog] = useState<"export" | "resize" | "variations" | "help" | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const frameTarget = useRef<string | null>(null);
  const savedRevision = useRef(0);
  const saving = useRef<Promise<void> | null>(null);

  const role = workspaces.find((w) => w.id === project.data?.workspaceId)?.role;
  const canEdit = can("content.edit", role);

  // Chargement de la création dans l'éditeur.
  useEffect(() => {
    if (!design.data) return;
    const d = design.data;
    useStudio.getState().load({ id: d.id, projectId: d.projectId, name: d.name, format: d.format }, d.doc);
    savedRevision.current = 0;
    void ensureFonts(documentFonts(d.doc));
  }, [design.data]);

  // Bibliothèque d'icônes complète (≈ 90 Ko compressés), chargée après l'affichage.
  useEffect(() => {
    let alive = true;
    fetch("/studio/icons.json")
      .then((r) => r.json() as Promise<{ icons: Record<string, IconNode> }>)
      .then((data) => alive && setIcons(data.icons))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const projectData = project.data;
  const sloganText = slogans.data?.find((s) => s.isChosen)?.text ?? null;
  const spec = mainLogo?.current.spec ?? projectData?.previewSpec ?? null;
  const brand = useMemo(
    () =>
      projectData
        ? buildBrand({ name: projectData.chosenName?.value ?? projectData.title, slogan: sloganText, sector: projectData.brief?.sector ?? null, spec, logos: brandLogos })
        : null,
    [projectData, sloganText, spec, brandLogos],
  );

  // ─── Sauvegarde automatique ───

  const save = useCallback(async () => {
    const state = useStudio.getState();
    if (!state.doc || !state.meta || !canEdit) return;
    const target = state.revision;
    if (target === savedRevision.current) return;
    setSaveState("saving");
    try {
      const thumbnail = await svgToPngDataUrl(renderPage(state.doc, 0), { size: THUMBNAIL_SIZE }).catch(() => undefined);
      await api.studio.save(state.meta.id, { name: state.meta.name, doc: state.doc, thumbnail });
      savedRevision.current = target;
      setSaveState(useStudio.getState().revision === target ? "saved" : "pending");
      queryClient.invalidateQueries({ queryKey: qk.studio(state.meta.projectId) });
    } catch (error) {
      setSaveState("error");
      onError(error);
    }
  }, [canEdit, onError, queryClient]);

  const flush = useCallback(async () => {
    if (saving.current) await saving.current;
    saving.current = save();
    await saving.current;
    saving.current = null;
  }, [save]);

  useEffect(() => {
    if (!revision || revision === savedRevision.current || !canEdit) return;
    setSaveState("pending");
    const timer = setTimeout(() => void flush(), SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [revision, flush, canEdit]);

  // Quitter la page avec des modifications non enregistrées.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (useStudio.getState().revision !== savedRevision.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // ─── Photos ───

  const importImages = useCallback(
    async (files: File[], at?: { x: number; y: number }, frameId?: string | null) => {
      if (!files.length) return;
      const toastId = toast.loading(t("uploads.processing", { count: files.length }));
      try {
        const prepared = await Promise.all(files.slice(0, 12).map((file) => prepareImage(file)));
        placeImages(prepared, at, frameId);
        toast.success(t("uploads.added", { count: prepared.length }), { id: toastId });
      } catch {
        toast.error(t("uploads.failed"), { id: toastId });
      }
    },
    [t],
  );

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      const files = event.clipboardData ? imageFiles(event.clipboardData.items) : [];
      if (!files.length) return;
      event.preventDefault();
      void importImages(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [importImages]);

  const pickImages = useCallback((frameId?: string | null) => {
    frameTarget.current = frameId ?? null;
    fileInput.current?.click();
  }, []);

  const handlers = useMemo(() => ({ onExport: () => setDialog("export"), onHelp: () => setDialog("help") }), []);
  useStudioShortcuts(handlers);

  const context = useMemo<StudioContextValue>(() => ({ projectId: pid ?? "", brand, canEdit, icons, pickImages, flush }), [pid, brand, canEdit, icons, pickImages, flush]);

  if (design.error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg font-semibold">{t("editor.notFound")}</p>
        <Button render={<Link href="/app" />} nativeButton={false}>
          {t("editor.back")}
        </Button>
      </div>
    );
  }

  if (!doc || !meta || meta.id !== sdid) {
    return (
      <div className="flex h-svh flex-col">
        <div className="flex h-14 items-center gap-3 border-b px-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex flex-1 items-center justify-center bg-muted" role="status" aria-label={t("editor.loading")}>
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const commitName = () => {
    const trimmed = (nameDraft ?? "").trim().slice(0, 120);
    setNameDraft(null);
    if (trimmed && trimmed !== meta.name) useStudio.getState().rename(trimmed);
  };

  return (
    <StudioContext.Provider value={context}>
      <div className="flex h-svh flex-col overflow-hidden bg-background">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
          <Button variant="ghost" size="icon" render={<Link href={`/app/projets/${meta.projectId}/studio`} />} nativeButton={false} aria-label={t("editor.back")} title={t("editor.back")}>
            <ArrowLeft />
          </Button>
          <Link href="/app" className="hidden shrink-0 sm:block" aria-label={t("editor.home")}>
            <PlatformLogo withText={false} />
          </Link>
          <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
          <input
            value={nameDraft ?? meta.name}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            disabled={!canEdit}
            className="h-8 w-40 min-w-0 rounded-md border border-transparent bg-transparent px-2 text-sm font-semibold outline-none hover:border-input focus:border-ring sm:w-64"
            aria-label={t("editor.name")}
          />
          <SaveIndicator state={canEdit ? saveState : "saved"} readOnly={!canEdit} />
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => useStudio.getState().undo()} disabled={!canUndo} aria-label={t("editor.undo")} title={`${t("editor.undo")} (Ctrl+Z)`}>
              <Undo2 />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => useStudio.getState().redo()} disabled={!canRedo} aria-label={t("editor.redo")} title={`${t("editor.redo")} (${t("shortcuts.keys.redo")})`}>
              <Redo2 />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={() => setDialog("help")} aria-label={t("editor.shortcuts")} title={`${t("editor.shortcuts")} (?)`}>
              <Keyboard />
            </Button>
            <Button
              variant={commentMode ? "default" : "ghost"}
              size="icon"
              onClick={() => useStudio.getState().setCommentMode(!commentMode)}
              aria-pressed={commentMode}
              aria-label={t("editor.comment")}
              title={`${t("editor.comment")} (C)`}
            >
              <MessageSquarePlus />
            </Button>
            <div className="mx-1 h-6 w-px bg-border" />
            <Button variant="outline" onClick={() => setDialog("variations")} disabled={!canEdit} className="hidden sm:inline-flex">
              <Sparkles />
              {t("editor.variations")}
            </Button>
            <Button variant="outline" onClick={() => setDialog("resize")} disabled={!canEdit} className="hidden sm:inline-flex">
              <Wand2 />
              {t("editor.resize")}
            </Button>
            {canEdit && (
              <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setPropertiesOpen(true)} aria-label={t("editor.properties")} title={t("editor.properties")}>
                <SlidersHorizontal />
              </Button>
            )}
            <Button onClick={() => setDialog("export")} aria-label={t("editor.export")}>
              <Download />
              <span className="max-sm:hidden">{t("editor.export")}</span>
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          {canEdit ? <SidePanel panel={panel} onPanel={setPanel} /> : <SidePanel panel={panel} onPanel={setPanel} only={["comments"]} />}
          <main className="flex min-w-0 flex-1 flex-col">
            <StudioCanvas onDropFiles={(files, at, frame) => void importImages(files, at, frame)} onRequestImage={(frameId) => pickImages(frameId)} />
            <PageStrip />
          </main>
          {canEdit && (
            <aside className="hidden w-[288px] shrink-0 border-l bg-background lg:block" aria-label={t("editor.properties")}>
              <Inspector />
            </aside>
          )}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          multiple
          hidden
          onChange={(event) => {
            const files = event.target.files ? imageFiles(event.target.files) : [];
            event.target.value = "";
            void importImages(files, undefined, frameTarget.current);
            frameTarget.current = null;
          }}
        />
        <ExportDialog open={dialog === "export"} onOpenChange={(open) => setDialog(open ? "export" : null)} />
        <ResizeDialog open={dialog === "resize"} onOpenChange={(open) => setDialog(open ? "resize" : null)} />
        <VariationsDialog open={dialog === "variations"} onOpenChange={(open) => setDialog(open ? "variations" : null)} />
        <OpenLinkedThread />
        <ShortcutsDialog open={dialog === "help"} onOpenChange={(open) => setDialog(open ? "help" : null)} />
        {canEdit && (
          <Sheet open={propertiesOpen} onOpenChange={setPropertiesOpen}>
            <SheetContent side="right" className="w-[300px] gap-0 p-0 lg:hidden">
              <SheetHeader className="border-b">
                <SheetTitle>{t("editor.properties")}</SheetTitle>
              </SheetHeader>
              <div className="min-h-0 flex-1">
                <Inspector />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </StudioContext.Provider>
  );
}

/** Lien de notification « ?commentaire=… » : ouvre le fil sur sa page. */
function OpenLinkedThread() {
  const params = useSearchParams();
  const wanted = params.get("commentaire");
  const { threads } = useDesignThreads();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !wanted) return;
    const thread = threads.find((th) => th.root.id === wanted || th.replies.some((r) => r.id === wanted));
    if (!thread) return;
    done.current = true;
    const state = useStudio.getState();
    const index = state.doc?.pages.findIndex((p) => p.id === thread.root.anchor?.pageId) ?? -1;
    if (index >= 0) state.setPage(index);
    state.openThread(thread.root.id);
  }, [wanted, threads]);
  return null;
}

function SaveIndicator({ state, readOnly }: { state: SaveState; readOnly: boolean }) {
  const t = useTranslations("studio.editor");
  if (readOnly) return <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{t("readOnly")}</span>;
  const content = {
    saved: { icon: <Check className="size-3.5" />, label: t("saved") },
    pending: { icon: <span className="size-1.5 rounded-full bg-amber-500" />, label: t("pending") },
    saving: { icon: <Loader2 className="size-3.5 animate-spin" />, label: t("saving") },
    error: { icon: <CloudOff className="size-3.5 text-destructive" />, label: t("saveError") },
  }[state];
  return (
    <span className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex" role="status" aria-live="polite">
      {content.icon}
      {content.label}
    </span>
  );
}

const SHORTCUTS = [
  "undo",
  "redo",
  "clipboard",
  "duplicate",
  "selectAll",
  "delete",
  "nudge",
  "nudgeMore",
  "order",
  "lock",
  "hide",
  "edit",
  "deselect",
  "altDrag",
  "shiftDrag",
  "pan",
  "zoom",
  "fit",
  "export",
  "comment",
  "pages",
] as const;

function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange(open: boolean): void }) {
  const t = useTranslations("studio.shortcuts");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
          {SHORTCUTS.map((id) => (
            <div key={id} className="contents">
              <dt>
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">{t(`keys.${id}`)}</kbd>
              </dt>
              <dd className="text-muted-foreground">{t(`actions.${id}`)}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
