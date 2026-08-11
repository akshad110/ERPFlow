import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
};

export function LoadingState({
  label = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-slate-500",
        className
      )}
    >
      <Loader2 className="size-5 animate-spin text-teal-700" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
