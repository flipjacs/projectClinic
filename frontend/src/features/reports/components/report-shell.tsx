import { Download } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ExportDialog } from "./export-dialog";
import { PeriodSelector } from "./period-selector";
import { ReportTabs } from "./report-tabs";

interface ReportShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

/**
 * Moldura comum das telas de relatório: cabeçalho com seletor de período e
 * exportação, seguido das abas de navegação. Centraliza o "chrome" gerencial.
 */
export function ReportShell({ title, description, children }: ReportShellProps) {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-mute">{description}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <PeriodSelector />
          <Button variant="secondary" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <ReportTabs />

      {children}

      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  );
}
