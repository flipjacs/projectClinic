import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from "react-router-dom";

import { Toaster } from "@/components/feedback/toaster";
import { useAuthStore } from "@/stores/auth-store";
import { TEST_TOKENS } from "./msw/fixtures";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function setAuthToken(role: keyof typeof TEST_TOKENS = "admin") {
  useAuthStore.setState({ token: TEST_TOKENS[role] });
}

function TestProviders({
  children,
  queryClient = createTestQueryClient(),
}: {
  children: ReactNode;
  queryClient?: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions & { queryClient?: QueryClient } = {},
) {
  const { queryClient, ...renderOptions } = options;
  const client = queryClient ?? createTestQueryClient();
  return {
    user: userEvent.setup(),
    queryClient: client,
    ...render(ui, {
      wrapper: ({ children }) => (
        <TestProviders queryClient={client}>{children}</TestProviders>
      ),
      ...renderOptions,
    }),
  };
}

export function renderWithRouter({
  routes,
  initialEntries = ["/"],
  queryClient = createTestQueryClient(),
}: {
  routes: RouteObject[];
  initialEntries?: string[];
  queryClient?: QueryClient;
}) {
  const router = createMemoryRouter(routes, { initialEntries });
  return {
    router,
    user: userEvent.setup(),
    queryClient,
    ...render(
      <TestProviders queryClient={queryClient}>
        <RouterProvider router={router} />
      </TestProviders>,
    ),
  };
}

export * from "@testing-library/react";
export { userEvent };
