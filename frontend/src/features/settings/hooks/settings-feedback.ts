import axios from "axios";

import { apiErrorDetail, toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";

/**
 * Feedback padrão de falha ao salvar Configurações. O caso especial é o 404:
 * o endpoint ainda não existe no backend — mensagem honesta, sem parecer
 * falha do usuário. Os dados permanecem intactos na tela.
 */
export function notifySettingsSaveError(error: unknown): void {
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    toast.error(
      "O servidor ainda não oferece o salvamento destas configurações. Suas alterações permanecem nesta tela.",
    );
    return;
  }
  toast.error(apiErrorDetail(error) ?? toApiError(error).message);
}

/** Variante para ações imediatas (encerrar sessões, exportar dados…). */
export function notifySettingsActionError(error: unknown): void {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    // 501: recurso com arquitetura pronta, aguardando infraestrutura (ex.:
    // sessões distribuídas, TOTP). 404: endpoint ainda não implantado.
    if (status === 501) {
      toast.info(
        apiErrorDetail(error) ??
          "Este recurso requer infraestrutura ainda não disponível no servidor.",
      );
      return;
    }
    if (status === 404) {
      toast.info("Este recurso estará disponível em uma próxima versão do servidor.");
      return;
    }
  }
  toast.error(apiErrorDetail(error) ?? toApiError(error).message);
}
