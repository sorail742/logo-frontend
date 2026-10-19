import { cn } from "@/lib/utils";

/** Logo provisoire de la plateforme (le nom définitif reste à choisir, §15.4). */
export function PlatformLogo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <path d="M9 22V10l7 7 7-7v12" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="24" r="3" className="fill-brand-accent" />
      </svg>
      {withText && <span className="text-lg">Marka</span>}
    </span>
  );
}
