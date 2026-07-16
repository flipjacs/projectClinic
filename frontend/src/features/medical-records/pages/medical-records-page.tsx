import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatient } from "@/features/patients/hooks/use-patients";
import { toApiError } from "@/lib/api";
import { MedicalRecordEmptyState } from "../components/medical-record-empty-state";
import { MedicalRecordTimeline } from "../components/medical-record-timeline";
import { useMedicalRecords } from "../hooks/use-medical-records";

const PAGE_SIZE = 20;

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}

export function MedicalRecordsPage() {
  const navigate = useNavigate();
  const { patientId: patientIdParam } = useParams();
  const patientId = Number(patientIdParam);

  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);

  const patientQuery = usePatient(patientId);
  const { data, isLoading, isError, error, isFetching, refetch } = useMedicalRecords({
    patientId,
    includeInactive,
    page,
    pageSize: PAGE_SIZE,
  });

  const patientName = patientQuery.data?.name;
  const totalPages = data?.meta.total_pages ?? 0;
  const total = data?.meta.total ?? 0;

  function goToPatient() {
    navigate(`/patients/${patientId}`);
  }

  return (
    <>
      <PageHeader
        title="Histórico odontológico"
        description={
          patientName
            ? `Atendimentos clínicos de ${patientName}.`
            : "Atendimentos clínicos do paciente."
        }
        actions={
          <>
            <Button variant="ghost" onClick={goToPatient}>
              <ArrowLeft className="h-4 w-4" />
              Voltar ao paciente
            </Button>
            <Button
              onClick={() => navigate(`/patients/${patientId}/medical-records/new`)}
            >
              <Plus className="h-4 w-4" />
              Novo registro clínico
            </Button>
          </>
        }
      />

      <div className="mb-4 flex items-center justify-between">
        <Checkbox
          label="Incluir inativados"
          checked={includeInactive}
          onChange={(e) => {
            setIncludeInactive(e.target.checked);
            setPage(1);
          }}
        />
        {total > 0 && (
          <span className="text-sm text-ink-mute">
            {total} registro(s){isFetching ? " · atualizando…" : ""}
          </span>
        )}
      </div>

      {isLoading ? (
        <TimelineSkeleton />
      ) : isError ? (
        <ErrorState
          title={
            toApiError(error).status === 403
              ? "Acesso restrito"
              : "Não foi possível carregar os dados"
          }
          message={toApiError(error).message}
          onRetry={toApiError(error).status === 403 ? undefined : () => refetch()}
        />
      ) : !data || data.items.length === 0 ? (
        <MedicalRecordEmptyState
          canCreate
          onCreate={() => navigate(`/patients/${patientId}/medical-records/new`)}
        />
      ) : (
        <>
          <MedicalRecordTimeline
            records={data.items}
            onOpen={(id) => navigate(`/medical-records/${id}`)}
          />

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-end gap-2 text-sm text-ink-mute">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="px-1">
                {page} / {Math.max(totalPages, 1)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
