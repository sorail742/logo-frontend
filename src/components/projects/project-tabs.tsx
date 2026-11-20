"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDot,
  FileText,
  LayoutDashboard,
  Palette,
  Pen,
  Shapes,
  Shirt,
  Sparkles,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

export interface ProjectTabItem {
  id: string;
  path: string;
  labelFr: string;
  labelEn: string;
  subtitleFr: string;
  subtitleEn: string;
  icon: LucideIcon;
  gradient: string;
  accentColor: string;
  progressKey?: "brief" | "name" | "logo" | "signatures" | "kit";
}

export const PROJECT_TABS_CONFIG: ProjectTabItem[] = [
  {
    id: "overview",
    path: "",
    labelFr: "Aperçu",
    labelEn: "Overview",
    subtitleFr: "Tableau de bord projet",
    subtitleEn: "Project dashboard",
    icon: LayoutDashboard,
    gradient: "from-slate-700 via-slate-800 to-zinc-900 shadow-slate-900/25",
    accentColor: "#475569",
  },
  {
    id: "brief",
    path: "/brief",
    labelFr: "Brief",
    labelEn: "Brief",
    subtitleFr: "Positionnement & cible",
    subtitleEn: "Positioning & audience",
    icon: FileText,
    gradient: "from-amber-500 via-orange-500 to-amber-600 shadow-amber-500/25",
    accentColor: "#f59e0b",
    progressKey: "brief",
  },
  {
    id: "names",
    path: "/noms",
    labelFr: "Nom",
    labelEn: "Names",
    subtitleFr: "Trouvez le nom parfait",
    subtitleEn: "Find the perfect name",
    icon: Sparkles,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600 shadow-purple-500/25",
    accentColor: "#8b5cf6",
    progressKey: "name",
  },
  {
    id: "logos",
    path: "/logos",
    labelFr: "Logo",
    labelEn: "Logos",
    subtitleFr: "Créez votre identité visuelle",
    subtitleEn: "Design your brand mark",
    icon: Shapes,
    gradient: "from-amber-400 via-orange-500 to-rose-500 shadow-orange-500/25",
    accentColor: "#f97316",
    progressKey: "logo",
  },
  {
    id: "signatures",
    path: "/signatures",
    labelFr: "Signatures",
    labelEn: "Signatures",
    subtitleFr: "E-mail, sceaux & tampons",
    subtitleEn: "Email & wax stamps",
    icon: Pen,
    gradient: "from-sky-400 via-blue-500 to-indigo-600 shadow-blue-500/25",
    accentColor: "#0284c7",
    progressKey: "signatures",
  },
  {
    id: "kit",
    path: "/kit",
    labelFr: "Kit de marque",
    labelEn: "Brand Kit",
    subtitleFr: "Couleurs, typos & assets",
    subtitleEn: "Palette, fonts & assets",
    icon: Palette,
    gradient: "from-emerald-400 via-teal-500 to-emerald-600 shadow-emerald-500/25",
    accentColor: "#0d6e5f",
    progressKey: "kit",
  },
  {
    id: "studio",
    path: "/studio",
    labelFr: "Studio",
    labelEn: "Studio",
    subtitleFr: "Flyers, posts & visuels",
    subtitleEn: "Flyers, posts & visuals",
    icon: Wand2,
    gradient: "from-pink-500 via-rose-500 to-rose-600 shadow-pink-500/25",
    accentColor: "#ec4899",
  },
  {
    id: "textile",
    path: "/textile",
    labelFr: "Textile",
    labelEn: "Apparel",
    subtitleFr: "T-shirts, maillots & DTF",
    subtitleEn: "Tees, jerseys & heat press",
    icon: Shirt,
    gradient: "from-teal-400 via-emerald-500 to-green-600 shadow-teal-500/25",
    accentColor: "#0f766e",
  },
];

export interface ProjectTabsProps {
  pid: string;
  project?: Project | null;
  className?: string;
}

