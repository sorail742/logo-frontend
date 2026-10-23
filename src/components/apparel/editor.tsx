"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Check,
  CloudOff,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Redo2,
  Send,
  SlidersHorizontal,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { NativeSelect } from "@/components/common/native-select";
import { useBrandLogos } from "@/components/studio/editor";
import { Link } from "@/i18n/navigation";
import { useApiErrorToast } from "@/hooks/use-api-error";
import { useWorkspace } from "@/hooks/use-workspace";
import { api } from "@/lib/api";
import { REFERENCE_SIZE } from "@/lib/apparel/defaults";
import { createImageElement } from "@/lib/apparel/elements";
import { viewsOf } from "@/lib/apparel/garments";
import type { ApparelDesign, ApparelTemplate, GarmentView, PrintZone } from "@/lib/apparel/types";
import { can } from "@/lib/permissions";
import { qk } from "@/lib/query-keys";
import type { BrandLogos } from "@/lib/studio/brand";
import { imageFiles, prepareImage } from "@/lib/studio/images";
import { ensureFonts } from "@/lib/studio/text";
import { cn } from "@/lib/utils";
import { omit } from "@/lib/object";
import { useApparel } from "@/stores/apparel";
import { AddPanel } from "./add-panel";
import { ApparelCanvas } from "./canvas";
import { ExportMenu } from "./export-menu";
import { Inspector } from "./inspector";
import { ProofDialog } from "./proof-dialog";
import { STATUS_VARIANT } from "./status";

// Éditeur plein écran d'une tenue : chargement de la tenue et de son support, sauvegarde
// automatique des éléments, raccourcis clavier, import de photos (bouton, dépôt, collage).

const SAVE_DELAY_MS = 1200;
/** Côté maximal d'une photo importée : environ 300 dpi sur 30 cm. */
const PHOTO_MAX_SIDE = 3600;

type SaveState = "saved" | "pending" | "saving" | "error";

export interface ApparelEditorContextValue {
  projectId: string;
  template: ApparelTemplate;
  canEdit: boolean;
  logos: BrandLogos;
  slogan: string | null;
  brandColors: string[];
  /** Zone visée par les ajouts (zone choisie, sinon la première de la vue). */
  zone: PrintZone | undefined;
  pickImage(): void;
  /** Enregistre immédiatement les éléments en attente (avant un contrôle ou un export). */
  flush(): Promise<void>;
  /** Réglages renvoyés par l'API (statut du BAT compris), sans toucher aux éléments en cours. */
  applyDesign(design: ApparelDesign): void;
  /** Identifiant local d'un élément désigné par l'API (renouvelé à chaque enregistrement). */
  localId(serverId: string | undefined): string | undefined;
}

const EditorContext = createContext<ApparelEditorContextValue | null>(null);

export function useApparelEditor() {
  const value = useContext(EditorContext);
  if (!value) throw new Error("useApparelEditor hors de l'éditeur textile");
  return value;
}

const EDITABLE_VIEWS = new Set<GarmentView>(["FRONT", "BACK", "LEFT_SLEEVE", "RIGHT_SLEEVE", "SHORTS_FRONT"]);
const SAVE_ICONS = { saved: Check, error: CloudOff, pending: Loader2, saving: Loader2 } as const;
/** Déplacement au clavier, en mm (Maj : 10 mm). */
const NUDGES: Record<string, [number, number]> = {
  arrowleft: [-1, 0],
  arrowright: [1, 0],
  arrowup: [0, -1],
  arrowdown: [0, 1],
};

/** Raccourcis d'historique : Ctrl+Z, Ctrl+Maj+Z, Ctrl+Y. */
function historyShortcut(event: KeyboardEvent, key: string) {
  if (!(event.ctrlKey || event.metaKey) || (key !== "z" && key !== "y")) return false;
  event.preventDefault();
  const state = useApparel.getState();
  if (key === "z" && !event.shiftKey) state.undo();
  else state.redo();
  return true;
}

