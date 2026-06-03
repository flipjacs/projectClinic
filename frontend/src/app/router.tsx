import { lazy } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { RoleGuard } from "@/components/auth/role-guard";
import { PlaceholderPage } from "@/components/feedback/placeholder-page";
import { UnauthorizedPage } from "@/components/feedback/unauthorized-page";
import { AppLayout } from "@/components/layout/app-layout";
import { ALL_ROLES, CLINICAL_ROLES } from "@/lib/permissions";
import { ROLES } from "@/types/roles";

/**
 * Páginas carregadas sob demanda (code splitting por rota). Cada uma vira um
 * chunk separado — o bundle inicial fica enxuto e cada tela só chega quando é
 * acessada. O <Suspense> que cobre essas rotas vive no AppLayout.
 *
 * Os componentes são exports nomeados, então adaptamos para o formato `default`
 * esperado por React.lazy.
 */
const LoginPage = lazy(() =>
  import("@/features/auth/pages/login-page").then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = lazy(() =>
  import("@/features/dashboard/pages/dashboard-page").then((m) => ({
    default: m.DashboardPage,
  })),
);
const PatientsPage = lazy(() =>
  import("@/features/patients/pages/patients-page").then((m) => ({
    default: m.PatientsPage,
  })),
);
const PatientCreatePage = lazy(() =>
  import("@/features/patients/pages/patient-create-page").then((m) => ({
    default: m.PatientCreatePage,
  })),
);
const PatientDetailsPage = lazy(() =>
  import("@/features/patients/pages/patient-details-page").then((m) => ({
    default: m.PatientDetailsPage,
  })),
);
const PatientEditPage = lazy(() =>
  import("@/features/patients/pages/patient-edit-page").then((m) => ({
    default: m.PatientEditPage,
  })),
);
const MedicalRecordsHubPage = lazy(() =>
  import("@/features/medical-records/pages/medical-records-hub-page").then((m) => ({
    default: m.MedicalRecordsHubPage,
  })),
);
const MedicalRecordsPage = lazy(() =>
  import("@/features/medical-records/pages/medical-records-page").then((m) => ({
    default: m.MedicalRecordsPage,
  })),
);
const MedicalRecordCreatePage = lazy(() =>
  import("@/features/medical-records/pages/medical-record-create-page").then((m) => ({
    default: m.MedicalRecordCreatePage,
  })),
);
const MedicalRecordDetailsPage = lazy(() =>
  import("@/features/medical-records/pages/medical-record-details-page").then((m) => ({
    default: m.MedicalRecordDetailsPage,
  })),
);
const MedicalRecordEditPage = lazy(() =>
  import("@/features/medical-records/pages/medical-record-edit-page").then((m) => ({
    default: m.MedicalRecordEditPage,
  })),
);
const AppointmentsPage = lazy(() =>
  import("@/features/appointments/pages/appointments-page").then((m) => ({
    default: m.AppointmentsPage,
  })),
);
const AppointmentCreatePage = lazy(() =>
  import("@/features/appointments/pages/appointment-create-page").then((m) => ({
    default: m.AppointmentCreatePage,
  })),
);
const AppointmentDetailsPage = lazy(() =>
  import("@/features/appointments/pages/appointment-details-page").then((m) => ({
    default: m.AppointmentDetailsPage,
  })),
);
const ProceduresPage = lazy(() =>
  import("@/features/procedures/pages/procedures-page").then((m) => ({
    default: m.ProceduresPage,
  })),
);
const FinancePage = lazy(() =>
  import("@/features/finance/pages/finance-page").then((m) => ({ default: m.FinancePage })),
);
const BudgetsPage = lazy(() =>
  import("@/features/finance/pages/budgets-page").then((m) => ({ default: m.BudgetsPage })),
);
const BudgetCreatePage = lazy(() =>
  import("@/features/finance/pages/budget-create-page").then((m) => ({
    default: m.BudgetCreatePage,
  })),
);
const BudgetDetailsPage = lazy(() =>
  import("@/features/finance/pages/budget-details-page").then((m) => ({
    default: m.BudgetDetailsPage,
  })),
);
const PaymentsPage = lazy(() =>
  import("@/features/finance/pages/payments-page").then((m) => ({ default: m.PaymentsPage })),
);
const PaymentCreatePage = lazy(() =>
  import("@/features/finance/pages/payment-create-page").then((m) => ({
    default: m.PaymentCreatePage,
  })),
);

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      {
        path: "patients",
        element: <RoleGuard allowed={ALL_ROLES} children={<PatientsPage />} />,
      },
      {
        path: "patients/new",
        element: <RoleGuard allowed={ALL_ROLES} children={<PatientCreatePage />} />,
      },
      {
        path: "patients/:id",
        element: <RoleGuard allowed={ALL_ROLES} children={<PatientDetailsPage />} />,
      },
      {
        path: "patients/:id/edit",
        element: <RoleGuard allowed={ALL_ROLES} children={<PatientEditPage />} />,
      },
      {
        path: "patients/:patientId/medical-records",
        element: <RoleGuard allowed={CLINICAL_ROLES} children={<MedicalRecordsPage />} />,
      },
      {
        path: "patients/:patientId/medical-records/new",
        element: (
          <RoleGuard allowed={CLINICAL_ROLES} children={<MedicalRecordCreatePage />} />
        ),
      },
      {
        path: "appointments",
        element: <RoleGuard allowed={ALL_ROLES} children={<AppointmentsPage />} />,
      },
      {
        path: "appointments/new",
        element: <RoleGuard allowed={ALL_ROLES} children={<AppointmentCreatePage />} />,
      },
      {
        path: "appointments/:appointmentId",
        element: <RoleGuard allowed={ALL_ROLES} children={<AppointmentDetailsPage />} />,
      },
      {
        path: "medical-records",
        element: <RoleGuard allowed={CLINICAL_ROLES} children={<MedicalRecordsHubPage />} />,
      },
      {
        path: "medical-records/:recordId",
        element: (
          <RoleGuard allowed={CLINICAL_ROLES} children={<MedicalRecordDetailsPage />} />
        ),
      },
      {
        path: "medical-records/:recordId/edit",
        element: <RoleGuard allowed={CLINICAL_ROLES} children={<MedicalRecordEditPage />} />,
      },
      {
        path: "procedures",
        element: <RoleGuard allowed={CLINICAL_ROLES} children={<ProceduresPage />} />,
      },
      {
        path: "finance",
        element: <RoleGuard allowed={ALL_ROLES} children={<FinancePage />} />,
      },
      {
        path: "budgets",
        element: <RoleGuard allowed={ALL_ROLES} children={<BudgetsPage />} />,
      },
      {
        path: "budgets/new",
        element: <RoleGuard allowed={CLINICAL_ROLES} children={<BudgetCreatePage />} />,
      },
      {
        path: "budgets/:budgetId",
        element: <RoleGuard allowed={ALL_ROLES} children={<BudgetDetailsPage />} />,
      },
      {
        path: "payments",
        element: <RoleGuard allowed={ALL_ROLES} children={<PaymentsPage />} />,
      },
      {
        path: "payments/new",
        element: <RoleGuard allowed={ALL_ROLES} children={<PaymentCreatePage />} />,
      },
      {
        path: "inventory",
        element: (
          <RoleGuard allowed={ALL_ROLES}>
            <PlaceholderPage moduleKey="inventory" />
          </RoleGuard>
        ),
      },
      {
        path: "reports",
        element: (
          <RoleGuard allowed={CLINICAL_ROLES}>
            <PlaceholderPage moduleKey="reports" />
          </RoleGuard>
        ),
      },
      {
        path: "users",
        element: (
          <RoleGuard allowed={[ROLES.ADMIN]}>
            <PlaceholderPage moduleKey="users" />
          </RoleGuard>
        ),
      },
      {
        path: "settings",
        element: (
          <RoleGuard allowed={[ROLES.ADMIN]}>
            <PlaceholderPage moduleKey="settings" />
          </RoleGuard>
        ),
      },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