export function ProjectTabs({ pid, project, className }: Readonly<ProjectTabsProps>) {
  const locale = useLocale();
  const isEn = locale.startsWith("en");
  const pathname = usePathname();
  const base = `/app/projets/${pid}`;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scrollBy = (offset: number) => {
    scrollRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  };

  // Keyboard navigation for tablist
  const handleKeyDown = (e: KeyboardEvent<HTMLAnchorElement>, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextTab = scrollRef.current?.querySelectorAll<HTMLAnchorElement>('[role="tab"]')[index + 1];
      nextTab?.focus();
      nextTab?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevTab = scrollRef.current?.querySelectorAll<HTMLAnchorElement>('[role="tab"]')[index - 1];
      prevTab?.focus();
      prevTab?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
    } else if (e.key === "Home") {
      e.preventDefault();
      const firstTab = scrollRef.current?.querySelector<HTMLAnchorElement>('[role="tab"]');
      firstTab?.focus();
      firstTab?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
    } else if (e.key === "End") {
      e.preventDefault();
      const all = scrollRef.current?.querySelectorAll<HTMLAnchorElement>('[role="tab"]');
      const lastTab = all?.[all.length - 1];
      lastTab?.focus();
      lastTab?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
    }
  };

  return (
    <nav
      className={cn("no-print relative isolate my-1 w-full", className)}
      aria-label="Navigation des étapes du projet"
    >
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-260)}
          className="border-border/70 bg-card/95 text-foreground hover:bg-card focus-visible:ring-primary absolute top-1/2 -left-3 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-md backdrop-blur transition hover:scale-105 focus-visible:ring-2 focus-visible:outline-none"
          aria-label={isEn ? "Scroll tabs left" : "Faire défiler les onglets vers la gauche"}
        >
          <ChevronLeft className="size-5" />
        </button>
      )}

      {/* Fade masks */}
      <div
        className={cn(
          "from-background pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r to-transparent transition-opacity duration-200",
          canScrollLeft ? "opacity-100" : "opacity-0",
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          "from-background pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l to-transparent transition-opacity duration-200",
          canScrollRight ? "opacity-100" : "opacity-0",
        )}
        aria-hidden="true"
      />

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(260)}
          className="border-border/70 bg-card/95 text-foreground hover:bg-card focus-visible:ring-primary absolute top-1/2 -right-3 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-md backdrop-blur transition hover:scale-105 focus-visible:ring-2 focus-visible:outline-none"
          aria-label={isEn ? "Scroll tabs right" : "Faire défiler les onglets vers la droite"}
        >
          <ChevronRight className="size-5" />
        </button>
      )}

      {/* Horizontally scrollable row with snap */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        role="tablist"
        aria-orientation="horizontal"
        className="flex w-full snap-x snap-mandatory scrollbar-none items-stretch gap-3 overflow-x-auto px-1 py-2.5 focus:outline-none"
      >
        {PROJECT_TABS_CONFIG.map((tab, index) => {
          const href = `${base}${tab.path}`;
          const active = tab.path ? pathname.startsWith(href) : pathname === base;
          const done = Boolean(tab.progressKey && project?.progress[tab.progressKey]);
          const Icon = tab.icon;
          const label = isEn ? tab.labelEn : tab.labelFr;
          const subtitle = isEn ? tab.subtitleEn : tab.subtitleFr;

          return (
            <Link
              key={tab.id}
              href={href}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "group focus-visible:ring-primary relative flex w-[215px] shrink-0 snap-start flex-col justify-between rounded-2xl p-3.5 transition-all duration-300 select-none focus-visible:ring-2 focus-visible:outline-none sm:w-[235px]",
                active
                  ? "-translate-y-1 scale-[1.01] bg-[#0B6B4F] text-white shadow-lg ring-2 shadow-emerald-950/20 ring-[#0B6B4F]/40"
                  : "glow-card glow-card-3d border-border/80 bg-card text-card-foreground hover:border-primary/40 border shadow-2xs hover:-translate-y-1 hover:shadow-md",
              )}
            >
              {/* Top row: Icon + Status badge */}
              <div className="flex items-start justify-between gap-2">
                {/* Large Canva-style Icon with unique gradient */}
                <div
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl bg-gradient-to-br transition-all duration-300 group-hover:scale-110 group-hover:rotate-2",
                    tab.gradient,
                    active && "ring-2 ring-white/30",
                  )}
                >
                  <Icon className="size-5 stroke-[1.85] text-white" aria-hidden="true" />
                </div>

                {/* Progress Status Pill */}
                <div className="flex items-center">
                  {done ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
                        active
                          ? "bg-white/20 text-white"
                          : "border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                      )}
                    >
                      <Check className="size-3 stroke-[2.5]" aria-hidden="true" />
                      <span>{isEn ? "Done" : "Terminé"}</span>
                    </span>
                  ) : active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                      <CircleDot className="size-3 animate-pulse" aria-hidden="true" />
                      <span>{isEn ? "In progress" : "En cours"}</span>
                    </span>
                  ) : (
                    <span className="bg-muted/60 text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
                      <Circle className="size-2.5 opacity-60" aria-hidden="true" />
                      <span>{isEn ? "To do" : "À faire"}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom row: Title + Subtitle */}
              <div className="mt-3.5 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-sm font-bold tracking-tight transition-colors",
                      active ? "text-white" : "text-foreground group-hover:text-primary",
                    )}
                  >
                    {label}
                  </span>
                </div>
                <p
                  className={cn(
                    "truncate text-[11px] leading-tight transition-colors",
                    active ? "text-white/80" : "text-muted-foreground group-hover:text-foreground/80",
                  )}
                  title={subtitle}
                >
                  {subtitle}
                </p>
              </div>

              {/* Active Indicator Glow Underline */}
              {active && (
                <div
                  className="absolute right-4 -bottom-1 left-4 h-1 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
