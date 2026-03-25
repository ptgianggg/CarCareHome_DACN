const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8089/api";

// Helper: lấy token từ localStorage
const getToken = () => localStorage.getItem("token");

// Helper: tạo headers với Authorization Bearer token
const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
});

// ============================================================
// AUTH APIs (public - không cần token)
// ============================================================
export const register = async (user) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  });
  return res.json();
};

export const login = async (user) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  });
  return res.json();
};

export const googleLogin = async (tokenId) => {
  const res = await fetch(`${API_URL}/auth/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokenId })
  });
  return res.json();
};

export const forgotPassword = async (email) => {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return res.json();
};

export const resetPassword = async (token, newPassword) => {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword })
  });
  return res.json();
};

export const sendOTP = async (email) => {
  const res = await fetch(`${API_URL}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return res.json();
};

export const verifyOTP = async (email, otp) => {
  const res = await fetch(`${API_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  });
  return res.json();
};

// ============================================================
// PROTECTED APIs (cần token - tự động gắn Authorization header)
// ============================================================
export const fetchWithAuth = async (endpoint, options = {}) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {})
    }
  });

  // Nếu server trả về 401/403 (token hết hạn / không hợp lệ / không đủ quyền) → xóa local state
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Redirect to login only if not already on login/home page to avoid infinite loops
    if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
        window.location.href = "/login";
    }
    return;
  }

  let data = {};
  try {
      data = await res.json();
  } catch {
      data = { message: res.statusText };
  }

  if (!res.ok) {
      return { 
          error: true, 
          message: data.message || data.error || res.statusText,
          status: res.status 
      };
  }

  return data;
};

// ============================================================
// PROFILE APIs (PROTECTED)
// ============================================================
export const getProfile = async () => {
  return fetchWithAuth("/users/profile", {
    method: "GET"
  });
};

export const getProfilePerformance = async () => {
  return fetchWithAuth("/users/profile/performance", {
    method: "GET"
  });
};

export const updateProfile = async (userData) => {
  return fetchWithAuth("/users/profile", {
    method: "PUT",
    body: JSON.stringify(userData)
  });
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/users/profile/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`
      // Không set Content-Type để trình duyệt tự nhận diện multipart/form-data
    },
    body: formData
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return;
  }

  return res.json();
};

// ============================================================
// BOOKING & SERVICES APIs
// ============================================================
export const getServices = async () => {
  const res = await fetch(`${API_URL}/services`);
  return res.json();
};

export const getServiceById = async (id) => {
  const res = await fetch(`${API_URL}/services/${id}`);
  return res.json();
};

export const getStaffBookings = async (email) => {
  return fetchWithAuth(`/bookings/staff?email=${email}`, {
    method: "GET"
  });
};

export const assignStaff = async (bookingId, staffId) => {
  const staffParams = Array.isArray(staffId) 
    ? staffId.map(id => `staffId=${id}`).join('&') 
    : `staffId=${staffId}`;
  return fetchWithAuth(`/bookings/${bookingId}/assign?${staffParams}`, {
    method: "PUT"
  });
};

export const updateBookingStatus = async (bookingId, status, proofImage = null) => {
  return fetchWithAuth(`/bookings/${bookingId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, proofImage })
  });
};

export const getUsers = async () => {
  return fetchWithAuth("/users", {
    method: "GET"
  });
};

export const getCategories = async () => {
  const res = await fetch(`${API_URL}/categories`);
  return res.json();
};

export const getFeaturedCategories = async () => {
  const res = await fetch(`${API_URL}/categories/featured`);
  return res.json();
};

export const createBooking = async (bookingData) => {
  return fetchWithAuth("/bookings", {
    method: "POST",
    body: JSON.stringify(bookingData)
  });
};

export const getBookings = async () => {
  return fetchWithAuth("/bookings", {
    method: "GET"
  });
};

export const getMyBookings = async (email) => {
  return fetchWithAuth(`/bookings/user?email=${email}`, {
    method: "GET"
  });
};

export const createService = async (serviceData) => {
  return fetchWithAuth("/services", {
    method: "POST",
    body: JSON.stringify(serviceData)
  });
};

export const updateService = async (id, serviceData) => {
  return fetchWithAuth(`/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(serviceData)
  });
};

