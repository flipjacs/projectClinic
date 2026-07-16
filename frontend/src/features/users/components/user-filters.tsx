import { Select } from "@/components/ui/select";
import { ROLE_OPTIONS } from "../constants";
import type { UserRoleFilter, UserStatusFilter } from "../types/user";

interface UserFiltersProps {
  roleFilter: UserRoleFilter;
  statusFilter: UserStatusFilter;
  onRoleChange: (value: UserRoleFilter) => void;
  onStatusChange: (value: UserStatusFilter) => void;
}

const roleOptions = [{ value: "all", label: "Todos os cargos" }, ...ROLE_OPTIONS];
const statusOptions = [
  { value: "all", label: "Todos os status" },
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" },
];

/** Filtros de cargo e status — recorte client-side sobre a base carregada. */
export function UserFilters({
  roleFilter,
  statusFilter,
  onRoleChange,
  onStatusChange,
}: UserFiltersProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-1 sm:flex-none sm:w-[9.5rem]">
        <Select
          aria-label="Filtrar por cargo"
          options={roleOptions}
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value as UserRoleFilter)}
        />
      </div>
      <div className="flex-1 sm:flex-none sm:w-[9rem]">
        <Select
          aria-label="Filtrar por status"
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as UserStatusFilter)}
        />
      </div>
    </div>
  );
}
