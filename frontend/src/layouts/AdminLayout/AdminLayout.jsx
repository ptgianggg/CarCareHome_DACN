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
          <NavLink to="/admin/settings" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Cấu hình
          </NavLink>
        </nav>
        
        <div style={{ marginTop: "auto", paddingTop: "20px" }}>
          <button className="primary-button" onClick={() => navigate("/")} style={{ width: "100%", padding: "12px", fontSize: "0.85rem" }}>
            Ra trang web
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="dashboard" style={{ overflowY: "auto", height: "100vh", position: 'relative' }}>
        {/* TOP HEADER */}
        <header className="admin-top-header" style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '20px',
          padding: '10px 0'
        }}>
          <div className="admin-user-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--admin-text-soft)', fontWeight: '500' }}>
              Xin chào, {user?.name || "Quản trị viên"}
            </span>
          </div>
          <button 
            className="logout-icon-btn" 
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 20, height: 20 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
