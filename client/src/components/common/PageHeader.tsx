import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-5 space-y-3", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="flex flex-wrap items-center gap-1 text-xs text-[#5b736c]">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                {index > 0 ? <ChevronRight className="size-3.5" /> : null}
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="font-medium text-[#45685f] hover:text-erp-dark"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? "font-medium text-erp-ink" : undefined}>
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-erp-ink sm:text-2xl">
              {title}
            </h1>
            {meta}
          </div>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-[#45685f]">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
