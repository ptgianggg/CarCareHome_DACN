import { useAuth } from "@/context/AuthContext";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  UserCircle2,
  Wrench,
  X
} from "lucide-react";
import "./Header.css";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:8089/api").replace(/\/api$/, "");

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "ROLE_ADMIN" || user?.role === "ADMIN";
  const isStaff = user?.role === "ROLE_STAFF" || user?.role === "STAFF";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const nextSearch = location.pathname.startsWith("/services")
      ? new URLSearchParams(location.search).get("q") || ""
      : "";
    setSearchQuery(nextSearch);
    setShowDropdown(false);
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const portalLink = useMemo(() => {
    if (isAdmin) {
      return { to: "/admin/services", label: "Trang quản trị" };
    }
    if (isStaff) {
      return { to: "/staff/tasks", label: "Cổng kỹ thuật" };
    }
    return null;
  }, [isAdmin, isStaff]);

  const navLinks = useMemo(() => {
    const links = [
      { to: "/", label: "Trang chủ" },
      { to: "/services", label: "Dịch vụ" },
      { to: "/booking", label: "Đặt lịch" }
    ];

    if (user) {
      links.push({ to: "/my-bookings", label: "Lịch hẹn" });
    }

    return links;
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextQuery = searchQuery.trim();
    navigate(nextQuery ? `/services?q=${encodeURIComponent(nextQuery)}` : "/services");
  };

  const avatarText = user?.name?.charAt(0)?.toUpperCase() || "C";
  const avatarSrc = user?.avatar ? `${API_ORIGIN}${user.avatar}` : null;

  return (
    <header className={`main-header ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="header-shell">
        <Link to="/" className="header-brand">
          <div className="header-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 13L3 15V18H21V15L19 13H5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M5 13L7 7H17L19 13" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <circle cx="8" cy="18" r="2" fill="currentColor" />
              <circle cx="16" cy="18" r="2" fill="currentColor" />
              <path d="M9 10H15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div className="brand-copy">
            <span className="brand-kicker">Chăm xe tại nhà</span>
            <strong>CarCareHome</strong>
          </div>
        </Link>

        <div className="header-center">
          <nav className="header-nav">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive || (item.to === "/services" && location.pathname.startsWith("/services"))
                    ? "nav-link active"
                    : "nav-link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <form className="header-search" onSubmit={handleSearchSubmit}>
            <Search size={18} />
            <input
              type="search"
              placeholder="Tìm dịch vụ, vệ sinh nội thất, ceramic..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </form>
        </div>

        <div className="header-actions">
          {user ? (
            <div className="header-user-group">
              <button type="button" className="header-user-button" onClick={() => setShowDropdown((prev) => !prev)}>
                <span className="header-user-avatar">
                  {avatarSrc ? <img src={avatarSrc} alt={user.name || "Avatar"} className="header-avatar-img" /> : avatarText}
                </span>
                <span className="header-user-copy">
                  <strong>{user.name || "Khách hàng"}</strong>
                  <small>{isAdmin ? "Quản trị viên" : isStaff ? "Kỹ thuật viên" : "Tài khoản cá nhân"}</small>
                </span>
                <ChevronDown size={18} className={`header-chevron ${showDropdown ? "open" : ""}`} />
              </button>

              {showDropdown && (
                <>
                  <button type="button" className="dropdown-scrim" onClick={() => setShowDropdown(false)} aria-label="Đóng menu" />
                  <div className="header-dropdown">
                    <div className="dropdown-top">
                      <p>{user.email}</p>
                    </div>
                    <Link to="/profile" className="dropdown-link" onClick={() => setShowDropdown(false)}>
                      <UserCircle2 size={17} />
                      Hồ sơ của tôi
                    </Link>
                    <Link to="/my-bookings" className="dropdown-link" onClick={() => setShowDropdown(false)}>
                      <CalendarClock size={17} />
                      Theo dõi lịch hẹn
                    </Link>
                    {portalLink && (
                      <Link to={portalLink.to} className="dropdown-link" onClick={() => setShowDropdown(false)}>
                        <LayoutDashboard size={17} />
                        {portalLink.label}
                      </Link>
                    )}
                    <button type="button" className="dropdown-link danger" onClick={handleLogout}>
                      <LogOut size={17} />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="auth-actions">
              <Link to="/login" className="auth-link subtle">Đăng nhập</Link>
              <Link to="/register" className="auth-link primary">Tạo tài khoản</Link>
            </div>
          )}

          <button
            type="button"
            className="menu-toggle"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div className={`header-mobile-panel ${mobileOpen ? "open" : ""}`}>
        <form className="header-search mobile" onSubmit={handleSearchSubmit}>
          <Search size={18} />
          <input
            type="search"
            placeholder="Tìm dịch vụ nhanh"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </form>

        <nav className="mobile-nav">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive || (item.to === "/services" && location.pathname.startsWith("/services"))
                  ? "mobile-nav-link active"
                  : "mobile-nav-link"
              }
            >
              {item.to === "/booking" ? <Wrench size={18} /> : <span className="mobile-dot" />}
              {item.label}
            </NavLink>
          ))}

          {portalLink && (
            <NavLink to={portalLink.to} className="mobile-nav-link">
              <LayoutDashboard size={18} />
              {portalLink.label}
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;