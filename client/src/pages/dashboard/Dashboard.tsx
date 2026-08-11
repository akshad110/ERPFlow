import { ClipboardList, Package, TriangleAlert, Users } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuth } from "@/hooks/useAuth";

const cards = [
  {
    label: "Customers",
    hint: "CRM records & follow-ups",
    icon: Users,
  },
  {
    label: "Products",
    hint: "Catalog and warehouse stock",
    icon: Package,
  },
  {
    label: "Low stock",
    hint: "Items below alert level",
    icon: TriangleAlert,
  },
  {
    label: "Challans",
    hint: "Draft and confirmed issues",
    icon: ClipboardList,
  },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title={`Hello, ${user?.name?.split(" ")[0] ?? "there"}`}
        description="Overview of your operations workspace. Live stats arrive in the next phase."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
                    —
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
                </div>
                <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
                  <Icon className="size-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">
        Modules are connected to the layout. Customer, product and challan
        screens will be filled in the next frontend phases.
      </div>
    </div>
  );
}
