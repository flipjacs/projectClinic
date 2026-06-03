import { delay, http, HttpResponse } from "msw";

import { dashboard } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithRouter, screen, setAuthToken } from "@/test/test-utils";
import { createTestAppRoutes } from "@/test/test-routes";

describe("dashboard states", () => {
  it("shows the loading state while dashboard data is being fetched", async () => {
    server.use(
      http.get("*/dashboard", async () => {
        await delay(250);
        return HttpResponse.json(dashboard);
      }),
    );
    setAuthToken("admin");

    renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/dashboard"],
    });

    expect(await screen.findByText("Verificando sessão…")).toBeInTheDocument();
    expect(await screen.findByText("Consultas de hoje")).toBeInTheDocument();
  });

  it("shows a friendly error instead of raw API details", async () => {
    server.use(
      http.get("*/dashboard", () =>
        HttpResponse.json({ detail: "Internal Server Error: stack trace" }, { status: 500 }),
      ),
    );
    setAuthToken("admin");

    renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/dashboard"],
    });

    expect(await screen.findByText("Não foi possível carregar os dados")).toBeInTheDocument();
    expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();
  });

  it("shows dashboard cards when the API responds", async () => {
    setAuthToken("admin");

    renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/dashboard"],
    });

    expect(await screen.findByText("Consultas de hoje")).toBeInTheDocument();
    expect(screen.getByText("Pacientes ativos")).toBeInTheDocument();
    expect(screen.getByText("Faturamento do mês")).toBeInTheDocument();
    expect(screen.getAllByText("Pagamentos pendentes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Estoque baixo").length).toBeGreaterThan(0);
  });
});
