import { createContext, useContext, useState, useEffect } from "react";
import { logout as apiLogout } from "@/services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user and token on initial load
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // Tự động quét lại Database ngầm trên Foreground để đồng bộ Avatar thật
      import("@/services/api").then(({ getProfile }) => {
        getProfile().then(data => {
          if (data && data.avatar && data.avatar !== parsedUser.avatar) {
            const updatedUser = { ...parsedUser, avatar: data.avatar, name: data.name || parsedUser.name };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        }).catch(() => {});
      });
    }
    setLoading(false);
  }, []);

  const login = async (userData, token) => {
    localStorage.setItem("token", token);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Nếu quá trình Login từ backend trả về không chứa avatar, gọi ngay getProfile để vá lỗi ngầm
    if (!userData.avatar) {
      try {
        const { getProfile } = await import("@/services/api");
        const data = await getProfile();
        if (data && data.avatar) {
           const fullUser = { ...userData, avatar: data.avatar, name: data.name || userData.name };
           setUser(fullUser);
           localStorage.setItem("user", JSON.stringify(fullUser));
        }
      } catch (e) {
        // im lặng
      }
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN" || user?.role === "ROLE_ADMIN",
    isStaff: user?.role === "STAFF" || user?.role === "ROLE_STAFF",
    isUser: user?.role === "USER" || user?.role === "ROLE_USER",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
