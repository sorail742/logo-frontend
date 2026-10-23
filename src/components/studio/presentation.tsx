"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, LayoutGrid, Maximize, Minimize, X } from "lucide-react";
import { renderPage } from "@/lib/studio/render";
import type { DesignDoc } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

// Mode présentation : diapositives en plein écran sur fond noir, navigation au clavier, à la
// souris et au toucher, transitions (fondu, glissement, zoom), vue d'ensemble et écran noir,
// comme dans un logiciel de présentation. Les raccourcis de l'éditeur sont suspendus.

export type SlideTransition = "none" | "fade" | "slide" | "zoom";
export const SLIDE_TRANSITIONS: SlideTransition[] = ["fade", "slide", "zoom", "none"];

const PREFERENCE_KEY = "studio:presentation-transition";
const DURATION_MS = 520;
const EASING = "cubic-bezier(0.22, 0.7, 0.2, 1)";
const IDLE_MS = 2500;
const SWIPE_PX = 50;

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown", "PageDown", " ", "Enter", "n", "N"]);
const PREVIOUS_KEYS = new Set(["ArrowLeft", "ArrowUp", "PageUp", "Backspace", "p", "P"]);

/** Images clés d'entrée et de sortie d'une transition (sens : 1 = suivante, -1 = précédente). */
function frames(
  transition: SlideTransition,
  direction: number,
): { enter: Keyframe[]; exit: Keyframe[] } | null {
  switch (transition) {
    case "fade":
      return { enter: [{ opacity: 0 }, { opacity: 1 }], exit: [{ opacity: 1 }, { opacity: 0 }] };
    case "slide":
      return {
        enter: [{ transform: `translateX(${direction * 100}%)` }, { transform: "translateX(0)" }],
        exit: [{ transform: "translateX(0)" }, { transform: `translateX(${-direction * 100}%)` }],
      };
    case "zoom":
      return {
        enter: [
          { opacity: 0, transform: `scale(${direction > 0 ? 1.08 : 0.92})` },
          { opacity: 1, transform: "scale(1)" },
        ],
        exit: [
          { opacity: 1, transform: "scale(1)" },
          { opacity: 0, transform: `scale(${direction > 0 ? 0.94 : 1.06})` },
        ],
      };
    default:
      return null;
  }
}

function readPreference(): SlideTransition {
  try {
    const saved = window.localStorage.getItem(PREFERENCE_KEY) as SlideTransition | null;
    return saved && SLIDE_TRANSITIONS.includes(saved) ? saved : "fade";
  } catch {
    return "fade";
  }
}

/** SVG d'une page ajusté à son cadre (proportions conservées). */
const fitted = (svg: string) => svg.replace(/ width="[\d.]+" height="[\d.]+"/, ' width="100%" height="100%"');

