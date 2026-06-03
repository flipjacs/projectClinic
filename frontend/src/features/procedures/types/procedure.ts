import type { MoneyValue } from "@/utils/currency";

export interface Procedure {
  id: number;
  name: string;
  description: string | null;
  base_price: MoneyValue;
  estimated_duration_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProcedureInput {
  name: string;
  description: string | null;
  base_price: string;
  estimated_duration_minutes: number | null;
}
