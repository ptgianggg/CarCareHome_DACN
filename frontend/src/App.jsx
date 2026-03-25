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
import Forbidden from "@/pages/Auth/Forbidden";
import Home from "@/pages/Home/Home";
import Profile from "@/pages/Profile/Profile";
import Booking from "@/pages/Booking/Booking";
import MyBookings from "@/pages/MyBookings/MyBookings";
import ServiceList from "@/pages/ServiceList/ServiceList";
import ServiceDetail from "@/pages/ServiceDetail/ServiceDetail";
import Loyalty from "@/pages/Loyalty/Loyalty";
import PaymentCallback from "@/pages/Booking/PaymentCallback";
import ServiceManagement from "@/pages/Admin/Services";
import CategoriesManagement from "@/pages/Admin/Categories";
import BookingManagement from "@/pages/Admin/Bookings";
import SystemSettings from "@/pages/Admin/SystemSettings";
import AdminLayout from "@/layouts/AdminLayout/AdminLayout";
import StaffLayout from "@/layouts/StaffLayout/StaffLayout";
import MyTasks from "@/pages/Staff/MyTasks";
import LeaveRequest from "@/pages/Staff/LeaveRequest";
import LeaveManagement from "@/pages/Admin/LeaveManagement";
import AccountManagement from "@/pages/Admin/AccountManagement";
import AdminDashboard from "@/pages/Admin/Dashboard";
import ReviewManagement from "@/pages/Admin/ReviewManagement";
import VoucherManagement from "@/pages/Admin/Vouchers";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, user, isAdmin, isStaff } = useAuth();
  
  if (loading) return null;
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (requiredRole === "ADMIN" && !isAdmin) {
    return <Navigate to="/forbidden" replace />;
  }

  if (requiredRole === "STAFF" && !isStaff) {
    // Nếu user là Admin, họ có thể vào Staff route không? 
    // Người dùng phàn nàn "đang ở admin tôi /staff vẫn qua được" -> Vậy Admin không được vào Staff route.
    return <Navigate to="/forbidden" replace />;
  }
  
  return children;
};

const UserRoute = ({ children, requireAuth = false }) => {
  const { isAuthenticated, loading, isAdmin, isStaff } = useAuth();
  
  if (loading) return null;
  
  // 1. If page requires auth and user is NOT logged in -> Login
  if (requireAuth && !isAuthenticated) return <Navigate to="/login" replace />;
  
  // 2. If user IS logged in, check if they are Admin/Staff -> Redirect away from User UI
  if (isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin/booking" replace />;
    if (isStaff) return <Navigate to="/staff/tasks" replace />;
  }
  
  // 3. Otherwise (Guest or regular User) -> Allow
  return children;
};

const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading, isAdmin, isStaff } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin/booking" replace />;
    if (isStaff) return <Navigate to="/staff/tasks" replace />;
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
              {/* --- USER / PUBLIC ROUTES --- */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<UserRoute><Home /></UserRoute>} />
                
                {/* Public but user-only (redirects admin/staff) */}
                <Route path="services" element={<UserRoute><ServiceList /></UserRoute>} />
                <Route path="services/:categoryName" element={<UserRoute><ServiceList /></UserRoute>} />
                <Route path="services/detail/:id" element={<UserRoute><ServiceDetail /></UserRoute>} />

                {/* Private user-only (requires login + redirects admin/staff) */}
                <Route path="profile" element={<UserRoute requireAuth><Profile /></UserRoute>} />
                <Route path="booking" element={<UserRoute requireAuth><Booking /></UserRoute>} />
                <Route path="my-bookings" element={<UserRoute requireAuth><MyBookings /></UserRoute>} />
                <Route path="loyalty" element={<UserRoute requireAuth><Loyalty /></UserRoute>} />
                <Route path="payment/callback" element={<PaymentCallback />} />
              </Route>

              {/* --- AUTH ROUTES --- */}
              <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
              <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/forbidden" element={<Forbidden />} />
              
              {/* --- ADMIN ROUTES --- */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="services" element={<ServiceManagement />} />
                <Route path="categories" element={<CategoriesManagement />} />
                <Route path="booking" element={<BookingManagement />} />
                <Route path="vouchers" element={<VoucherManagement />} />
                <Route path="reviews" element={<ReviewManagement />} />
                <Route path="leave" element={<LeaveManagement />} />
                <Route path="accounts" element={<AccountManagement />} />
                <Route path="settings" element={<SystemSettings />} />
              </Route>

              {/* --- STAFF ROUTES --- */}
              <Route path="/staff" element={<ProtectedRoute requiredRole="STAFF"><StaffLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="tasks" replace />} />
                <Route path="tasks" element={<MyTasks />} />
                <Route path="leave" element={<LeaveRequest />} />
                <Route path="profile" element={<Profile />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SystemProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

