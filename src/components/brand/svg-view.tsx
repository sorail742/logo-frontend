import { cn } from "@/lib/utils";

/**
 * Affiche un SVG produit par le moteur de rendu interne (textes échappés)
 * ou nettoyé par sanitizeSvg. Ne jamais y passer un SVG brut venant d'un utilisateur.
 */
export function SvgView({ svg, className, label }: { svg: string; className?: string; label?: string }) {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn("svg-fit flex items-center justify-center", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
