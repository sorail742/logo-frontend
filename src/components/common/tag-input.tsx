"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Saisie d'étiquettes (valeurs, mots à inclure ou à éviter) : `max` étiquettes de `maxLength` caractères. */
export function TagInput({
  id,
  value,
  onChange,
  placeholder,
  max = 10,
  maxLength = 40,
}: Readonly<{
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  max?: number;
  maxLength?: number;
}>) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const tag = draft.trim().replace(/,$/, "").slice(0, maxLength);
    if (tag && !value.includes(tag) && value.length < max) onChange([...value, tag]);
    setDraft("");
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add();
    } else if (event.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };
  return (
    <div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-lg border border-input px-1.5 py-1 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`× ${tag}`}
            className="rounded hover:text-destructive"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <Input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        maxLength={maxLength}
        readOnly={value.length >= max}
        placeholder={value.length ? "" : placeholder}
        className="h-6 min-w-24 flex-1 border-0 px-1 shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
