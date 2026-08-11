import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export type RowAction = {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  separatorBefore?: boolean;
};

type RowActionsMenuProps = {
  actions: RowAction[];
};

export function RowActionsMenu({ actions }: RowActionsMenuProps) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 outline-none hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-erp/30"
        aria-label="Open row actions"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44 rounded-xl">
        {actions.map((action) => (
          <div key={action.label}>
            {action.separatorBefore ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              variant={action.destructive ? "destructive" : "default"}
              onClick={action.onSelect}
            >
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
