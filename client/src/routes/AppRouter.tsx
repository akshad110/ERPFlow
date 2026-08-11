import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RoleRoutes } from "@/routes/RoleRoutes";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/dashboard/Dashboard";
import Customers from "@/pages/customers/Customers";
import CustomerDetails from "@/pages/customers/CustomerDetails";
import CustomerForm from "@/pages/customers/CustomerForm";
import Products from "@/pages/products/Products";
import Challans from "@/pages/challans/Challans";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/customers" element={<Customers />} />

            <Route element={<RoleRoutes allowedRoles={["ADMIN", "SALES"]} />}>
              <Route
                path="/customers/new"
                element={<CustomerForm mode="create" />}
              />
              <Route
                path="/customers/:id/edit"
                element={<CustomerForm mode="edit" />}
              />
            </Route>

            <Route path="/customers/:id" element={<CustomerDetails />} />

            <Route path="/products" element={<Products />} />
            <Route path="/challans" element={<Challans />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
