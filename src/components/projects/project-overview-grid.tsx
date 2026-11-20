"use client";

import { useLocale } from "next-intl";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  CircleDot,
  FileText,
  Palette,
  Pen,
  Shapes,
  Shirt,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { LogoPreview } from "@/components/brand/logo-preview";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

interface ToolModule {
  id: string;
  href: string;
  titleFr: string;
  titleEn: string;
  taglineFr: string;
  taglineEn: string;
  descriptionFr: string;
  descriptionEn: string;
  icon: typeof Shapes;
  gradient: string;
  accent: string;
  isDone: boolean;
  isInProgress?: boolean;
}

export function ProjectOverviewGrid({
  pid,
  project,
  designsCount = 0,
  canEdit = true,
}: Readonly<{
  pid: string;
  project: Project;
  designsCount?: number;
  canEdit?: boolean;
}>) {
  const locale = useLocale();
  const isEn = locale.startsWith("en");
  const p = project.progress;

  const modules: ToolModule[] = [
    {
      id: "brief",
      href: `/app/projets/${pid}/brief`,
      titleFr: "Brief & Positionnement",
      titleEn: "Brief & Strategy",
      taglineFr: "Fondations de marque",
      taglineEn: "Brand foundations",
      descriptionFr: "Définissez les valeurs, l'audience cible et le ton stratégique de votre projet.",
      descriptionEn: "Define brand values, target audience and strategic tone.",
      icon: FileText,
      gradient: "from-amber-500 via-orange-500 to-amber-600",
      accent: "#f59e0b",
      isDone: Boolean(p.brief),
      isInProgress: !p.brief,
    },
    {
      id: "names",
      href: `/app/projets/${pid}/noms`,
      titleFr: "Nom de Marque",
      titleEn: "Brand Name",
      taglineFr: "Génération par IA",
      taglineEn: "AI Name Generator",
      descriptionFr: "10 idées vérifiées avec disponibilité de noms de domaine et réseaux sociaux.",
      descriptionEn: "10 verified ideas with real domain name and social handles availability.",
      icon: Sparkles,
      gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
      accent: "#8b5cf6",
      isDone: Boolean(p.name),
      isInProgress: p.brief && !p.name,
    },
    {
      id: "logos",
      href: `/app/projets/${pid}/logos`,
      titleFr: "Logo & Emblème",
      titleEn: "Logo & Mark",
      taglineFr: "Identité vectorielle",
      taglineEn: "Vector identity",
      descriptionFr: "Générez et retouchez votre logo avec déclinaisons couleur, blanche et monochrome.",
      descriptionEn: "Generate and fine-tune your logo with color, white and monochrome variants.",
      icon: Shapes,
      gradient: "from-amber-400 via-orange-500 to-rose-500",
      accent: "#f97316",
      isDone: Boolean(p.logo),
      isInProgress: p.name && !p.logo,
    },
    {
      id: "signatures",
      href: `/app/projets/${pid}/signatures`,
      titleFr: "Signatures & Tampons",
      titleEn: "Signatures & Stamps",
      taglineFr: "Papeterie & E-mail",
      taglineEn: "Stationery & Email",
      descriptionFr: "Signatures HTML compatibles Gmail/Outlook et cachets d'entreprise officiels.",
      descriptionEn: "HTML email signatures for Gmail/Outlook and corporate wax seal stamps.",
      icon: Pen,
      gradient: "from-sky-400 via-blue-500 to-indigo-600",
      accent: "#0284c7",
      isDone: Boolean(p.signatures),
      isInProgress: p.logo && !p.signatures,
    },
    {
      id: "kit",
      href: `/app/projets/${pid}/kit`,
      titleFr: "Kit de Marque & Charte",
      titleEn: "Brand Kit & Guide",
      taglineFr: "Assets & Nuancier",
      taglineEn: "Assets & Palette",
      descriptionFr:
        "Palette chromatique (HEX, CMJN, Pantone), polices typographiques et exports haute définition.",
      descriptionEn: "Calibrated color palette (HEX, CMYK), typography fonts and HD asset exports.",
      icon: Palette,
      gradient: "from-emerald-400 via-teal-500 to-emerald-600",
      accent: "#0d6e5f",
      isDone: Boolean(p.kit),
      isInProgress: p.signatures && !p.kit,
    },
    {
      id: "studio",
      href: `/app/projets/${pid}/studio`,
      titleFr: "Studio Créatif",
      titleEn: "Creative Studio",
      taglineFr: "Visuels & Réseaux",
      taglineEn: "Visuals & Social",
      descriptionFr:
        "Concevez des posts Instagram, flyers, cartes de visite et bannières aux couleurs de la marque.",
      descriptionEn: "Design Instagram posts, flyers, business cards and banners with your brand kit.",
      icon: Wand2,
      gradient: "from-pink-500 via-rose-500 to-rose-600",
      accent: "#ec4899",
      isDone: designsCount > 0,
      isInProgress: p.kit && designsCount === 0,
    },
    {
      id: "textile",
      href: `/app/projets/${pid}/textile`,
      titleFr: "Atelier Textile & DTF",
      titleEn: "Textile Studio & Merch",
      taglineFr: "Maillots & Flocages",
      taglineEn: "Jerseys & Heat Press",
      descriptionFr:
        "Personnalisez maillots de football, polos et t-shirts avec respect des règlements sportifs.",
      descriptionEn: "Customize soccer jerseys, polos and tees with sports rules compliance and BAT proof.",
      icon: Shirt,
      gradient: "from-teal-400 via-emerald-500 to-green-600",
      accent: "#0f766e",
      isDone: Boolean(p.kit),
      isInProgress: false,
    },
  ];

  // Calcul du taux d'avancement
  const totalCompleted = modules.filter((m) => m.isDone).length;
  const progressPercent = Math.round((totalCompleted / modules.length) * 100);
  const nextRecommended = modules.find((m) => !m.isDone) ?? modules[0];

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. BANNIÈRE PROGRESSION GLOBALE (Façon Tableau Canva)     */}
      {/* ======================================================== */}
      <section className="glow-card border-border/70 from-card via-card to-muted/40 relative isolate overflow-hidden rounded-3xl border bg-gradient-to-br p-6 shadow-sm">
        <div
          className="bg-primary/10 absolute -top-24 -right-16 -z-10 size-72 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-20 left-1/3 -z-10 size-60 rounded-full bg-amber-400/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-lg">
                <Zap className="fill-primary size-3.5" />
              </span>
              <span className="text-primary text-xs font-bold tracking-wider uppercase">
                {isEn ? "Brand Creation Progress" : "Progression de la Marque"}
              </span>
              <Badge variant="secondary" className="font-mono text-xs font-bold">
                {progressPercent}%
              </Badge>
            </div>

            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              {isEn
                ? `${totalCompleted} of ${modules.length} modules completed`
                : `${totalCompleted} sur ${modules.length} étapes terminées`}
            </h2>

            <p className="text-muted-foreground max-w-2xl text-xs leading-relaxed sm:text-sm">
              {isEn
                ? "Complete each milestone to build an international-grade brand identity, from naming to custom apparel and online presence."
                : "Complétez chaque étape pour bâtir une identité de niveau international : nom, logo, charte graphique, maillots confectionnés et vitrine web."}
            </p>
          </div>

          {/* Action Suivante Recommandée */}
          {nextRecommended && canEdit && (
            <Link
              href={nextRecommended.href}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#0D6E5F] px-5 py-3 text-xs font-bold text-white shadow-md shadow-emerald-950/20 transition-all hover:scale-102 hover:bg-[#0A584C]"
            >
              <span>
                {isEn ? "Continue next step:" : "Prochaine étape :"}{" "}
                {isEn ? nextRecommended.titleEn : nextRecommended.titleFr}
              </span>
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>

        {/* Barre de Progression Visuelle */}
        <div className="mt-5 space-y-2">
          <div className="bg-muted/80 relative h-2.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0D6E5F] via-emerald-400 to-teal-400 shadow-[0_0_12px_rgba(13,110,95,0.4)] transition-all duration-700 ease-out"
              style={{ width: `${Math.max(6, progressPercent)}%` }}
            />
          </div>

          {/* Raccourcis Actions Rapides */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-muted-foreground font-medium">
              {isEn ? "Quick actions:" : "Actions rapides :"}
            </span>
            <Link
              href={`/app/projets/${pid}/noms`}
              className="border-border/80 bg-background/80 text-foreground hover:border-primary/40 hover:bg-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition"
            >
              <Sparkles className="size-3 text-purple-500" />
              <span>{isEn ? "Generate name" : "Générer un nom"}</span>
            </Link>
            <Link
              href={`/app/projets/${pid}/logos`}
              className="border-border/80 bg-background/80 text-foreground hover:border-primary/40 hover:bg-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition"
            >
              <Shapes className="size-3 text-orange-500" />
              <span>{isEn ? "Create logo" : "Créer un logo"}</span>
            </Link>
            <Link
              href={`/app/projets/${pid}/textile`}
              className="border-border/80 bg-background/80 text-foreground hover:border-primary/40 hover:bg-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition"
            >
              <Shirt className="size-3 text-teal-600" />
              <span>{isEn ? "Design jersey" : "Concevoir un maillot"}</span>
            </Link>
            <Link
              href={`/app/projets/${pid}/studio`}
              className="border-border/80 bg-background/80 text-foreground hover:border-primary/40 hover:bg-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition"
            >
              <Wand2 className="size-3 text-pink-500" />
              <span>{isEn ? "Open Studio" : "Ouvrir le Studio"}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. GRILLE DE GRANDES CARTES (Canva-Style Dashboard)       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const title = isEn ? mod.titleEn : mod.titleFr;
          const tagline = isEn ? mod.taglineEn : mod.taglineFr;
          const description = isEn ? mod.descriptionEn : mod.descriptionFr;

          return (
            <div
              key={mod.id}
              className="glow-card glow-card-3d glow-card-shimmer group border-border/80 bg-card hover:border-primary/50 relative flex flex-col justify-between overflow-hidden rounded-3xl border p-5 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
            >
              {/* Mockup Visuel / Illustration de la Carte */}
              <div className="border-border/50 bg-muted/40 relative mb-4 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-2xl border p-3">
                {/* Visualisation Spécifique selon le module */}
                {mod.id === "logos" && project.previewSpec ? (
                  <LogoPreview
                    spec={project.previewSpec}
                    className="h-full w-full bg-transparent p-2 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : mod.id === "logos" ? (
                  <div className="flex flex-col items-center justify-center gap-1 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 text-white shadow-md">
                      <Shapes className="size-7" />
                    </div>
                    <span className="text-foreground mt-1 text-xs font-bold tracking-wider uppercase">
                      {project.chosenName?.value ?? project.title}
                    </span>
                  </div>
                ) : mod.id === "textile" ? (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="relative flex size-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-400">
                      <Shirt className="size-8" />
                      <span className="absolute right-1 bottom-1 size-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>
                    <span className="text-muted-foreground font-mono text-[10px]">DTF & Flocage Pro</span>
                  </div>
                ) : mod.id === "signatures" ? (
                  <div className="border-border/60 bg-card w-full max-w-[170px] rounded-lg border p-2.5 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-full bg-blue-500/20 text-[9px] font-bold text-blue-700">
                        M
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="bg-foreground/60 h-2 w-16 rounded" />
                        <div className="bg-muted mt-0.5 h-1.5 w-24 rounded" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t pt-1">
                      <span className="font-mono text-[8px] text-sky-600">Certifié Marka</span>
                      <span className="size-2 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                ) : mod.id === "kit" ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex -space-x-1.5">
                      <span className="border-card size-7 rounded-full border-2 bg-[#0D6E5F] shadow-xs" />
                      <span className="border-card size-7 rounded-full border-2 bg-amber-400 shadow-xs" />
                      <span className="border-card size-7 rounded-full border-2 bg-slate-900 shadow-xs" />
                    </div>
                    <span className="text-muted-foreground font-mono text-[10px]">HEX · RGB · CMJN</span>
                  </div>
                ) : mod.id === "names" ? (
                  <div className="space-y-1 text-center">
                    <span className="text-foreground text-sm font-extrabold tracking-tight">
                      {project.chosenName?.value ?? "NOVATECH"}
                    </span>
                    <div className="flex items-center justify-center gap-1 font-mono text-[9px] text-emerald-600">
                      <CheckCircle2 className="size-3" /> .com disponible
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 text-center">
                    <div
                      className={cn(
                        "flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm",
                        mod.gradient,
                      )}
                    >
                      <Icon className="size-6" />
                    </div>
                    <span className="text-muted-foreground text-[10px] font-medium">{tagline}</span>
                  </div>
                )}

                {/* Badge Statut en haut à droite du mockup */}
                <div className="absolute top-2 right-2">
                  {mod.isDone ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 backdrop-blur dark:text-emerald-400">
                      <Check className="size-3 stroke-[2.5]" />
                      <span>{isEn ? "Done" : "Terminé"}</span>
                    </span>
                  ) : mod.isInProgress ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 backdrop-blur dark:text-amber-400">
                      <CircleDot className="size-3 animate-pulse" />
                      <span>{isEn ? "In progress" : "En cours"}</span>
                    </span>
                  ) : (
                    <span className="bg-card/85 text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shadow-xs backdrop-blur">
                      <Circle className="size-2.5 opacity-60" />
                      <span>{isEn ? "To do" : "À faire"}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Contenu Texte de la Carte */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-xs",
                      mod.gradient,
                    )}
                  >
                    <Icon className="size-3.5 stroke-[2]" />
                  </span>
                  <h3 className="text-foreground group-hover:text-primary text-sm font-bold tracking-tight transition-colors">
                    {title}
                  </h3>
                </div>

                <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">{description}</p>
              </div>

              {/* Bouton d'Action */}
              <div className="border-border/60 mt-4 border-t pt-3">
                <Link
                  href={mod.href}
                  className={cn(
                    "inline-flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition-all",
                    mod.isDone
                      ? "border-border/80 bg-background hover:bg-muted text-foreground border"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs",
                  )}
                >
                  <span>
                    {mod.isDone
                      ? isEn
                        ? "Edit"
                        : "Modifier"
                      : mod.isInProgress
                        ? isEn
                          ? "Continue"
                          : "Continuer"
                        : isEn
                          ? "Start"
                          : "Commencer"}
                  </span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
