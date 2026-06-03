import { http, HttpResponse } from "msw";

import {
  appointments,
  budgets,
  dashboard,
  financeSummary,
  inventoryItems,
  medicalRecords,
  page,
  patients,
  payments,
  TEST_TOKENS,
  users,
} from "./fixtures";

function authUser(request: Request) {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.replace("Bearer ", "");
  if (token === TEST_TOKENS.admin) return users.admin;
  if (token === TEST_TOKENS.dentist) return users.dentist;
  if (token === TEST_TOKENS.receptionist) return users.receptionist;
  return null;
}

export const handlers = [
  http.post("*/auth/login", async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const username = params.get("username");
    const password = params.get("password");

    if (password !== "valid-password") {
      return HttpResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const token =
      username === users.dentist.email
        ? TEST_TOKENS.dentist
        : username === users.receptionist.email
          ? TEST_TOKENS.receptionist
          : TEST_TOKENS.admin;

    return HttpResponse.json({ access_token: token, token_type: "bearer" });
  }),

  http.get("*/auth/me", ({ request }) => {
    const user = authUser(request);
    if (!user) return HttpResponse.json({ detail: "Unauthorized" }, { status: 401 });
    return HttpResponse.json(user);
  }),

  http.get("*/dashboard", ({ request }) => {
    if (!authUser(request)) return HttpResponse.json({ detail: "Unauthorized" }, { status: 401 });
    return HttpResponse.json(dashboard);
  }),

  http.get("*/patients", () => HttpResponse.json(page(patients))),
  http.post("*/patients", () => HttpResponse.json(patients[0], { status: 201 })),
  http.get("*/patients/:id", () => HttpResponse.json(patients[0])),
  http.patch("*/patients/:id", () => HttpResponse.json(patients[0])),
  http.patch("*/patients/:id/activate", () => HttpResponse.json({ ...patients[0], is_active: true })),
  http.patch("*/patients/:id/deactivate", () => HttpResponse.json({ ...patients[0], is_active: false })),
  http.get("*/patients/:id/summary", () =>
    HttpResponse.json({ patient: patients[0], health_info: null }),
  ),
  http.get("*/patients/:id/health-info", () => HttpResponse.json({ detail: "Not found" }, { status: 404 })),
  http.post("*/patients/:id/health-info", () => HttpResponse.json({}, { status: 201 })),
  http.patch("*/patients/:id/health-info", () => HttpResponse.json({})),

  http.get("*/patients/:id/medical-records", () => HttpResponse.json(page(medicalRecords))),
  http.post("*/patients/:id/medical-records", () => HttpResponse.json(medicalRecords[0], { status: 201 })),
  http.get("*/medical-records/:id", () => HttpResponse.json(medicalRecords[0])),
  http.patch("*/medical-records/:id", () => HttpResponse.json(medicalRecords[0])),
  http.patch("*/medical-records/:id/deactivate", () =>
    HttpResponse.json({ ...medicalRecords[0], is_active: false }),
  ),

  http.get("*/appointments", () => HttpResponse.json(page(appointments))),
  http.get("*/appointments/today", () => HttpResponse.json(page(appointments))),
  http.post("*/appointments", () => HttpResponse.json(appointments[0], { status: 201 })),
  http.patch("*/appointments/:id/reschedule", () => HttpResponse.json(appointments[0])),
  http.patch("*/appointments/:id/cancel", () =>
    HttpResponse.json({ ...appointments[0], status: "canceled" }),
  ),
  http.patch("*/appointments/:id/status", () => HttpResponse.json(appointments[0])),

  http.get("*/finance/summary", () => HttpResponse.json(financeSummary)),
  http.get("*/finance/revenue/weekly", () =>
    HttpResponse.json({
      period_start: "2026-01-05T00:00:00Z",
      period_end: "2026-01-12T00:00:00Z",
      total_paid: "3200.00",
      number_of_payments: 2,
    }),
  ),
  http.get("*/finance/revenue/monthly", () =>
    HttpResponse.json({
      period_start: "2026-01-01T00:00:00Z",
      period_end: "2026-02-01T00:00:00Z",
      total_paid: "12500.00",
      number_of_payments: 8,
    }),
  ),
  http.get("*/finance/pending-payments", () =>
    HttpResponse.json(page(payments.filter((payment) => payment.status !== "paid"))),
  ),
  http.get("*/procedures", () => HttpResponse.json(page([]))),
  http.post("*/procedures", () => HttpResponse.json({}, { status: 201 })),
  http.get("*/budgets", () => HttpResponse.json(page(budgets))),
  http.post("*/budgets", () => HttpResponse.json(budgets[0], { status: 201 })),
  http.get("*/budgets/:id", () => HttpResponse.json(budgets[0])),
  http.get("*/budgets/:id/settlement", () =>
    HttpResponse.json({ budget_id: 1, total_amount: "500.00", total_paid: "200.00", total_pending: "300.00" }),
  ),
  http.get("*/budgets/:id/payments", () => HttpResponse.json(page(payments))),
  http.get("*/payments", () => HttpResponse.json(page(payments))),
  http.post("*/payments", () => HttpResponse.json(payments[0], { status: 201 })),

  http.get("*/inventory/items", () => HttpResponse.json(page(inventoryItems))),
  http.post("*/inventory/items", () => HttpResponse.json(inventoryItems[0], { status: 201 })),
  http.post("*/inventory/items/:id/movements/in", () => HttpResponse.json({})),
  http.post("*/inventory/items/:id/movements/out", () => HttpResponse.json({})),
  http.get("*/inventory/alerts/low-stock", () => HttpResponse.json(page(inventoryItems))),
  http.get("*/inventory/alerts/expiring", () => HttpResponse.json(page([]))),

  http.get("*/users", () => HttpResponse.json(page([users.admin, users.dentist, users.receptionist]))),
  http.post("*/users", () => HttpResponse.json(users.admin, { status: 201 })),
  http.patch("*/users/:id", () => HttpResponse.json(users.admin)),

  http.get("*/reports/patients", () => HttpResponse.json({ items: [] })),
  http.get("*/reports/finance", () => HttpResponse.json({ items: [] })),
  http.get("*/reports/appointments", () => HttpResponse.json({ items: [] })),
  http.get("*/reports/inventory", () => HttpResponse.json({ items: [] })),
];
