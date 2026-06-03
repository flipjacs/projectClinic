import { ArrowRight, FileText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

/**
 * Entrada do menu "Prontuários". O prontuário é organizado por paciente, então
 * aqui guiamos o usuário a localizar a pessoa para abrir o histórico clínico.
 */
export function MedicalRecordsHubPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Prontuários"
        description="O histórico odontológico é organizado por paciente."
      />
      <Card>
        <CardBody className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-600 ring-1 ring-inset ring-gold-100">
              <FileText className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">
                Abra o prontuário a partir do paciente
              </h2>
              <p className="mt-1 max-w-xl text-sm text-ink-mute">
                Localize o paciente e acesse o histórico odontológico completo, com
                queixa principal, diagnóstico, procedimentos e evolução clínica.
              </p>
            </div>
          </div>
          <Button onClick={() => navigate("/patients")} className="shrink-0">
            <Search className="h-4 w-4" />
            Buscar paciente
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardBody>
      </Card>
    </>
  );
}
