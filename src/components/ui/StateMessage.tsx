import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Centered icon + title + text + actions, used for empty/error/not-found states. */
export function StateMessage({
  icon: Icon,
  title,
  children,
  actions,
  tone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  tone?: "neutral" | "danger";
}) {
  return (
    <div className="card mx-auto flex max-w-lg flex-col items-center px-6 py-12 text-center animate-fade-in">
      <span
        className={cn(
          "mb-4 grid size-14 place-items-center rounded-full",
          tone === "danger" ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand",
        )}
      >
        <Icon className="size-7" aria-hidden />
      </span>
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      {children && <div className="mt-2 text-[15px] text-muted">{children}</div>}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
