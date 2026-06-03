import { http, HttpResponse } from "msw";

import { server } from "@/test/msw/server";
import { TEST_TOKENS } from "@/test/msw/fixtures";
import {
  renderWithRouter,
  screen,
  setAuthToken,
  waitFor,
  within,
} from "@/test/test-utils";
import { createTestAppRoutes } from "@/test/test-routes";
import { useAuthStore } from "@/stores/auth-store";

describe("auth and protected routes", () => {
  it("renders the application without crashing", () => {
    renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/login"],
    });

    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("redirects users without token to /login", async () => {
    const { router } = renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/dashboard"],
    });

    expect(await screen.findByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
  });

  it("redirects to /dashboard after successful login", async () => {
    const { router, user } = renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/login"],
    });

    await user.type(screen.getByLabelText("E-mail"), "admin@clinic.test");
    await user.type(screen.getByLabelText("Senha"), "valid-password");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await screen.findByText("Consultas de hoje");
    expect(router.state.location.pathname).toBe("/dashboard");
  });

  it("shows a friendly message for invalid login", async () => {
    const { user } = renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/login"],
    });

    await user.type(screen.getByLabelText("E-mail"), "admin@clinic.test");
    await user.type(screen.getByLabelText("Senha"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("E-mail ou senha incorretos. Verifique e tente novamente."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
  });

  it("/auth/me 401 clears the session and returns to login", async () => {
    setAuthToken("expired");

    const { router } = renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/dashboard"],
    });

    expect(await screen.findByRole("button", { name: "Entrar" })).toBeInTheDocument();
    await waitFor(() => expect(useAuthStore.getState().token).toBeNull());
    expect(router.state.location.pathname).toBe("/login");
  });

  it("blocks a route that the current role cannot access", async () => {
    setAuthToken("dentist");

    const { router } = renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/users"],
    });

    expect(await screen.findByText("Acesso restrito")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/unauthorized");
  });

  it("shows a friendly restricted-access message for 403 API responses", async () => {
    server.use(
      http.get("*/dashboard", () =>
        HttpResponse.json({ detail: "Forbidden technical detail" }, { status: 403 }),
      ),
    );
    setAuthToken("admin");

    renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/dashboard"],
    });

    expect(await screen.findByText("Acesso restrito")).toBeInTheDocument();
    expect(screen.queryByText("Forbidden technical detail")).not.toBeInTheDocument();
  });

  it("logout clears the session and redirects to /login", async () => {
    setAuthToken("admin");
    const { router, user } = renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/dashboard"],
    });

    await screen.findByText("Consultas de hoje");
    await user.click(screen.getByRole("button", { name: "Sair da conta" }));

    expect(await screen.findByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
    expect(router.state.location.pathname).toBe("/login");
  });

  it("does not render tokens or passwords in the authenticated shell", async () => {
    setAuthToken("admin");
    const { container } = renderWithRouter({
      routes: createTestAppRoutes(),
      initialEntries: ["/dashboard"],
    });

    await screen.findByText("Consultas de hoje");
    const bodyText = within(container).queryByText(TEST_TOKENS.admin);

    expect(bodyText).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent("valid-password");
    expect(container).not.toHaveTextContent("password_hash");
  });
});
