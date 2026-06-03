import { FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { SectionTitle } from "@/components/layout/section-title";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROLES } from "@/types/roles";
import { FinanceQuickActions } from "../components/finance-quick-actions";
import { FinanceSummaryCards } from "../components/finance-summary-cards";
import { PaymentsTable } from "../components/payments-table";
import { usePendingPayments } from "../hooks/use-finance";

export function FinancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isClinical = user?.role === ROLES.ADMIN || user?.role === ROLES.DENTIST;

  const pending = usePendingPayments({ page: 1, pageSize: 8 });

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Acompanhe receitas, pendências e movimentações da clínica."
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
        <section className="mb-8">
          <SectionTitle>Resumo financeiro</SectionTitle>
          <FinanceSummaryCards />
        </section>
      )}

      <section className="mb-8">
        <SectionTitle>Ações rápidas</SectionTitle>
        <FinanceQuickActions />
      </section>

      <section>
        <SectionTitle>Movimentações recentes</SectionTitle>
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
                <ErrorState
                  title="Não foi possível carregar as movimentações"
                  onRetry={() => pending.refetch()}
                />
              </div>
            ) : !pending.data || pending.data.items.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="Nenhuma movimentação encontrada"
                  description="As pendências de pagamento aparecem aqui."
                />
              </div>
            ) : (
              <PaymentsTable payments={pending.data.items} />
            )}
          </CardBody>
        </Card>
      </section>
    </>
  );
}
