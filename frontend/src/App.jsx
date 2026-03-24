import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SystemProvider } from "@/context/SystemContext";
import MainLayout from "@/layouts/MainLayout/MainLayout";
import AdminLayout from "@/layouts/AdminLayout/AdminLayout";
import StaffLayout from "@/layouts/StaffLayout/StaffLayout";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import ForgotPassword from "@/pages/Auth/ForgotPassword";
import ResetPassword from "@/pages/Auth/ResetPassword";
import Home from "@/pages/Home/Home";
import Profile from "@/pages/Profile/Profile";
import Booking from "@/pages/Booking/Booking";
import MyBookings from "@/pages/MyBookings/MyBookings";
import ServiceList from "@/pages/ServiceList/ServiceList";
import ServiceDetail from "@/pages/ServiceDetail/ServiceDetail";
import ServiceManagement from "@/pages/Admin/Services";
import CategoriesManagement from "@/pages/Admin/Categories";
import BookingManagement from "@/pages/Admin/Bookings";
import SystemSettings from "@/pages/Admin/SystemSettings";
import LeaveManagement from "@/pages/Admin/LeaveManagement";
import AccountManagement from "@/pages/Admin/AccountManagement";
import MyTasks from "@/pages/Staff/MyTasks";
import LeaveRequest from "@/pages/Staff/LeaveRequest";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, isAdmin, isStaff } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requiredRole === "ADMIN" && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === "STAFF" && !isStaff && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div style={{ color: "white", padding: "20px" }}>
        <h2>Lỗi: Thiếu Google Client ID trong file .env</h2>
        <p>
          Vui lòng kiểm tra file <code>frontend/.env</code>
        </p>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <SystemProvider>
          <Toaster position="top-right" reverseOrder={false} />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="booking"
                  element={
                    <ProtectedRoute>
                      <Booking />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="my-bookings"
                  element={
                    <ProtectedRoute>
                      <MyBookings />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route
                path="/services"
                element={
                  <ProtectedRoute>
                    <ServiceList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/services/:categoryName"
                element={
                  <ProtectedRoute>
                    <ServiceList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/services/detail/:id"
                element={
                  <ProtectedRoute>
                    <ServiceDetail />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="booking" replace />} />
                <Route path="services" element={<ServiceManagement />} />
                <Route path="categories" element={<CategoriesManagement />} />
                <Route path="booking" element={<BookingManagement />} />
                <Route path="leave" element={<LeaveManagement />} />
                <Route path="accounts" element={<AccountManagement />} />
                <Route path="settings" element={<SystemSettings />} />
              </Route>

              <Route
                path="/staff"
                element={
                  <ProtectedRoute requiredRole="STAFF">
                    <StaffLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="tasks" replace />} />
                <Route path="tasks" element={<MyTasks />} />
                <Route path="leave" element={<LeaveRequest />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </SystemProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
