import { ArrowRight, FileText, Plus, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROLES } from "@/types/roles";
import { FinanceSummaryCards } from "../components/finance-summary-cards";
import { PaymentsTable } from "../components/payments-table";
import { usePendingPayments } from "../hooks/use-finance";

function QuickLink({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Card variant="interactive" onClick={onClick} className="cursor-pointer">
      <CardBody className="flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-600 ring-1 ring-inset ring-gold-100">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <p className="text-sm text-ink-mute">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-ink-mute" aria-hidden />
      </CardBody>
    </Card>
  );
}

export function FinancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isClinical = user?.role === ROLES.ADMIN || user?.role === ROLES.DENTIST;

  const pending = usePendingPayments({ page: 1, pageSize: 8 });

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Resumo, orçamentos e pagamentos da clínica."
        actions={
          <>
            {isClinical && (
              <Button variant="secondary" onClick={() => navigate("/budgets/new")}>
                <FileText className="h-4 w-4" />
                Novo orçamento
              </Button>
            )}
            <Button onClick={() => navigate("/payments/new")}>
              <Plus className="h-4 w-4" />
              Registrar pagamento
            </Button>
          </>
        }
      />

      {isClinical && (
        <div className="mb-8">
          <FinanceSummaryCards />
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <QuickLink
          icon={FileText}
          title="Orçamentos"
          description="Monte e acompanhe orçamentos dos pacientes."
          onClick={() => navigate("/budgets")}
        />
        <QuickLink
          icon={Receipt}
          title="Pagamentos"
          description="Registre e consulte os pagamentos."
          onClick={() => navigate("/payments")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos pendentes</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/payments")}>
            Ver pagamentos
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          {pending.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : pending.isError ? (
            <div className="p-5">
              <ErrorState onRetry={() => pending.refetch()} />
            </div>
          ) : !pending.data || pending.data.items.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Nenhum pagamento pendente"
                description="As pendências de pagamento aparecem aqui."
              />
            </div>
          ) : (
            <PaymentsTable payments={pending.data.items} />
          )}
        </CardBody>
      </Card>
    </>
  );
}
