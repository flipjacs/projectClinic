import {
  ArrowRight,
  FilePlus2,
  FileText,
  ListChecks,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROLES } from "@/types/roles";

interface QuickAction {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  /** Restrito a perfis clínicos (ADMIN/DENTIST). */
  clinical?: boolean;
}

const ACTIONS: QuickAction[] = [
  {
    icon: FilePlus2,
    title: "Criar orçamento",
    description: "Monte um plano de tratamento.",
    to: "/budgets/new",
    clinical: true,
  },
  {
    icon: Wallet,
    title: "Registrar pagamento",
    description: "Lance um recebimento.",
    to: "/payments/new",
  },
  {
    icon: Receipt,
    title: "Ver pagamentos",
    description: "Acompanhe os recebimentos.",
    to: "/payments",
  },
  {
    icon: FileText,
    title: "Ver orçamentos",
    description: "Consulte os orçamentos.",
    to: "/budgets",
  },
  {
    icon: ListChecks,
    title: "Gerenciar procedimentos",
    description: "Serviços e valores de referência.",
    to: "/procedures",
    clinical: true,
  },
];

export function FinanceQuickActions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isClinical = user?.role === ROLES.ADMIN || user?.role === ROLES.DENTIST;

  const actions = ACTIONS.filter((a) => !a.clinical || isClinical);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map(({ icon: Icon, title, description, to }) => (
        <button
          key={to}
          type="button"
          onClick={() => navigate(to)}
          className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-card transition-all duration-150 ease-out-quint hover:border-gold-200 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-600 ring-1 ring-inset ring-gold-100 transition-colors group-hover:bg-gold-100">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="truncate text-xs text-ink-mute">{description}</p>
          </div>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-ink-mute transition-transform group-hover:translate-x-0.5 group-hover:text-gold-600"
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
}
