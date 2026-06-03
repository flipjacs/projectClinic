import {
  renderWithRouter,
  screen,
  setAuthToken,
  within,
} from "@/test/test-utils";
import { createTestAppRoutes } from "@/test/test-routes";

function visibleNavigationLinks() {
  return within(screen.getByRole("navigation")).getAllByRole("link").map((link) => ({
    label: link.textContent,
    href: link.getAttribute("href"),
  }));
}

describe("role based navigation", () => {
  it("shows the correct sidebar links for ADMIN", async () => {
    setAuthToken("admin");
    renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/dashboard"],
    });

    await screen.findByText("Consultas de hoje");
    const links = visibleNavigationLinks();

    expect(links.map((link) => link.label)).toEqual([
      "Dashboard",
      "Pacientes",
      "Agenda",
      "Prontuários",
      "Procedimentos",
      "Orçamentos",
      "Pagamentos",
      "Financeiro",
      "Estoque",
      "Relatórios",
      "Usuários",
      "Configurações",
    ]);
  });

  it("shows clinical links for DENTIST without administrative finance/user areas", async () => {
    setAuthToken("dentist");
    renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/dashboard"],
    });

    await screen.findByText("Consultas de hoje");
    const labels = visibleNavigationLinks().map((link) => link.label);

    expect(labels).toContain("Pacientes");
    expect(labels).toContain("Agenda");
    expect(labels).toContain("Prontuários");
    expect(labels).toContain("Procedimentos");
    expect(labels).toContain("Orçamentos");
    expect(labels).toContain("Pagamentos");
    expect(labels).toContain("Relatórios");
    expect(labels).not.toContain("Financeiro");
    expect(labels).not.toContain("Usuários");
    expect(labels).not.toContain("Configurações");
  });

  it("shows operational links for RECEPTIONIST without clinical/admin restricted areas", async () => {
    setAuthToken("receptionist");
    renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/dashboard"],
    });

    await screen.findByText("Consultas de hoje");
    const labels = visibleNavigationLinks().map((link) => link.label);

    expect(labels).toEqual([
      "Dashboard",
      "Pacientes",
      "Agenda",
      "Pagamentos",
      "Estoque",
    ]);
    expect(labels).not.toContain("Prontuários");
    expect(labels).not.toContain("Orçamentos");
    expect(labels).not.toContain("Financeiro");
    expect(labels).not.toContain("Usuários");
  });
});
