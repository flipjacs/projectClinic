import { renderWithRouter, screen, setAuthToken } from "@/test/test-utils";
import { createTestAppRoutes } from "@/test/test-routes";

describe("security and accessibility smoke checks", () => {
  it("keeps restricted links out of the DOM for users without permission", async () => {
    setAuthToken("receptionist");

    renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/dashboard"],
    });

    await screen.findByText("Consultas de hoje");

    expect(screen.queryByRole("link", { name: "Usuários" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Financeiro" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Prontuários" })).not.toBeInTheDocument();
  });

  it("exposes clear accessible names for login fields and actions", () => {
    renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/login"],
    });

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });
});
