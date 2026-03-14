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

// Logout: xoá token và user khỏi localStorage
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};