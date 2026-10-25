"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// Champs compacts de l'inspecteur : valeur numérique réglable en glissant son libellé,
// curseur avec valeur, groupe de boutons et section repliable.

const round = (value: number, precision: number) => Math.round(value * 10 ** precision) / 10 ** precision;

export interface NumberFieldProps {
  label: ReactNode;
  value: number;
  onChange(value: number): void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  suffix?: string;
  title?: string;
  className?: string;
  disabled?: boolean;
}

export function NumberField({ label, value, onChange, min = -Infinity, max = Infinity, step = 1, precision = 0, suffix, title, className, disabled }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const shown = draft ?? String(round(value, precision));

  const commit = () => {
    if (draft === null) return;
    const parsed = Number(draft.replace(",", ".").replace(/[^\d.+-]/g, ""));
    if (Number.isFinite(parsed)) onChange(clamp(parsed));
    setDraft(null);
  };

  return (
    <label className={cn("flex h-8 items-center rounded-lg border border-input bg-transparent text-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50", disabled && "opacity-50", className)} title={title}>
      <span
        className="flex h-full min-w-7 cursor-ew-resize items-center justify-center px-1.5 text-[11px] text-muted-foreground select-none"
        onPointerDown={(event) => {
          if (disabled) return;
          event.preventDefault();
          const startX = event.clientX;
          const start = value;
          const target = event.currentTarget;
          target.setPointerCapture(event.pointerId);
          const move = (e: PointerEvent) => {
            const factor = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
            onChange(clamp(round(start + Math.round((e.clientX - startX) / 2) * step * factor, precision)));
          };
          const up = () => {
            target.removeEventListener("pointermove", move);
            target.removeEventListener("pointerup", up);
          };
          target.addEventListener("pointermove", move);
          target.addEventListener("pointerup", up);
        }}
      >
        {label}
      </span>
      <input
        value={shown}
        disabled={disabled}
        inputMode="decimal"
        onChange={(event) => setDraft(event.target.value)}
        onFocus={(event) => event.target.select()}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") (event.target as HTMLInputElement).blur();
          if (event.key === "Escape") {
            setDraft(null);
            (event.target as HTMLInputElement).blur();
          }
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            const delta = (event.key === "ArrowUp" ? 1 : -1) * step * (event.shiftKey ? 10 : 1);
            setDraft(null);
            onChange(clamp(round(value + delta, precision)));
          }
        }}
        className="h-full w-full min-w-0 bg-transparent pr-1 text-right tabular-nums outline-none"
      />
      {suffix && <span className="pr-2 text-[11px] text-muted-foreground">{suffix}</span>}
    </label>
  );
}

const toText = (value: number) => String(value);

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format = toText,
  onReset,
  resetValue = 0,
  resetLabel,
}: Readonly<{
  label: ReactNode;
  value: number;
  onChange(value: number): void;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  /** Réinitialisation : la valeur affichée devient un bouton tant qu'elle diffère de `resetValue`. */
  onReset?: () => void;
  resetValue?: number;
  resetLabel?: string;
}>) {
  const resettable = onReset && value !== resetValue;
  return (
    <div className="grid grid-cols-[5.5rem_1fr_2.75rem] items-center gap-2">
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(Array.isArray(v) ? v[0]! : (v as number))} aria-label={typeof label === "string" ? label : undefined} />
      {resettable ? (
        <button type="button" onClick={onReset} className="rounded text-right text-[11px] tabular-nums underline decoration-dotted underline-offset-2 hover:text-primary" title={resetLabel} aria-label={resetLabel ? `${resetLabel} (${format(value)})` : undefined}>
          {format(value)}
        </button>
      ) : (
        <span className="text-right text-[11px] tabular-nums">{format(value)}</span>
      )}
    </div>
  );
}

export function ToggleButtons<T extends string>({
  value,
  options,
  onChange,
  label,
}: Readonly<{
  value: T | null;
  options: { value: T; label: string; icon: ReactNode }[];
  onChange(value: T): void;
  label: string;
}>) {
  return (
    <fieldset className="flex rounded-lg border border-input p-0.5">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          aria-label={option.label}
          title={option.label}
          className={cn(
            "flex h-6 flex-1 items-center justify-center rounded-md transition [&_svg]:size-3.5",
            value === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {option.icon}
        </button>
      ))}
    </fieldset>
  );
}

export function Section({ title, children, action, defaultOpen = true }: Readonly<{ title: string; children: ReactNode; action?: ReactNode; defaultOpen?: boolean }>) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b px-4 py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs font-semibold tracking-wide text-foreground uppercase" aria-expanded={open}>
          <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} aria-hidden="true" />
          {title}
        </button>
        {action}
      </div>
      {open && <div className="mt-3 grid gap-2.5">{children}</div>}
    </section>
  );
}
