const API_URL = "http://localhost:8080/api";

const parseErrorMessage = async (res, fallback) => {
    let message = fallback;
    try {
        const text = await res.text();
        if (!text) {
            return `[${res.status}] ${message}`;
        }
        try {
            const obj = JSON.parse(text);
            message = obj?.message || obj?.error || text;
        } catch {
            message = text;
        }
    } catch (error) {
        console.debug("Cannot parse error response:", error);
    }
    return `[${res.status}] ${message}`;
};

// ===============================
// TOKEN
// ===============================

const getToken = () => {
    return localStorage.getItem("token");
};

const authHeaders = () => {
    const token = getToken();

    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
    };
};

// ===============================
// AUTH
// ===============================

export const register = async (user) => {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    });

    return res.json();
};

export const login = async (user) => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    });

    const data = await res.json();

    // lưu token ngay khi login thành công
    if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
    }

    return data;
};

export const googleLogin = async (tokenId) => {
    const res = await fetch(`${API_URL}/auth/google-login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ tokenId })
    });

    const data = await res.json();

    if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
    }

    return data;
};

// ===============================
// HELPER FETCH
// ===============================

export const fetchWithAuth = async (endpoint, options = {}) => {
    try {

        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                ...authHeaders(),
                ...(options.headers || {})
            }
        });

        if (res.status === 401) {

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            alert("Phiên đăng nhập hết hạn");

            window.location.href = "/login";

            return { error: true };
        }

        if (!res.ok) {

            if (res.status === 403) {
                return {
                    error: true,
                    message: "Bạn không có quyền thực hiện thao tác này (403)"
                };
            }

            const err = await res.json();
            return { error: true, message: err.message };
        }

        return await res.json();

    } catch (err) {

        console.error("API ERROR:", err);

        return {
            error: true,
            message: "Không thể kết nối server"
        };
    }
};

// ===============================
// SERVICES
// ===============================

export const getServices = async () => {

    const res = await fetch(`${API_URL}/services`);

    if (!res.ok) return [];

    return res.json();
};

export const getServiceById = async (id) => {

    const res = await fetch(`${API_URL}/services/${id}`);

    if (!res.ok) return null;

    return res.json();
};

export const createService = async (service) => {
    const res = await fetch(`${API_URL}/services`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(service),
    });

    if (!res.ok) {
        const message = await parseErrorMessage(res, "Khong the tao dich vu");
        return { error: true, message };
    }

    return res.json();
};

export const updateService = async (id, service) => {
    const res = await fetch(`${API_URL}/services/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(service)
    });

    if (!res.ok) {
        const message = await parseErrorMessage(res, "Khong the cap nhat dich vu");
        return { error: true, message };
    }

    return res.json();
};

export const deleteService = async (id) => {

    const res = await fetch(`${API_URL}/services/${id}`, {
        method: "DELETE"
    });

    return res.ok;
};

// ===============================
// CATEGORIES
// ===============================

export const getCategories = async () => {
    const res = await fetch(`${API_URL}/categories`);
    if (!res.ok) return [];
    return res.json();
};

export const createCategory = async (category) => {
    const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category)
    });
    if (!res.ok) {
        const message = await parseErrorMessage(res, "Khong the tao danh muc");
        return { error: true, message };
    }
    return res.json();
};

export const updateCategory = async (id, category) => {
    const res = await fetch(`${API_URL}/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category)
    });
    if (!res.ok) {
        const message = await parseErrorMessage(res, "Khong the cap nhat danh muc");
        return { error: true, message };
    }
    return res.json();
};

export const deleteCategory = async (id) => {
    const res = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE"
    });
    return res.ok;
};

// ===============================
// BOOKINGS
// ===============================

export const createBooking = async (booking) => {
    const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(booking),
    });

    if (!res.ok) {
        const message = await parseErrorMessage(res, "Khong the tao lich hen");
        return { error: true, message };
    }

    return res.json();
};

// ===============================
// LOGOUT
// ===============================

export const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";

};

export const getBookings = async () => {
    const res = await fetch(`${API_URL}/bookings`);
    if (!res.ok) return [];
    return res.json();
};