export const deleteService = async (id) => {
  const res = await fetch(`${API_URL}/services/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return false;
  }
  
  return res.ok;
};

// Logout: xoá token và user khỏi localStorage
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const addReview = async (bookingId, rating, comment) => {
  let url = `/bookings/${bookingId}/review?rating=${rating}`;
  if (comment) url += `&comment=${encodeURIComponent(comment)}`;
  return fetchWithAuth(url, {
    method: "PUT"
  });
};

export const getReviews = async () => {
  const res = await fetch(`${API_URL}/public/reviews`);
  return res.json();
};

// --- LEAVE REQUEST APIs ---
export const createLeaveRequest = async (email, data) => {
  return fetchWithAuth(`/leaves?email=${email}`, {
    method: "POST",
    body: JSON.stringify(data)
  });
};

export const getMyLeaves = async (email) => {
  return fetchWithAuth(`/leaves/my?email=${email}`, {
    method: "GET"
  });
};

export const getAllLeaves = async () => {
  return fetchWithAuth(`/leaves`, {
    method: "GET"
  });
};

export const updateLeaveStatus = async (id, status) => {
  return fetchWithAuth(`/leaves/${id}/status?status=${status}`, {
    method: "PUT"
  });
};

export const getAvailableStaff = async () => {
  return fetchWithAuth("/users/staff/available", {
    method: "GET"
  });
};

// --- ACCOUNT / ROLE MANAGEMENT APIs ---
export const updateUserRole = async (userId, role) => {
  return fetchWithAuth(`/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role })
  });
};

export const deleteUser = async (userId) => {
  return fetchWithAuth(`/users/${userId}`, {
    method: "DELETE"
  });
};

// --- PAYMENT APIs ---
export const processCashPayment = async (bookingId) => {
  return fetchWithAuth(`/payments/${bookingId}/cash`, {
    method: "PUT"
  });
};

export const createMomoRemainingPayment = async (bookingId) => {
  const res = await fetch(`${API_URL}/momo/create-remaining-payment/${bookingId}`, {
    method: 'POST',
    headers: authHeaders()
  });
  return res.json();
};

export const getPaymentHistory = async (bookingId) => {
  return fetchWithAuth(`/payments/${bookingId}/history`, {
    method: "GET"
  });
};
// ============================================================
// VOUCHER APIs
// ============================================================
export const getActiveVouchers = async () => {
  return fetchWithAuth("/vouchers/active", {
    method: "GET"
  });
};

export const getAllVouchers = async () => {
  return fetchWithAuth("/vouchers", {
    method: "GET"
  });
};

export const createVoucher = async (data) => {
  return fetchWithAuth("/vouchers", {
    method: "POST",
    body: JSON.stringify(data)
  });
};

export const updateVoucher = async (id, data) => {
  return fetchWithAuth(`/vouchers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
};

export const deleteVoucher = async (id) => {
  return fetchWithAuth(`/vouchers/${id}`, {
    method: "DELETE"
  });
};

export const toggleVoucherStatus = async (id) => {
  return fetchWithAuth(`/vouchers/${id}/toggle`, {
    method: "PATCH"
  });
};

export const redeemVoucher = async (id) => {
  return fetchWithAuth(`/vouchers/${id}/redeem`, {
    method: "POST"
  });
};

export const getMyVoucherIds = async () => {
  return fetchWithAuth("/vouchers/my-voucher-ids", {
    method: "GET"
  });
};

export const getMyVouchers = async () => {
  return fetchWithAuth("/vouchers/my-vouchers", {
    method: "GET"
  });
};
