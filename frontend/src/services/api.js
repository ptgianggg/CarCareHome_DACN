const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

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

  // Nếu server trả về 401 (token hết hạn / không hợp lệ) → logout
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return;
  }

  return res.json();
};

// ============================================================
// PROFILE APIs (PROTECTED)
// ============================================================
export const getProfile = async () => {
  return fetchWithAuth("/users/profile", {
    method: "GET"
  });
};

export const updateProfile = async (userData) => {
  return fetchWithAuth("/users/profile", {
    method: "PUT",
    body: JSON.stringify(userData)
  });
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

export const getCategories = async () => {
  const res = await fetch(`${API_URL}/categories`);
  return res.json();
};

export const createBooking = async (bookingData) => {
  return fetchWithAuth("/booking", {
    method: "POST",
    body: JSON.stringify(bookingData)
  });
};

export const getBookings = async () => {
  return fetchWithAuth("/booking", {
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