/** Raccourcis de l'élément sélectionné : dupliquer, supprimer, désélectionner, déplacer. */
function elementShortcut(event: KeyboardEvent, key: string, id: string) {
  const state = useApparel.getState();
  const nudge = NUDGES[key];
  if ((event.ctrlKey || event.metaKey) && key === "d") {
    event.preventDefault();
    state.duplicate(id);
  } else if (key === "delete" || key === "backspace") {
    event.preventDefault();
    state.remove(id);
  } else if (key === "escape") {
    state.select(null);
  } else if (nudge) {
    event.preventDefault();
    const step = event.shiftKey ? 10 : 1;
    const round = (v: number) => Math.round(v * 10) / 10;
    state.update(
      id,
      (el) => ({
        ...el,
        offsetXMm: round(el.offsetXMm + nudge[0] * step),
        offsetYMm: round(el.offsetYMm + nudge[1] * step),
      }),
      { merge: `nudge-${id}` },
    );
  }
}

/** Saisie ou contrôle qui gère lui-même le clavier (champ, curseur, menu, dialogue). */
function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      Boolean(
        target.closest(
          "input, textarea, select, [role=slider], [role=menu], [role=listbox], [role=dialog], [role=tablist]",
        ),
      ))
  );
}

export function ApparelEditor({ did }: Readonly<{ did: string }>) {
  const t = useTranslations("apparel");
  const inspectorTitle = t("inspector.title");
  const addTitle = t("add.title");
  const onError = useApiErrorToast();
  const queryClient = useQueryClient();
  const { workspaces } = useWorkspace();
  const design = useQuery({
    queryKey: qk.apparelDesign(did),
    queryFn: () => api.apparel.get(did),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const templates = useQuery({
    queryKey: qk.apparelTemplates,
    queryFn: () => api.apparel.templates(),
    staleTime: 10 * 60_000,
  });
  const pid = design.data?.projectId;
  const project = useQuery({
    queryKey: qk.project(pid ?? ""),
    queryFn: () => api.projects.get(pid!),
    enabled: Boolean(pid),
  });
  const logos = useQuery({
    queryKey: qk.logos(pid ?? ""),
    queryFn: () => api.logos.list(pid!),
    enabled: Boolean(pid),
  });
  const slogans = useQuery({
    queryKey: qk.slogans(pid ?? ""),
    queryFn: () => api.slogans.list(pid!),
    enabled: Boolean(pid) && api.isAvailable("slogans"),
  });
  const mainLogo = logos.data?.find((l) => l.isFavorite) ?? logos.data?.[0];
  const brandLogos = useBrandLogos(mainLogo?.id);

  const meta = useApparel((s) => s.design);
  const view = useApparel((s) => s.view);
  const revision = useApparel((s) => s.revision);
  const targetZone = useApparel((s) => s.targetZone);
  const previewSize = useApparel((s) => s.previewSize);
  const showZones = useApparel((s) => s.showZones);
  const canUndo = useApparel((s) => s.past.length > 0);
  const canRedo = useApparel((s) => s.future.length > 0);

  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [proofOpen, setProofOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState<"add" | "inspect" | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const savedRevision = useRef(0);
  const saving = useRef<Promise<void> | null>(null);
  const serverIds = useRef(new Map<string, string>());

  const role = workspaces.find((w) => w.id === project.data?.workspaceId)?.role;
  const canEdit = can("content.edit", role);
  const template = templates.data?.find((tpl) => tpl.id === design.data?.templateId);
  const views = useMemo(
    () => (template ? viewsOf(template).filter((v) => EDITABLE_VIEWS.has(v)) : []),
    [template],
  );

  // Chargement de la tenue dans l'éditeur, sur la première vue du support.
  // Une seule fois par tenue : les réponses de la sauvegarde ne remplacent pas l'état de l'éditeur.
  useEffect(() => {
    if (!design.data || !template || useApparel.getState().design?.id === design.data.id) return;
    const d = design.data;
    useApparel.getState().load(d, viewsOf(template)[0] ?? "FRONT");
    savedRevision.current = 0;
    serverIds.current = new Map(d.elements.filter((e) => e.id).map((e) => [e.id!, e.id!]));
    void ensureFonts(
      d.elements
        .filter((e) => e.content.fontId)
        .map((e) => ({ fontId: e.content.fontId!, fontWeight: e.content.fontWeight ?? 700 })),
    );
  }, [design.data, template]);

  /** Réglages renvoyés par l'API : une modification après l'envoi du BAT le révoque. */
  const syncStatus = useCallback(
    (next: ApparelDesign) => {
      const before = useApparel.getState().design?.status;
      useApparel.getState().setDesign(omit(next, ["elements"]));
      if (before && before !== "DRAFT" && next.status === "DRAFT") toast.warning(t("editor.proofReset"));
    },
    [t],
  );

  // ─── Sauvegarde automatique ───

  const save = useCallback(async () => {
    const state = useApparel.getState();
    if (!state.design || !canEdit) return;
    const target = state.revision;
    if (target === savedRevision.current) return;
    setSaveState("saving");
    try {
      const sent = state.elements;
      const saved = await api.apparel.saveElements(state.design.id, sent);
      // Même ordre (zIndex) : l'élément envoyé en position i porte le i-ème identifiant renvoyé.
      saved.elements.forEach((e, i) => e.id && sent[i] && serverIds.current.set(e.id, sent[i].id));
      savedRevision.current = target;
      syncStatus(saved);
      setSaveState(useApparel.getState().revision === target ? "saved" : "pending");
      queryClient.setQueryData(qk.apparelDesign(saved.id), saved);
      void queryClient.invalidateQueries({ queryKey: qk.apparel(saved.projectId) });
    } catch (error) {
      setSaveState("error");
      onError(error);
    }
  }, [canEdit, onError, queryClient, syncStatus]);

  const flush = useCallback(async () => {
    if (saving.current) await saving.current;
    saving.current = save();
    await saving.current;
    saving.current = null;
  }, [save]);

  useEffect(() => {
    if (!revision || revision === savedRevision.current || !canEdit) return undefined;
    setSaveState("pending");
    const timer = setTimeout(() => void flush(), SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [revision, flush, canEdit]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (useApparel.getState().revision !== savedRevision.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // ─── Zone visée et photos ───

  const zonesOfView = useMemo(() => template?.zones.filter((z) => z.view === view) ?? [], [template, view]);
  const zone = zonesOfView.find((z) => z.key === targetZone) ?? zonesOfView[0];

  const importImage = useCallback(
    async (file: File) => {
      if (!zone) return;
      const toastId = toast.loading(t("editor.importing"));
      try {
        const prepared = await prepareImage(file, { maxSide: PHOTO_MAX_SIDE });
        useApparel.getState().add(createImageElement(prepared, zone));
        toast.success(t("editor.imported"), { id: toastId, description: t("editor.rightsReminder") });
      } catch {
        toast.error(t("editor.importFailed"), { id: toastId });
      }
    },
    [t, zone],
  );

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (!canEdit || isTyping(event.target)) return;
      const files = event.clipboardData ? imageFiles(event.clipboardData.items) : [];
      if (!files.length) return;
      event.preventDefault();
      void importImage(files[0]!);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [importImage, canEdit]);

  // ─── Raccourcis ───

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target) || !canEdit) return;
      const key = event.key.toLowerCase();
      if (historyShortcut(event, key)) return;
      const { selection, previewSize } = useApparel.getState();
      if (selection && !previewSize) elementShortcut(event, key, selection);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canEdit]);

  const pickImage = useCallback(() => fileInput.current?.click(), []);
  const localId = useCallback(
    (id: string | undefined) => (id ? (serverIds.current.get(id) ?? id) : undefined),
    [],
  );

  const brandColors = useMemo(() => {
    const c = (mainLogo?.current.spec ?? project.data?.previewSpec)?.colors;
    return c
      ? [
          ...new Set(
            [c.primary, c.secondary, c.text, c.background].filter(Boolean).map((x) => x.toLowerCase()),
          ),
        ]
      : [];
  }, [mainLogo, project.data]);

  // Fourni seulement une fois la tenue et son support chargés (voir le rendu ci-dessous).
  const context = useMemo<ApparelEditorContextValue>(
    () => ({
      projectId: pid ?? "",
      template: template!,
      canEdit,
      logos: brandLogos,
      slogan: slogans.data?.find((s) => s.isChosen)?.text ?? null,
      brandColors,
      zone,
      pickImage,
      flush,
      applyDesign: syncStatus,
      localId,
    }),
    [
      template,
      pid,
      canEdit,
      brandLogos,
      slogans.data,
      brandColors,
      zone,
      pickImage,
      flush,
      syncStatus,
      localId,
    ],
  );

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

  if (!template || !pid || meta?.id !== did) {
    return (
      <div className="flex h-svh flex-col">
        <div className="flex h-14 items-center gap-3 border-b px-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="bg-muted/40 flex flex-1 items-center justify-center">
          <Skeleton className="h-[60vh] w-[50vh] rounded-2xl" />
        </div>
      </div>
    );
  }

  const saveLabel = {
    saved: t("editor.saved"),
    pending: t("editor.pending"),
    saving: t("editor.saving"),
    error: t("editor.saveError"),
  }[saveState];
  const SaveIcon = SAVE_ICONS[saveState];
  const adding = panelOpen === "add";
  const refSize = template.sizes.find((s) => s.label === REFERENCE_SIZE)?.label ?? template.sizes[0]?.label;

  return (
    <EditorContext.Provider value={context}>
      <div className="bg-background flex h-svh flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2 sm:px-3">
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href={`/app/projets/${meta.projectId}/textile`} />}
            nativeButton={false}
            aria-label={t("editor.back")}
          >
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{meta.name}</p>
            <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <SaveIcon
                className={cn(
                  "size-3",
                  saveState === "saving" || saveState === "pending" ? "animate-spin" : "",
                )}
                aria-hidden="true"
              />
              <span aria-live="polite">{canEdit ? saveLabel : t("editor.readOnly")}</span>
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[meta.status]} className="ml-1 hidden sm:inline-flex">
            {t(`status.${meta.status}`)}
          </Badge>
          <div className="ml-auto flex items-center gap-1">
            {canEdit && (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => useApparel.getState().undo()}
                  disabled={!canUndo}
                  aria-label={t("editor.undo")}
                  title={t("editor.undo")}
                >
                  <Undo2 />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => useApparel.getState().redo()}
                  disabled={!canRedo}
                  aria-label={t("editor.redo")}
                  title={t("editor.redo")}
                >
                  <Redo2 />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => useApparel.getState().toggleZones()}
              aria-pressed={showZones}
              aria-label={t("editor.zones")}
              title={t("editor.zones")}
            >
              {showZones ? <Eye /> : <EyeOff />}
            </Button>
            <NativeSelect
              value={previewSize ?? ""}
              onChange={(event) => useApparel.getState().setPreviewSize(event.target.value || null)}
              className="w-28"
              aria-label={t("editor.size")}
              title={t("editor.sizeHint")}
            >
              <option value="">{t("editor.refSize", { size: refSize ?? "M" })}</option>
              {template.sizes
                .filter((s) => s.label !== refSize)
                .map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
            </NativeSelect>
            <ExportMenu>
              <Download />
              <span className="hidden md:inline">{t("export.title")}</span>
            </ExportMenu>
            {canEdit && (
              <Button size="sm" onClick={() => void flush().then(() => setProofOpen(true))}>
                <Send />
                <span className="hidden md:inline">{t("proof.send")}</span>
              </Button>
            )}
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside
            className="hidden w-72 shrink-0 overflow-y-auto border-r p-3 lg:block"
            aria-label={addTitle}
          >
            <AddPanel />
          </aside>
          <main className="bg-muted/40 flex min-w-0 flex-1 flex-col">
            <div className="bg-background/60 flex items-center gap-2 border-b px-2 py-1.5">
              <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label={t("editor.views")}>
                {views.map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={view === v}
                    onClick={() => useApparel.getState().setView(v)}
                    className={cn(
                      "h-8 shrink-0 rounded-lg px-3 text-xs font-medium transition",
                      view === v
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {t(`views.${v}`)}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex gap-1 lg:hidden">
                {canEdit && (
                  <Button size="sm" variant="outline" onClick={() => setPanelOpen("add")}>
                    {addTitle}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPanelOpen("inspect")}
                  aria-label={inspectorTitle}
                >
                  <SlidersHorizontal />
                </Button>
              </div>
            </div>
            <ApparelCanvas template={template} canEdit={canEdit} />
          </main>
          <aside
            className="hidden w-80 shrink-0 overflow-y-auto border-l lg:block"
            aria-label={inspectorTitle}
          >
            <Inspector />
          </aside>
        </div>

        <Sheet open={panelOpen !== null} onOpenChange={(open) => !open && setPanelOpen(null)}>
          <SheetContent side={adding ? "left" : "right"} className="w-[88vw] max-w-sm overflow-y-auto p-0">
            <SheetHeader className="border-b">
              <SheetTitle>{adding ? addTitle : inspectorTitle}</SheetTitle>
            </SheetHeader>
            <div className={adding ? "p-3" : ""}>{adding ? <AddPanel /> : <Inspector />}</div>
          </SheetContent>
        </Sheet>

        {proofOpen && <ProofDialog onClose={() => setProofOpen(false)} />}

        <input
          ref={fileInput}
          type="file"
          aria-label={t("add.upload")}
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void importImage(file);
          }}
        />
      </div>
    </EditorContext.Provider>
  );
}
