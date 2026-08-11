import { cn } from "@/lib/utils";

const palettes = [
  "bg-erp-light/35 text-erp-dark",
  "bg-[#d8f3e4] text-erp-dark",
  "bg-erp/20 text-erp-dark",
  "bg-[#e4f6ec] text-[#1f6f5f]",
  "bg-[#cfe3da] text-erp-dark",
  "bg-erp-soft text-erp-dark",
] as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function paletteFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % palettes.length;
  }
  return palettes[hash];
}

type EntityAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "size-8 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-12 text-sm",
} as const;

export function EntityAvatar({
  name,
  imageUrl,
  size = "md",
  className,
}: EntityAvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn(
          "shrink-0 rounded-full object-cover ring-1 ring-slate-200",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-black/5",
        sizeClasses[size],
        paletteFor(name),
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
