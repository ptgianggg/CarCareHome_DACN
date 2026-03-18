import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import "@/pages/Admin/style.css";

const AdminLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 22, height: 22 }}>
              <path d="M5 13L3 15V18H21V15L19 13H5Z" strokeLinejoin="round" />
              <path d="M5 13L7 7H17L19 13" strokeLinejoin="round" />
              <circle cx="8" cy="18" r="2" fill="currentColor" />
              <circle cx="16" cy="18" r="2" fill="currentColor" />
              <path d="M9 10H15" strokeLinecap="round" />
            </svg>
          </div>
          <div className="brand-copy">
            <p className="eyebrow" style={{marginBottom: 0}}>Admin Panel</p>
            <h1 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#fff", lineHeight: 1 }}>CarCare<span style={{ color: "var(--admin-primary)" }}>Home</span></h1>
          </div>
        </div>

        <nav className="sidebar-nav" style={{ marginTop: "2rem" }}>
          <NavLink to="/admin/services" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            Dịch vụ
          </NavLink>
          <NavLink to="/admin/categories" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Danh mục
          </NavLink>
          <NavLink to="/admin/booking" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Lịch hẹn
          </NavLink>
        </nav>

        <div className="sidebar-card notice-item" style={{ marginTop: "auto" }}>
          <div className="notice-head">
            <span className="notice-level">Hệ thống</span>
          </div>
          <h2>Bảng điều khiển phiên bản cao cấp. Mọi hệ thống ổn định.</h2>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button className="primary-button" onClick={() => navigate("/")} style={{ flex: 1, padding: "10px", fontSize: "0.85rem" }}>
            Ra trang web
          </button>
          <button className="admin-exit-btn ghost-button" onClick={handleLogout} style={{ flex: 1, padding: "10px", marginTop: 0, textAlign: "center", fontSize: "0.85rem" }}>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="dashboard" style={{ overflowY: "auto", height: "100vh" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
