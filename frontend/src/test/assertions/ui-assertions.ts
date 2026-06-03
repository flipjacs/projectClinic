import { expect } from "vitest";

export function expectVisibleLink(container: HTMLElement, label: string) {
  const links = Array.from(container.querySelectorAll("a"));
  expect(links.some((link) => link.textContent?.includes(label))).toBe(true);
}

export function expectHiddenLink(container: HTMLElement, label: string) {
  const links = Array.from(container.querySelectorAll("a"));
  expect(links.some((link) => link.textContent?.includes(label))).toBe(false);
}
