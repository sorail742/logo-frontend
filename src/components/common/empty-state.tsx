import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="premium-panel flex flex-col items-center justify-center rounded-2xl border-dashed px-6 py-14 text-center">
      <div className="bg-accent text-accent-foreground mb-3 rounded-full p-3">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <p className="font-medium">{title}</p>
      {description && <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
