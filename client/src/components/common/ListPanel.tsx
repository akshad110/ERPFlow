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
        "surface-panel relative overflow-hidden rounded-2xl",
        dimmed && "opacity-60",
        className
      )}
    >
      {dimmed ? (
        <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-erp-light/40">
          <div className="h-full w-1/3 animate-pulse bg-erp-dark" />
        </div>
      ) : null}
      {toolbar ? (
        <div className="flex flex-col gap-3 border-b border-[#b7d9cb]/70 bg-[#eaf7f1]/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {toolbar}
        </div>
      ) : null}
      <div className="bg-[#f7fcf9]/80">{children}</div>
      {footer ? (
        <div className="flex items-center justify-between border-t border-[#b7d9cb]/70 bg-[#eaf7f1]/60 px-4 py-3 text-sm text-[#45685f]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
