import { Navigate, createBrowserRouter } from "react-router-dom";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { RoleGuard } from "@/components/auth/role-guard";
import { PlaceholderPage } from "@/components/feedback/placeholder-page";
import { UnauthorizedPage } from "@/components/feedback/unauthorized-page";
import { AppLayout } from "@/components/layout/app-layout";
import { LoginPage } from "@/features/auth/pages/login-page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import { PatientCreatePage } from "@/features/patients/pages/patient-create-page";
import { PatientDetailsPage } from "@/features/patients/pages/patient-details-page";
import { PatientEditPage } from "@/features/patients/pages/patient-edit-page";
import { PatientsPage } from "@/features/patients/pages/patients-page";
import { ALL_ROLES, CLINICAL_ROLES } from "@/lib/permissions";
import { ROLES } from "@/types/roles";

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
        path: "appointments",
        element: (
          <RoleGuard allowed={ALL_ROLES}>
            <PlaceholderPage title="Agenda" />
          </RoleGuard>
        ),
      },
      {
        path: "medical-records",
        element: (
          <RoleGuard allowed={CLINICAL_ROLES}>
            <PlaceholderPage title="Prontuários" />
          </RoleGuard>
        ),
      },
      {
        path: "procedures",
        element: (
          <RoleGuard allowed={CLINICAL_ROLES}>
            <PlaceholderPage title="Procedimentos" />
          </RoleGuard>
        ),
      },
      {
        path: "finance",
        element: (
          <RoleGuard allowed={[ROLES.ADMIN]}>
            <PlaceholderPage title="Financeiro" />
          </RoleGuard>
        ),
      },
      {
        path: "inventory",
        element: (
          <RoleGuard allowed={ALL_ROLES}>
            <PlaceholderPage title="Estoque" />
          </RoleGuard>
        ),
      },
      {
        path: "reports",
        element: (
          <RoleGuard allowed={CLINICAL_ROLES}>
            <PlaceholderPage title="Relatórios" />
          </RoleGuard>
        ),
      },
      {
        path: "users",
        element: (
          <RoleGuard allowed={[ROLES.ADMIN]}>
            <PlaceholderPage title="Usuários" />
          </RoleGuard>
        ),
      },
      {
        path: "settings",
        element: (
          <RoleGuard allowed={[ROLES.ADMIN]}>
            <PlaceholderPage title="Configurações" />
          </RoleGuard>
        ),
      },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
