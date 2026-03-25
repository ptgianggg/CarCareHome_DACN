import { createContext, useContext, useState, useEffect } from "react";
import { logout as apiLogout } from "@/services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoyaltyVerified, setIsLoyaltyVerified] = useState(false);

  useEffect(() => {
    // Load user and token on initial load
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // Tự động quét lại Database ngầm trên Foreground để đồng bộ dữ liệu thật (Avatar, Points, Tier, ...)
      import("@/services/api").then(({ getProfile }) => {
        getProfile().then(data => {
          if (!data || data.error) {
            // Nếu session không hợp lệ trên backend này (vd máy B đã cài mới DB) -> Clear state
            setUser(null);
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            return;
          }
          // Đồng bộ toàn bộ thông tin mới nhất từ Profile vào Context
          const updatedUser = { 
            ...parsedUser, 
            avatar: data.avatar, 
            name: data.name || parsedUser.name,
            phone: data.phone,
            points: data.points,
            pointsLifetime: data.pointsLifetime,
            tier: data.tier,
            role: data.role // Đảm bảo role cũng khớp
          };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }).catch(() => {
          // Lỗi mạng hoặc server sập -> Tạm thời giữ state nhưng thường fetchWithAuth đã xử lý logout nếu là 4XX
        });
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
           const fullUser = { ...userData, avatar: data.avatar, name: data.name || userData.name, phone: data.phone };
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
    setIsLoyaltyVerified(false);
  };

  const verifyLoyalty = () => {
    setIsLoyaltyVerified(true);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isLoyaltyVerified,
    verifyLoyalty,
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
