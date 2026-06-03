import { ArrowLeft, CalendarClock, Pencil, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ErrorState } from "@/components/feedback/error-state";
import { Loading } from "@/components/feedback/loading";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { ROLES } from "@/types/roles";
import { formatDateLong, formatDateTime } from "@/utils/format";
import {
  ALLOWED_TRANSITIONS,
  appointmentErrorMessage,
  isoToLocalTime,
  isTerminal,
  STATUS_LABELS,
} from "../constants";
import { AppointmentStatusBadge } from "../components/appointment-status-badge";
import { CancelAppointmentDialog } from "../components/cancel-appointment-dialog";
import { RescheduleDialog } from "../components/reschedule-dialog";
import { useAppointment, useChangeAppointmentStatus } from "../hooks/use-appointments";
import type { AppointmentStatus } from "../types/appointment";

/** Bloco rotulado de leitura. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-mute">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-sm text-ink-soft">{value || "—"}</dd>
    </div>
  );
}

export function AppointmentDetailsPage() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const id = Number(appointmentId);
  const { user } = useAuth();
  const isClinical = user?.role === ROLES.ADMIN || user?.role === ROLES.DENTIST;

  const { data: appt, isLoading, isError, error, refetch } = useAppointment(id);
  const changeStatus = useChangeAppointmentStatus(id);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (isLoading) return <Loading fullPage label="Carregando consulta…" />;
  if (isError || !appt) {
    const apiError = toApiError(error);
    return (
      <>
        <PageHeader title="Consulta" />
        <ErrorState
          title={apiError.status === 403 ? "Acesso restrito" : "Não foi possível carregar os dados"}
          message={apiError.message}
          onRetry={apiError.status === 403 ? undefined : () => refetch()}
        />
      </>
    );
  }

  const terminal = isTerminal(appt.status);
  const transitions = ALLOWED_TRANSITIONS[appt.status];

  async function applyStatus(status: AppointmentStatus) {
    try {
      await changeStatus.mutateAsync(status);
      toast.success(`Status alterado para "${STATUS_LABELS[status]}".`);
    } catch (err) {
      toast.error(appointmentErrorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Consulta"
        description={`${appt.patient.name} · Dr(a). ${appt.dentist.name}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/appointments")}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            {!terminal && (
              <>
                <Button variant="secondary" onClick={() => setRescheduleOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Remarcar
                </Button>
                <Button variant="danger" onClick={() => setCancelOpen(true)}>
                  <XCircle className="h-4 w-4" />
                  Cancelar
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardBody className="p-5 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-ink">
                  <CalendarClock className="h-4 w-4 text-gold-600" aria-hidden />
                  <span className="text-base font-semibold tracking-tight">
                    {formatDateLong(appt.scheduled_start)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-mute">
                  {isoToLocalTime(appt.scheduled_start)} – {isoToLocalTime(appt.scheduled_end)}
                </p>
              </div>
              <AppointmentStatusBadge status={appt.status} />
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Paciente" value={appt.patient.name} />
              <Field label="Profissional" value={`Dr(a). ${appt.dentist.name}`} />
              <Field label="Motivo" value={appt.reason ?? "—"} />
              <Field
                label="Remarcações"
                value={
                  appt.rescheduled_count > 0
                    ? `${appt.rescheduled_count} · original: ${
                        appt.original_start ? formatDateTime(appt.original_start) : "—"
                      }`
                    : "Nenhuma"
                }
              />
              <div className="sm:col-span-2">
                <Field label="Observações" value={appt.notes ?? "—"} />
              </div>
              {appt.status === "canceled" && (
                <div className="sm:col-span-2">
                  <Field
                    label="Cancelamento"
                    value={`${appt.canceled_at ? formatDateTime(appt.canceled_at) : "—"}${
                      appt.cancellation_reason ? ` · ${appt.cancellation_reason}` : ""
                    }`}
                  />
                </div>
              )}
            </dl>
          </CardBody>
        </Card>

        {/* Alterar status — clínico (ADMIN/DENTIST) e consulta não terminal. */}
        {isClinical && !terminal && transitions.length > 0 && (
          <Card>
            <CardBody className="p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-ink">Alterar status</h2>
              <p className="mt-0.5 text-xs text-ink-mute">
                Atualize a situação da consulta conforme o atendimento avança.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {transitions.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    onClick={() => applyStatus(s)}
                    isLoading={changeStatus.isPending}
                  >
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {rescheduleOpen && (
        <RescheduleDialog appointment={appt} onClose={() => setRescheduleOpen(false)} />
      )}
      {cancelOpen && (
        <CancelAppointmentDialog appointment={appt} onClose={() => setCancelOpen(false)} />
      )}
    </>
  );
}
