import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import MainLayout from "@/layouts/MainLayout/MainLayout";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import ForgotPassword from "@/pages/Auth/ForgotPassword";
import ResetPassword from "@/pages/Auth/ResetPassword";
import Home from "@/pages/Home/Home";
import Profile from "@/pages/Profile/Profile";
import Booking from "@/pages/Booking/Booking";
import ServiceList from "@/pages/ServiceList/ServiceList";
import ServiceDetail from "@/pages/ServiceDetail/ServiceDetail";
import ServiceManagement from "@/pages/Admin/Services";
import CategoriesManagement from "@/pages/Admin/Categories";
import BookingManagement from "@/pages/Admin/Bookings";
import AdminLayout from "@/layouts/AdminLayout/AdminLayout";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return null;
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Home />} />
              <Route path="profile" element={<Profile />} />
              <Route path="booking" element={<Booking />} />
              {/* Thêm các route cần Header/Footer khác ở đây sau này */}
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Các trang có tự import Header/Footer riêng */}
            <Route path="/services" element={<ProtectedRoute><ServiceList /></ProtectedRoute>} />
            <Route path="/services/:categoryName" element={<ProtectedRoute><ServiceList /></ProtectedRoute>} />
            <Route path="/services/detail/:id" element={<ProtectedRoute><ServiceDetail /></ProtectedRoute>} />
            
            {/* Các trang Admin */}
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route path="services" element={<ServiceManagement />} />
              <Route path="categories" element={<CategoriesManagement />} />
              <Route path="booking" element={<BookingManagement />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
