import { Navigate } from "react-router-dom";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { RoleGuard } from "@/components/auth/role-guard";
import { UnauthorizedPage } from "@/components/feedback/unauthorized-page";
import { AppLayout } from "@/components/layout/app-layout";
import { LoginPage } from "@/features/auth/pages/login-page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import {
  ALL_ROLES,
  CLINICAL_ROLES,
  FINANCE_ADMIN_ROLES,
} from "@/lib/permissions";
import { ROLES } from "@/types/roles";

function TestPage({ title }: { title: string }) {
  return <h2>{title}</h2>;
}

export function createTestAppRoutes() {
  return [
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
          element: (
            <RoleGuard allowed={ALL_ROLES}>
              <TestPage title="Patients" />
            </RoleGuard>
          ),
        },
        {
          path: "appointments",
          element: (
            <RoleGuard allowed={ALL_ROLES}>
              <TestPage title="Appointments" />
            </RoleGuard>
          ),
        },
        {
          path: "medical-records",
          element: (
            <RoleGuard allowed={CLINICAL_ROLES}>
              <TestPage title="Medical Records" />
            </RoleGuard>
          ),
        },
        {
          path: "procedures",
          element: (
            <RoleGuard allowed={CLINICAL_ROLES}>
              <TestPage title="Procedures" />
            </RoleGuard>
          ),
        },
        {
          path: "budgets",
          element: (
            <RoleGuard allowed={CLINICAL_ROLES}>
              <TestPage title="Budgets" />
            </RoleGuard>
          ),
        },
        {
          path: "payments",
          element: (
            <RoleGuard allowed={ALL_ROLES}>
              <TestPage title="Payments" />
            </RoleGuard>
          ),
        },
        {
          path: "finance",
          element: (
            <RoleGuard allowed={FINANCE_ADMIN_ROLES}>
              <TestPage title="Finance" />
            </RoleGuard>
          ),
        },
        {
          path: "inventory",
          element: (
            <RoleGuard allowed={ALL_ROLES}>
              <TestPage title="Inventory" />
            </RoleGuard>
          ),
        },
        {
          path: "reports",
          element: (
            <RoleGuard allowed={CLINICAL_ROLES}>
              <TestPage title="Reports" />
            </RoleGuard>
          ),
        },
        {
          path: "users",
          element: (
            <RoleGuard allowed={[ROLES.ADMIN]}>
              <TestPage title="Users" />
            </RoleGuard>
          ),
        },
        {
          path: "settings",
          element: (
            <RoleGuard allowed={[ROLES.ADMIN]}>
              <TestPage title="Settings" />
            </RoleGuard>
          ),
        },
      ],
    },
    { path: "*", element: <Navigate to="/dashboard" replace /> },
  ];
}
