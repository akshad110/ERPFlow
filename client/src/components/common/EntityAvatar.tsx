import { cn } from "@/lib/utils";

const palettes = [
  "bg-teal-100 text-teal-800",
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-emerald-100 text-emerald-800",
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
