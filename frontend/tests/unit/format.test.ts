import {
  formatCurrency,
  formatDate,
  formatDateLong,
  formatDateOnly,
  formatDateTime,
  formatTime,
} from "@/utils/format";

describe("format utilities", () => {
  it("formats currency and safely handles empty or invalid values", () => {
    expect(formatCurrency("1250.5")).toContain("1.250,50");
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency(undefined)).toBe("—");
    expect(formatCurrency("")).toBe("—");
    expect(formatCurrency("not-a-number")).toBe("—");
  });

  it("formats dates and safely handles missing or invalid values", () => {
    expect(formatDate("2026-01-10T12:00:00Z")).toMatch(/\d{2}\/\d{2}\/2026/);
    expect(formatDate(null)).toBe("—");
    expect(formatDate("invalid-date")).toBe("—");
  });

  it("formats date-only values without timezone shifts", () => {
    expect(formatDateOnly("2026-01-10")).toBe("10/01/2026");
    expect(formatDateOnly(undefined)).toBe("—");
    expect(formatDateOnly("invalid-date")).toBe("—");
  });

  it("formats long dates and date-time values", () => {
    expect(formatDateLong("2026-01-10")).toContain("janeiro");
    expect(formatDateLong(null)).toBe("—");
    expect(formatDateLong("invalid-date")).toBe("—");
    expect(formatDateTime("2026-01-10T12:30:00Z")).toMatch(/\d{2}\/\d{2}/);
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime("invalid-date")).toBe("—");
  });

  it("formats time and safely handles invalid input", () => {
    expect(formatTime("2026-01-10T12:30:00Z")).toMatch(/\d{2}:\d{2}/);
    expect(formatTime(null)).toBe("—");
    expect(formatTime("invalid-date")).toBe("—");
  });
});
