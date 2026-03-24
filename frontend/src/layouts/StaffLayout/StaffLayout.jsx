import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import "@/pages/Staff/style.css";

const StaffLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="staff-shell">
            <aside className="staff-sidebar">
                <div className="staff-brand">
                    <div className="staff-brand-mark">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 22, height: 22 }}>
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                        </svg>
                    </div>
                    <div className="brand-copy">
                        <p className="eyebrow" style={{ color: 'var(--staff-text-muted)', marginBottom: 0 }}>Staff Portal</p>
                        <h1 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#fff", lineHeight: 1, margin: 0 }}>
                            CarCare<span style={{ color: "var(--staff-primary)" }}>Home</span>
                        </h1>
                    </div>
                </div>

                <nav className="staff-nav">
                    <NavLink to="/staff/tasks" className={({ isActive }) => (isActive ? "staff-nav-item active" : "staff-nav-item")}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Nhiệm vụ của tôi
                    </NavLink>
                    <NavLink to="/staff/profile" className={({ isActive }) => (isActive ? "staff-nav-item active" : "staff-nav-item")}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Hồ sơ
                    </NavLink>
                </nav>

                <div style={{ marginTop: "auto" }}>
                    <button className="staff-primary-btn" onClick={() => navigate("/")} style={{ width: "100%", padding: "12px", fontSize: "0.85rem", background: 'var(--staff-glass-strong)', border: '1px solid var(--staff-border)' }}>
                        Về trang chủ
                    </button>
                </div>
            </aside>

            <main className="staff-main">
                <header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                    <span style={{ color: 'var(--staff-text-soft)', fontSize: '0.9rem' }}>
                        Xin chào, {user?.name || "Kỹ thuật viên"}
                    </span>
                    <button className="logout-icon-btn" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}>
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </header>
                <Outlet />
            </main>
        </div>
    );
};

export default StaffLayout;
