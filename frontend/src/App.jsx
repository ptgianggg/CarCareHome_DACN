import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SystemProvider } from "@/context/SystemContext";
import { Toaster } from "react-hot-toast";
import MainLayout from "@/layouts/MainLayout/MainLayout";
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
import AdminLayout from "@/layouts/AdminLayout/AdminLayout";
import StaffLayout from "@/layouts/StaffLayout/StaffLayout";
import MyTasks from "@/pages/Staff/MyTasks";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, user, isAdmin } = useAuth();
  
  if (loading) return null;
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (requiredRole === "ADMIN" && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === "STAFF" && user?.role !== "STAFF" && user?.role !== "ROLE_STAFF" && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div style={{ color: "white", padding: "20px" }}>
        <h2>Lỗi: Thiếu Google Client ID trong file .env</h2>
        <p>Vui lòng kiểm tra file <code>frontend/.env</code></p>
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
              {/* Trang công khai sử dụng MainLayout */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
                <Route path="my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
              </Route>

              {/* Các trang Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Các trang dịch vụ */}
              <Route path="/services" element={<ProtectedRoute><ServiceList /></ProtectedRoute>} />
              <Route path="/services/:categoryName" element={<ProtectedRoute><ServiceList /></ProtectedRoute>} />
              <Route path="/services/detail/:id" element={<ProtectedRoute><ServiceDetail /></ProtectedRoute>} />
              
              {/* Các trang Admin */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminLayout /></ProtectedRoute>}>
                <Route path="services" element={<ServiceManagement />} />
                <Route path="categories" element={<CategoriesManagement />} />
                <Route path="booking" element={<BookingManagement />} />
                <Route path="settings" element={<SystemSettings />} />
              </Route>

              {/* Các trang Staff */}
              <Route path="/staff" element={<ProtectedRoute requiredRole="STAFF"><StaffLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="tasks" replace />} />
                <Route path="tasks" element={<MyTasks />} />
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
