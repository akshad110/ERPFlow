import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#2fa084]/40 bg-[#eaf7f1]/80 px-6 py-14 text-center",
        className
      )}
    >
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-erp-light/40 text-erp-dark">
        <Icon className="size-5" />
      </div>
      <h3 className="text-sm font-semibold text-erp-ink">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-[#45685f]">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
