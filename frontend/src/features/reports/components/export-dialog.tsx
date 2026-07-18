import { Check, Download, FileSpreadsheet, FileText, Lock } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { apiErrorDetail, toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";
import { formatDateOnly } from "@/utils/format";
import { downloadReportCsv, type ExportKind } from "../api/reports-api";
import { useReportsPermissions } from "../hooks/use-reports";
import { periodLabel, useReportPeriod } from "../utils/period";

interface ExportOption {
  kind: ExportKind;
  label: string;
  description: string;
  show: boolean;
}

export function ExportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const period = useReportPeriod();
  const { canFinance, canPatients } = useReportsPermissions();

  const options = useMemo<ExportOption[]>(() => {
    const all: ExportOption[] = [
      { kind: "appointments", label: "Consultas", description: "Agenda do período", show: true },
      { kind: "finance", label: "Financeiro", description: "Pagamentos recebidos", show: canFinance },
      { kind: "patients", label: "Pacientes", description: "Cadastros do período", show: canPatients },
      { kind: "inventory", label: "Estoque", description: "Catálogo atual de itens", show: true },
    ];
    return all.filter((o) => o.show);
  }, [canFinance, canPatients]);

  const [kind, setKind] = useState<ExportKind>(options[0]?.kind ?? "appointments");
  const [downloading, setDownloading] = useState(false);

  async function handleExport() {
    setDownloading(true);
    try {
      await downloadReportCsv(kind, { start_date: period.start_date, end_date: period.end_date });
      toast.success("Relatório exportado com sucesso.");
      onClose();
    } catch (error) {
      toast.error(apiErrorDetail(error) ?? toApiError(error).message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Exportar relatório"
      description="Baixe os dados do período selecionado em planilha."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={downloading}>
            Cancelar
          </Button>
          <Button onClick={handleExport} isLoading={downloading}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">Tipo de relatório</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {options.map((opt) => {
              const active = kind === opt.kind;
              return (
                <button
                  key={opt.kind}
                  type="button"
                  onClick={() => setKind(opt.kind)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-start justify-between gap-2 rounded-xl border p-3 text-left transition-colors",
                    active
                      ? "border-gold-300 bg-gold-50"
                      : "border-line bg-surface hover:bg-surface-muted",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{opt.label}</span>
                    <span className="block text-xs text-ink-mute">{opt.description}</span>
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-gold-700" aria-hidden />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">Formato</span>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1 rounded-xl border border-gold-300 bg-gold-50 p-3">
              <FileSpreadsheet className="h-5 w-5 text-gold-700" aria-hidden />
              <span className="text-xs font-medium text-gold-800">CSV</span>
            </div>
            {(["PDF", "Excel"] as const).map((fmt) => (
              <div
                key={fmt}
                className="flex flex-col items-center gap-1 rounded-xl border border-line bg-surface-muted p-3 opacity-70"
                title="Em breve"
              >
                {fmt === "PDF" ? (
                  <FileText className="h-5 w-5 text-ink-mute" aria-hidden />
                ) : (
                  <FileSpreadsheet className="h-5 w-5 text-ink-mute" aria-hidden />
                )}
                <span className="flex items-center gap-1 text-xs text-ink-mute">
                  <Lock className="h-3 w-3" aria-hidden />
                  {fmt}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-mute">
            PDF e Excel serão adicionados em breve.
          </p>
        </div>

        <div className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-ink-soft">
          Período: <span className="font-medium text-ink">{periodLabel(period.preset)}</span>{" "}
          <span className="text-ink-mute">
            ({formatDateOnly(period.start_date)} – {formatDateOnly(period.end_date)})
          </span>
        </div>
      </div>
    </Modal>
  );
}
