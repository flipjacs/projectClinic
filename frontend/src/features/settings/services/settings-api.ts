import axios from "axios";

import { api } from "@/lib/api";
import { onlyDigits } from "@/utils/masks";
import {
  defaultClinicSettings,
  type ClinicSettingsFormValues,
  type DaySchedule,
} from "../schemas/clinic-schema";

/**
 * Client HTTP das Configurações da Clínica.
 *
 * Endpoints IMPLEMENTADOS no backend (Fase 7): GET/PUT /settings/clinic e
 * POST/DELETE /settings/clinic/logo, persistindo no MySQL com RBAC (ADMIN
 * para escrita) e Audit Log. O 404 do GET segue tratado como "nada salvo"
 * (abre com os padrões) para a primeira vez que a clínica é configurada.
 */

const CLINIC_PATH = "/settings/clinic";
const CLINIC_LOGO_PATH = "/settings/clinic/logo";

/** DTO no formato do backend (snake_case, padrão dos outros módulos). */
export interface ClinicSettingsDto {
  name: string;
  trade_name: string;
  technical_director: string;
  cro: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: {
    zip_code: string;
    street: string;
    number: string;
    complement: string;
    district: string;
    city: string;
    state: string;
    country: string;
  };
  schedule: {
    weekday: number;
    enabled: boolean;
    opens_at: string;
    closes_at: string;
    break_starts_at: string | null;
    break_ends_at: string | null;
  }[];
  logo_url: string | null;
  logo_small_url: string | null;
  notes: {
    observations: string;
    default_message: string;
    pdf_footer: string;
    institutional_description: string;
  };
}

// ---------------------------------------------------------------------------
// Mappers DTO ⇄ formulário (a UI nunca vê snake_case)
// ---------------------------------------------------------------------------

export function toFormValues(dto: ClinicSettingsDto): ClinicSettingsFormValues {
  const defaults = defaultClinicSettings();
  const schedule: DaySchedule[] = defaults.schedule.map((day) => {
    const remote = dto.schedule.find((s) => s.weekday === day.weekday);
    if (!remote) return day;
    return {
      weekday: remote.weekday,
      enabled: remote.enabled,
      opensAt: remote.opens_at,
      closesAt: remote.closes_at,
      breakStartsAt: remote.break_starts_at ?? "",
      breakEndsAt: remote.break_ends_at ?? "",
    };
  });

  return {
    general: {
      name: dto.name,
      tradeName: dto.trade_name,
      technicalDirector: dto.technical_director,
      cro: dto.cro,
      phone: dto.phone,
      whatsapp: dto.whatsapp,
      email: dto.email,
      website: dto.website,
    },
    address: {
      zipCode: dto.address.zip_code,
      street: dto.address.street,
      number: dto.address.number,
      complement: dto.address.complement,
      district: dto.address.district,
      city: dto.address.city,
      state: dto.address.state as ClinicSettingsFormValues["address"]["state"],
      country: dto.address.country || "Brasil",
    },
    schedule,
    branding: {
      logo: dto.logo_url ? { kind: "remote", url: dto.logo_url } : null,
      logoSmall: dto.logo_small_url ? { kind: "remote", url: dto.logo_small_url } : null,
    },
    notes: {
      observations: dto.notes.observations,
      defaultMessage: dto.notes.default_message,
      pdfFooter: dto.notes.pdf_footer,
      institutionalDescription: dto.notes.institutional_description,
    },
  };
}

/** Payload de escrita — telefones normalizados para dígitos, sem os logos
 *  (upload é binário e tem endpoint próprio). */
export function toUpdatePayload(values: ClinicSettingsFormValues) {
  return {
    name: values.general.name,
    trade_name: values.general.tradeName,
    technical_director: values.general.technicalDirector,
    cro: values.general.cro,
    phone: onlyDigits(values.general.phone),
    whatsapp: onlyDigits(values.general.whatsapp),
    email: values.general.email,
    website: values.general.website,
    address: {
      zip_code: onlyDigits(values.address.zipCode),
      street: values.address.street,
      number: values.address.number,
      complement: values.address.complement,
      district: values.address.district,
      city: values.address.city,
      state: values.address.state,
      country: values.address.country,
    },
    schedule: values.schedule.map((day) => ({
      weekday: day.weekday,
      enabled: day.enabled,
      opens_at: day.opensAt,
      closes_at: day.closesAt,
      break_starts_at: day.breakStartsAt || null,
      break_ends_at: day.breakEndsAt || null,
    })),
    notes: {
      observations: values.notes.observations,
      default_message: values.notes.defaultMessage,
      pdf_footer: values.notes.pdfFooter,
      institutional_description: values.notes.institutionalDescription,
    },
  };
}

// ---------------------------------------------------------------------------
// Chamadas HTTP
// ---------------------------------------------------------------------------

/**
 * Busca as configurações salvas. `null` = nada salvo ainda (ou endpoint ainda
 * não implantado) — a tela abre com os valores padrão, sem tratar como erro.
 */
export async function getClinicSettings(): Promise<ClinicSettingsFormValues | null> {
  try {
    const { data } = await api.get<ClinicSettingsDto>(CLINIC_PATH);
    return toFormValues(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export async function updateClinicSettings(
  values: ClinicSettingsFormValues,
): Promise<ClinicSettingsFormValues> {
  const { data } = await api.put<ClinicSettingsDto>(CLINIC_PATH, toUpdatePayload(values));
  return toFormValues(data);
}

/** Envia um logo já validado/comprimido pelo LogoUploader. */
export async function uploadClinicLogo(
  file: File,
  kind: "logo" | "logo_small",
): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  const { data } = await api.post<{ url: string }>(CLINIC_LOGO_PATH, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function removeClinicLogo(kind: "logo" | "logo_small"): Promise<void> {
  await api.delete(CLINIC_LOGO_PATH, { params: { kind } });
}
