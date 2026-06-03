import type { Patient } from "@/features/patients/types/patient";

export function makePatient(input: Partial<Patient> = {}): Patient {
  return {
    id: input.id ?? 1,
    name: input.name ?? "Paciente Teste",
    cpf: input.cpf ?? "12345678901",
    phone: input.phone ?? "5592999990000",
    email: input.email ?? "paciente@clinic.local",
    birth_date: input.birth_date ?? "1990-01-01",
    street: input.street ?? "Rua Teste",
    number: input.number ?? "100",
    neighborhood: input.neighborhood ?? "Centro",
    city: input.city ?? "Manaus",
    state: input.state ?? "AM",
    zip_code: input.zip_code ?? "69000000",
    is_active: input.is_active ?? true,
    created_at: input.created_at ?? "2026-01-10T12:00:00Z",
    updated_at: input.updated_at ?? "2026-01-10T12:00:00Z",
  };
}