function Slide({ svg, label, className }: { svg: string; label: string; className?: string }) {
  return (
    <div
      className={cn("absolute inset-0 bg-white [&>svg]:block", className)}
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function PresentationMode({
  doc,
  start = 0,
  onClose,
}: {
  doc: DesignDoc;
  start?: number;
  onClose(): void;
}) {
  const t = useTranslations("studio.presentation");
  const root = useRef<HTMLDivElement>(null);
  const incoming = useRef<HTMLDivElement>(null);
  const outgoing = useRef<HTMLDivElement>(null);
  const typed = useRef("");
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const total = doc.pages.length;
  const [index, setIndex] = useState(() => Math.min(Math.max(0, start), total - 1));
  const [previous, setPrevious] = useState<{ index: number; direction: number } | null>(null);
  const [transition, setTransition] = useState<SlideTransition>(readPreference);
  const [overview, setOverview] = useState(false);
  const [blank, setBlank] = useState<"black" | "white" | null>(null);
  const [controls, setControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const slides = useMemo(() => doc.pages.map((_, i) => fitted(renderPage(doc, i))), [doc]);
  const label = (i: number) => doc.pages[i]?.name ?? t("slide", { number: i + 1 });

  const go = useCallback(
    (target: number) => {
      const next = Math.min(Math.max(0, target), total - 1);
      setBlank(null);
      setOverview(false);
      if (next === index) return;
      setPrevious({ index, direction: next > index ? 1 : -1 });
      setIndex(next);
    },
    [index, total],
  );

  // Transition : la nouvelle diapositive entre, l'ancienne sort ; animations du navigateur.
  useLayoutEffect(() => {
    if (!previous) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motion = reduced ? null : frames(transition, previous.direction);
    if (!motion || !incoming.current || !outgoing.current) {
      setPrevious(null);
      return;
    }
    const options = { duration: DURATION_MS, easing: EASING, fill: "both" as const };
    const enter = incoming.current.animate(motion.enter, options);
    outgoing.current.animate(motion.exit, options);
    enter.onfinish = () => setPrevious(null);
    return () => enter.cancel();
  }, [previous, transition]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void root.current?.requestFullscreen().catch(() => undefined);
  }, []);

  const close = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    onClose();
  }, [onClose]);

  // Plein écran dès l'ouverture (geste de l'utilisateur encore actif), suivi de son état.
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    void root.current?.requestFullscreen?.().catch(() => undefined);
    root.current?.focus();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Barre d'outils masquée après quelques secondes sans mouvement.
  const wake = useCallback(() => {
    setControls(true);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setControls(false), IDLE_MS);
  }, []);
  useEffect(() => {
    idle.current = setTimeout(() => setControls(false), IDLE_MS);
    return () => {
      if (idle.current) clearTimeout(idle.current);
    };
  }, []);

  // Clavier : capturé avant les raccourcis de l'éditeur, qui restent suspendus.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("select")) return;
      event.stopImmediatePropagation();
      if (/^\d$/.test(event.key)) {
        typed.current = (typed.current + event.key).slice(-3);
        return;
      }
      if (event.key === "Enter" && typed.current) {
        event.preventDefault();
        go(Number(typed.current) - 1);
        typed.current = "";
        return;
      }
      typed.current = "";
      if (handleKey(event.key)) event.preventDefault();
    };
    const handleKey = (key: string) => {
      if (NEXT_KEYS.has(key)) go(index + 1);
      else if (PREVIOUS_KEYS.has(key)) go(index - 1);
      else if (key === "Home") go(0);
      else if (key === "End") go(total - 1);
      else if (key === "Escape") {
        if (overview) setOverview(false);
        else close();
      } else if (key === "f" || key === "F") toggleFullscreen();
      else if (key === "g" || key === "G") setOverview((open) => !open);
      else if (key === "b" || key === "B" || key === ".") setBlank((b) => (b === "black" ? null : "black"));
      else if (key === "w" || key === "W" || key === ",") setBlank((b) => (b === "white" ? null : "white"));
      else return false;
      return true;
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [go, index, total, overview, close, toggleFullscreen]);

  /** Clic : tiers gauche = précédente, sinon suivante ; glissement horizontal au toucher. */
  const onPointerDown = (event: ReactPointerEvent) => {
    swipe.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const startPoint = swipe.current;
    swipe.current = null;
    if (!startPoint || event.button !== 0) return;
    const dx = event.clientX - startPoint.x;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(event.clientY - startPoint.y)) {
      go(index + (dx < 0 ? 1 : -1));
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    go(index + (event.clientX - rect.left < rect.width / 3 ? -1 : 1));
  };

  const chooseTransition = (value: SlideTransition) => {
    setTransition(value);
    try {
      window.localStorage.setItem(PREFERENCE_KEY, value);
    } catch {
      // Préférence non conservée (stockage indisponible).
    }
  };

  const ratio = doc.width / doc.height;
  const frameStyle = {
    aspectRatio: `${doc.width} / ${doc.height}`,
    width: `min(100vw, calc(100vh * ${ratio}))`,
  };
  const button =
    "flex size-9 items-center justify-center rounded-full text-white/85 transition hover:bg-white/15 hover:text-white disabled:opacity-30";

  return (
    <div
      ref={root}
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black outline-none select-none",
        !controls && "cursor-none",
      )}
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      tabIndex={-1}
      onPointerMove={wake}
    >
      <div
        className="relative overflow-hidden"
        style={frameStyle}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        aria-live="polite"
      >
        {previous && (
          <div ref={outgoing} key={`out-${previous.index}`} className="pointer-events-none absolute inset-0">
            <Slide svg={slides[previous.index]!} label={label(previous.index)} />
          </div>
        )}
        <div ref={incoming} key={`in-${index}`} className="absolute inset-0">
          <Slide
            svg={slides[index]!}
            label={t("current", { label: label(index), number: index + 1, total })}
          />
        </div>
        {blank && (
          <div
            className={cn("absolute inset-0", blank === "black" ? "bg-black" : "bg-white")}
            aria-label={t("blank")}
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/10">
        <div
          className="h-full bg-white/70 transition-[width] duration-500"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <div
        className={cn(
          "absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-neutral-900/85 px-2 py-1 text-sm text-white shadow-lg backdrop-blur transition-opacity duration-300",
          controls ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        role="toolbar"
        aria-label={t("controls")}
      >
        <button
          type="button"
          className={button}
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label={t("previous")}
          title={`${t("previous")} (←)`}
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="min-w-16 text-center tabular-nums">
          {t("counter", { current: index + 1, total })}
        </span>
        <button
          type="button"
          className={button}
          onClick={() => go(index + 1)}
          disabled={index === total - 1}
          aria-label={t("next")}
          title={`${t("next")} (→)`}
        >
          <ChevronRight className="size-5" />
        </button>
        <span className="mx-1 h-5 w-px bg-white/20" />
        <label className="flex items-center gap-1.5 px-1 text-xs text-white/70">
          {t("transition")}
          <select
            value={transition}
            onChange={(e) => chooseTransition(e.target.value as SlideTransition)}
            className="h-7 rounded-md bg-white/10 px-1.5 text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            {SLIDE_TRANSITIONS.map((value) => (
              <option key={value} value={value} className="text-black">
                {t(`transitions.${value}`)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={button}
          onClick={() => setOverview((open) => !open)}
          aria-pressed={overview}
          aria-label={t("overview")}
          title={`${t("overview")} (G)`}
        >
          <LayoutGrid className="size-4" />
        </button>
        <button
          type="button"
          className={button}
          onClick={toggleFullscreen}
          aria-label={fullscreen ? t("exitFullscreen") : t("fullscreen")}
          title={`${fullscreen ? t("exitFullscreen") : t("fullscreen")} (F)`}
        >
          {fullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
        </button>
        <button
          type="button"
          className={button}
          onClick={close}
          aria-label={t("exit")}
          title={`${t("exit")} (Échap)`}
        >
          <X className="size-4" />
        </button>
      </div>

      {controls && index === 0 && !overview && (
        <p className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-neutral-900/70 px-3 py-1 text-xs text-white/80">
          {t("hint")}
        </p>
      )}

      {overview && (
        <div
          className="absolute inset-0 overflow-y-auto bg-neutral-950/95 p-6 sm:p-10"
          role="listbox"
          aria-label={t("overview")}
        >
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {slides.map((svg, i) => (
              <button
                key={doc.pages[i]!.id}
                type="button"
                role="option"
                aria-selected={i === index}
                onClick={() => go(i)}
                className={cn(
                  "group grid gap-1.5 text-left text-xs text-white/70",
                  i === index && "text-white",
                )}
              >
                <span
                  className={cn(
                    "relative block overflow-hidden rounded-md ring-2 transition",
                    i === index ? "ring-white" : "ring-transparent group-hover:ring-white/50",
                  )}
                  style={{ aspectRatio: `${doc.width} / ${doc.height}` }}
                >
                  <Slide svg={svg} label={label(i)} />
                </span>
                <span className="truncate">
                  {i + 1}. {label(i)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
