import { ErrorState } from "@/components/feedback/error-state";
import {
  defaultSecuritySettings,
  securitySettingsSchema,
} from "../schemas/security-schema";
import { SettingsPageShell } from "../components";
import { SettingsFormSkeleton } from "../components/settings-form-skeleton";
import {
  SettingsFormProvider,
  UnsavedChangesBanner,
  UnsavedChangesDialog,
} from "../components/form";
import {
  AuditCard,
  PasswordPolicyCard,
  PrivacyCard,
  SecuritySessionCard,
  TwoFactorCard,
} from "../components/security";
import {
  useSecuritySettings,
  useUpdateSecuritySettings,
} from "../hooks/use-security-settings";

/**
 * Configurações → Segurança. Política de senhas editável (form com dirty
 * tracking); sessões, 2FA, auditoria e privacidade com arquitetura pronta e
 * disponibilidade explícita de cada recurso.
 */
export function SecuritySettingsPage() {
  const query = useSecuritySettings();
  const mutation = useUpdateSecuritySettings();

  return (
    <SettingsPageShell categoryKey="security">
      {query.isLoading ? (
        <SettingsFormSkeleton cards={3} />
      ) : query.isError ? (
        <ErrorState
          title="Não foi possível carregar as configurações de segurança"
          onRetry={() => void query.refetch()}
        />
      ) : (
        <div className="max-w-3xl">
          <SettingsFormProvider
            schema={securitySettingsSchema}
            defaultValues={query.data ?? defaultSecuritySettings()}
            onSave={(values) => mutation.mutateAsync(values)}
          >
            <PasswordPolicyCard />
            <SecuritySessionCard />
            <TwoFactorCard />
            <AuditCard />
            <PrivacyCard />
            <UnsavedChangesBanner />
            <UnsavedChangesDialog />
          </SettingsFormProvider>
        </div>
      )}
    </SettingsPageShell>
  );
}
