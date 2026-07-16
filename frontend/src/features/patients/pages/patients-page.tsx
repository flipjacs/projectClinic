import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Loading } from "@/components/feedback/loading";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useDebounce } from "@/hooks/use-debounce";
import { PatientTable } from "../components/patient-table";
import { usePatientsList } from "../hooks/use-patients";

const PAGE_SIZE = 20;

export function PatientsPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);

  const search = useDebounce(searchInput.trim(), 400);

  const params = useMemo(
    () => ({ search, includeInactive, page, pageSize: PAGE_SIZE }),
    [search, includeInactive, page],
  );

  const { data, isLoading, isError, isFetching, refetch } = usePatientsList(params);

  // Sempre que a busca/filtro muda, volta para a primeira página.
  function onSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  const totalPages = data?.meta.total_pages ?? 0;
  const total = data?.meta.total ?? 0;

  return (
    <>
      <PageHeader
        title="Pacientes"
        description="Cadastro, busca e ficha completa dos pacientes da clínica."
        actions={
          <Button onClick={() => navigate("/patients/new")}>
            <Plus className="h-4 w-4" />
            Novo paciente
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, CPF ou telefone…"
            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus-visible:ring-2 focus-visible:ring-gold-400"
          />
        </div>
        <Checkbox
          label="Incluir inativos"
          checked={includeInactive}
          onChange={(e) => {
            setIncludeInactive(e.target.checked);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <Loading label="Carregando pacientes…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Nenhum paciente encontrado"
          description={
            search
              ? "Tente outro termo de busca."
              : "Cadastre o primeiro paciente para começar."
          }
          action={
            !search ? (
              <Button onClick={() => navigate("/patients/new")}>
                <Plus className="h-4 w-4" />
                Novo paciente
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <PatientTable patients={data.items} onOpen={(id) => navigate(`/patients/${id}`)} />

          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>
              {total} paciente(s){isFetching ? " · atualizando…" : ""}
            </span>
            <div className="flex items-center gap-2">
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
          </div>
        </>
      )}
    </>
  );
}
