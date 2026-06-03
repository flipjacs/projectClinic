import { expect } from "vitest";

export function expectNoSecretsRendered(container: HTMLElement) {
  expect(container).not.toHaveTextContent(/password_hash/i);
  expect(container).not.toHaveTextContent(/valid-password/i);
  expect(container).not.toHaveTextContent(/admin-token|dentist-token|receptionist-token/i);
}

export function expectSessionCleared() {
  const stored = localStorage.getItem("clinic.auth");
  expect(stored).not.toContain("admin-token");
  expect(stored).not.toContain("dentist-token");
  expect(stored).not.toContain("receptionist-token");
}
