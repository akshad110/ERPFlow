import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type NativeSelectProps = ComponentProps<"select">;

export function NativeSelect({ className, children, ...props }: NativeSelectProps) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-xl border border-[#b7d9cb] bg-[#f4fbf7] px-2.5 text-sm text-erp-ink shadow-xs outline-none focus-visible:border-erp focus-visible:ring-3 focus-visible:ring-erp/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
