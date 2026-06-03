import { navItemsForRole } from "@/lib/permissions";
import { ROLES } from "@/types/roles";

describe("permissions", () => {
  it("does not expose admin-only navigation to DENTIST", () => {
    const labels = navItemsForRole(ROLES.DENTIST).map((item) => item.label);

    expect(labels).not.toContain("Financeiro");
    expect(labels).not.toContain("Usuários");
    expect(labels).not.toContain("Configurações");
  });

  it("does not expose clinical or admin-only navigation to RECEPTIONIST", () => {
    const labels = navItemsForRole(ROLES.RECEPTIONIST).map((item) => item.label);

    expect(labels).toEqual(["Dashboard", "Pacientes", "Agenda", "Pagamentos", "Estoque"]);
  });
});
