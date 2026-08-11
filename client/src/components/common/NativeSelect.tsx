import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type NativeSelectProps = ComponentProps<"select">;

export function NativeSelect({ className, children, ...props }: NativeSelectProps) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800 shadow-xs outline-none focus-visible:border-teal-600 focus-visible:ring-3 focus-visible:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
