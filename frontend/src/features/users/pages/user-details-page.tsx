import { AnimatePresence, m } from "framer-motion";
import { Info, KeyRound, Pencil, Power, PowerOff, ShieldCheck, History } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ErrorState } from "@/components/feedback/error-state";
import { Loading } from "@/components/feedback/loading";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { EASE } from "@/lib/motion";
import { toast } from "@/stores/toast-store";
import { ROLES } from "@/types/roles";
import { DeactivateDialog } from "../components/deactivate-dialog";
import { RoleBadge } from "../components/role-badge";
import { StatusBadge } from "../components/status-badge";
import { UserAvatar } from "../components/user-avatar";
import { UserDialog } from "../components/user-dialog";
import { UserInfo } from "../components/user-info";
import { UserPermissions } from "../components/user-permissions";
import { UserSecuritySection } from "../components/user-security-section";
import { UserTabs, panelId, tabId, type UserTab } from "../components/user-tabs";
import { UserTimeline } from "../components/user-timeline";
import {
  useToggleUserActive,
  useUser,
  useUsersList,
  userErrorMessage,
} from "../hooks/use-users";

type TabKey = "info" | "permissions" | "history" | "security";

const TAB_BASE = "user-profile";

const TABS: UserTab<TabKey>[] = [
  { key: "info", label: "Informações", icon: Info },
  { key: "permissions", label: "Permissões", icon: ShieldCheck },
  { key: "history", label: "Histórico", icon: History },
  { key: "security", label: "Segurança", icon: KeyRound },
];

export function UserDetailsPage() {
  const { userId } = useParams();
  const id = Number(userId);
  const { user: currentUser } = useAuth();

  const { data: user, isLoading, isError, refetch } = useUser(id);
  const { data: allUsers } = useUsersList();
  const toggleActive = useToggleUserActive();

  const [tab, setTab] = useState<TabKey>("info");
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const activeAdminCount = useMemo(
    () => (allUsers ?? []).filter((u) => u.role === ROLES.ADMIN && u.is_active).length,
    [allUsers],
  );

  if (isLoading) return <Loading fullPage label="Carregando perfil…" />;
  if (isError || !user) return <ErrorState onRetry={() => refetch()} />;

  const isSelf = currentUser?.id === user.id;
  const isLastActiveAdmin =
    user.is_active && user.role === ROLES.ADMIN && activeAdminCount <= 1;
  const deactivateBlockReason = isSelf
    ? "Você não pode inativar o próprio usuário."
    : isLastActiveAdmin
      ? "Não é possível inativar o último administrador ativo."
      : null;

  async function handleActivate() {
    if (!user) return;
    try {
      await toggleActive.mutateAsync({ id: user.id, active: true });
      toast.success(`${user.name} reativado com sucesso.`);
    } catch (error) {
      toast.error(userErrorMessage(error));
    }
  }

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Usuários", to: "/users" }, { label: user.name }]}
      />

      {/* Cabeçalho do perfil */}
      <Card className="mb-6">
        <CardBody className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar name={user.name} role={user.role} size="lg" inactive={!user.is_active} />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-ink">
                {user.name}
              </h1>
              <p className="mt-0.5 truncate text-sm text-ink-mute">{user.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <RoleBadge role={user.role} />
                <StatusBadge active={user.is_active} />
                {isSelf && (
                  <span className="text-xs text-ink-mute">· Este é você</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              {user.is_active ? (
                <Button
                  variant="danger"
                  onClick={() => setDeactivateOpen(true)}
                  disabled={Boolean(deactivateBlockReason)}
                  title={deactivateBlockReason ?? undefined}
                >
                  <PowerOff className="h-4 w-4" />
                  Inativar
                </Button>
              ) : (
                <Button
                  variant="success"
                  onClick={handleActivate}
                  isLoading={toggleActive.isPending}
                >
                  <Power className="h-4 w-4" />
                  Ativar
                </Button>
              )}
            </div>
            {user.is_active && deactivateBlockReason && (
              <p className="max-w-[16rem] text-right text-xs text-ink-mute">
                {deactivateBlockReason}
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Abas de seção */}
      <div className="mb-6">
        <UserTabs tabs={TABS} active={tab} onChange={setTab} idBase={TAB_BASE} />
      </div>

      <Card>
        <CardBody className="p-6">
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={tab}
              role="tabpanel"
              id={panelId(TAB_BASE, tab)}
              aria-labelledby={tabId(TAB_BASE, tab)}
              tabIndex={0}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: EASE }}
              className="outline-none"
            >
              {tab === "info" && <UserInfo user={user} />}
              {tab === "permissions" && <UserPermissions role={user.role} />}
              {tab === "history" && <UserTimeline user={user} />}
              {tab === "security" && <UserSecuritySection user={user} />}
            </m.div>
          </AnimatePresence>
        </CardBody>
      </Card>

      <UserDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        currentUserId={currentUser?.id}
        activeAdminCount={activeAdminCount}
      />

      <DeactivateDialog
        open={deactivateOpen}
        user={user}
        isLoading={toggleActive.isPending}
        onConfirm={async () => {
          try {
            await toggleActive.mutateAsync({ id: user.id, active: false });
            toast.success(`${user.name} foi inativado.`);
            setDeactivateOpen(false);
          } catch (error) {
            toast.error(userErrorMessage(error));
          }
        }}
        onClose={() => setDeactivateOpen(false)}
      />
    </>
  );
}
