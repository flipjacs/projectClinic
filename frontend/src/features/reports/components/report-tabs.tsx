import { NavLink, useLocation } from "react-router-dom";

import { cn } from "@/utils/cn";
import { useReportsPermissions } from "../hooks/use-reports";

/** Abas de navegação entre os relatórios, preservando o período (querystring). */
export function ReportTabs() {
  const { search } = useLocation();
  const { canFinance, canPatients } = useReportsPermissions();

  const tabs = [
    { to: "/reports", label: "Visão geral", end: true, show: true },
    { to: "/reports/finance", label: "Financeiro", show: canFinance },
    { to: "/reports/patients", label: "Pacientes", show: canPatients },
    { to: "/reports/appointments", label: "Agenda", show: true },
    { to: "/reports/inventory", label: "Estoque", show: true },
  ].filter((t) => t.show);

  return (
    <nav className="mb-6 -mx-1 overflow-x-auto border-b border-line">
      <ul className="flex min-w-max gap-1 px-1">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={{ pathname: tab.to, search }}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "relative inline-block px-3 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-1",
                  isActive
                    ? "text-ink after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-gold-500"
                    : "text-ink-mute hover:text-ink",
                )
              }
            >
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
