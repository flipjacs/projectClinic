import { FileDown, FileText, Lock, Trash2 } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePrivacyActions } from "../../hooks/use-security-settings";
import { FeatureCard } from "../feature-card";
import { SettingsItem } from "../settings-item";

/** Direitos de dados (LGPD): exportação, remoção e política de privacidade. */
export function PrivacyCard() {
  const { exportData, requestRemoval } = usePrivacyActions();
  const [confirmRemoval, setConfirmRemoval] = useState(false);

  return (
    <FeatureCard
      icon={Lock}
      title="Privacidade"
      description="Seus direitos sobre os dados da clínica, conforme a LGPD."
      flush
    >
      <SettingsItem
        label="Exportar dados"
        description="Receba uma cópia dos dados da clínica em formato aberto."
        control={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportData.mutate()}
            isLoading={exportData.isPending}
          >
            <FileDown className="h-3.5 w-3.5" aria-hidden />
            Solicitar exportação
          </Button>
        }
      />
      <SettingsItem
        label="Solicitar remoção de dados"
        description="Abre um pedido formal de exclusão, avaliado pela equipe."
        control={
          <Button
            variant="secondary"
            size="sm"
            className="border-danger-200 text-danger-700 hover:bg-danger-50 active:bg-danger-100"
            onClick={() => setConfirmRemoval(true)}
            isLoading={requestRemoval.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Solicitar remoção
          </Button>
        }
      />
      <SettingsItem
        label="Política de privacidade"
        description="Como o sistema trata os dados de pacientes e da equipe."
        control={
          <span className="inline-flex items-center gap-2">
            <Badge tone="gold">Em breve</Badge>
            <Button variant="ghost" size="sm" disabled title="Disponível em breve">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Visualizar
            </Button>
          </span>
        }
      />

      <ConfirmDialog
        open={confirmRemoval}
        tone="danger"
        title="Solicitar remoção de dados?"
        message="Um pedido formal de exclusão será aberto e avaliado pela equipe responsável. Esta solicitação não apaga dados imediatamente."
        confirmLabel="Solicitar remoção"
        isLoading={requestRemoval.isPending}
        onConfirm={() =>
          requestRemoval.mutate(undefined, { onSettled: () => setConfirmRemoval(false) })
        }
        onClose={() => setConfirmRemoval(false)}
      />
    </FeatureCard>
  );
}
