const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

export const register = async (user) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  return res.json();
};

export const login = async (user) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  return res.json();
};

export const googleLogin = async (tokenId) => {
  const res = await fetch(`${API_URL}/auth/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokenId }),
  });
  return res.json();
};

export const forgotPassword = async (email) => {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

export const resetPassword = async (token, newPassword) => {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  return res.json();
};

export const fetchWithAuth = async (endpoint, options = {}) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
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
      status: res.status,
    };
  }

  return data;
};

export const getProfile = async () =>
  fetchWithAuth("/users/profile", {
    method: "GET",
  });

export const updateProfile = async (userData) =>
  fetchWithAuth("/users/profile", {
    method: "PUT",
    body: JSON.stringify(userData),
  });

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/users/profile/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    body: formData,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return;
  }

  return res.json();
};

export const getServices = async () => {
  const res = await fetch(`${API_URL}/services`);
  return res.json();
};

export const getServiceById = async (id) => {
  const res = await fetch(`${API_URL}/services/${id}`);
  return res.json();
};

export const getStaffBookings = async (email) =>
  fetchWithAuth(`/bookings/staff?email=${email}`, {
    method: "GET",
  });

export const assignStaff = async (bookingId, staffId) =>
  fetchWithAuth(`/bookings/${bookingId}/assign?staffId=${staffId}`, {
    method: "PUT",
  });

export const updateBookingStatus = async (bookingId, status, proofImage = null) =>
  fetchWithAuth(`/bookings/${bookingId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, proofImage }),
  });

export const getUsers = async () =>
  fetchWithAuth("/users", {
    method: "GET",
  });

export const getCategories = async () => {
  const res = await fetch(`${API_URL}/categories`);
  return res.json();
};

export const createBooking = async (bookingData) =>
  fetchWithAuth("/booking", {
    method: "POST",
    body: JSON.stringify(bookingData),
  });

export const getBookings = async () =>
  fetchWithAuth("/booking", {
    method: "GET",
  });

export const getMyBookings = async (email) =>
  fetchWithAuth(`/booking/user?email=${email}`, {
    method: "GET",
  });

export const createService = async (serviceData) =>
  fetchWithAuth("/services", {
    method: "POST",
    body: JSON.stringify(serviceData),
  });

export const updateService = async (id, serviceData) =>
  fetchWithAuth(`/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(serviceData),
  });

export const deleteService = async (id) => {
  const res = await fetch(`${API_URL}/services/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return false;
  }

  return res.ok;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const addReview = async (bookingId, rating, comment) => {
  let url = `/bookings/${bookingId}/review?rating=${rating}`;
  if (comment) url += `&comment=${encodeURIComponent(comment)}`;
  return fetchWithAuth(url, {
    method: "PUT",
  });
};

export const createLeaveRequest = async (email, data) =>
  fetchWithAuth(`/leaves?email=${email}`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getMyLeaves = async (email) =>
  fetchWithAuth(`/leaves/my?email=${email}`, {
    method: "GET",
  });

export const getAllLeaves = async () =>
  fetchWithAuth("/leaves", {
    method: "GET",
  });

export const updateLeaveStatus = async (id, status) =>
  fetchWithAuth(`/leaves/${id}/status?status=${status}`, {
    method: "PUT",
  });

export const getAvailableStaff = async () =>
  fetchWithAuth("/users/staff/available", {
    method: "GET",
  });

export const updateUserRole = async (userId, role) =>
  fetchWithAuth(`/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });

export const deleteUser = async (userId) =>
  fetchWithAuth(`/users/${userId}`, {
    method: "DELETE",
  });
