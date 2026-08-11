import { cn } from "@/lib/utils";

type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
  className?: string;
};

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/70",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  danger: "bg-red-50 text-red-700 ring-1 ring-red-100",
  info: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
};

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        toneClasses[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
