import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ListPanelProps = {
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  dimmed?: boolean;
};

export function ListPanel({
  toolbar,
  footer,
  children,
  className,
  dimmed,
}: ListPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        dimmed && "opacity-60",
        className
      )}
    >
      {dimmed ? (
        <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-slate-100">
          <div className="h-full w-1/3 animate-pulse bg-teal-600" />
        </div>
      ) : null}
      {toolbar ? (
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {toolbar}
        </div>
      ) : null}
      {children}
      {footer ? (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
