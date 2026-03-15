import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCategories, getServices } from "../../services/api";
import "./Header.css";

const fallbackCategories = [
    { id: 1, name: "Bảo dưỡng định kỳ" },
    { id: 2, name: "Chăm sóc" },
    { id: 3, name: "Rửa xe & Hút bụi" },
    { id: 4, name: "Sửa chữa" },
    { id: 5, name: "Thuê xe" }
];

const Header = () => {
    const navigate = useNavigate();
    const [authVersion, setAuthVersion] = useState(0);
    const [isServiceMenuOpen, setIsServiceMenuOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);

    const currentUser = useMemo(() => {
        try {
            const raw = localStorage.getItem("user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }, [authVersion]);

    const displayName =
        currentUser?.name?.trim() || currentUser?.email?.trim() || "bạn";
    const role = String(currentUser?.role || "").toUpperCase();
    const isAdmin = role === "ADMIN" || role === "ROLE_ADMIN";

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                const [cats, servs] = await Promise.all([getCategories(), getServices()]);
                if (!isMounted) return;
                setCategories(Array.isArray(cats) && cats.length > 0 ? cats : fallbackCategories);
                setServices(Array.isArray(servs) ? servs : []);
            } catch (error) {
                console.error("Load header data failed:", error);
                if (isMounted) setCategories(fallbackCategories);
            }
        }

        loadData();
        return () => {
            isMounted = false;
        };
    }, []);

    const groupedServices = useMemo(() => {
        const activeOnes = services.filter(s => s.active !== false);
        const map = {};
        categories.forEach(cat => {
            map[cat.name] = activeOnes.filter(s => s.category === cat.name);
        });
        return map;
    }, [services, categories]);

    function onLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setAuthVersion((prev) => prev + 1);
        navigate("/home");
    }

    return (
        <div className="header-wrapper">
            <header className="home-nav">
                <Link to="/home" className="home-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <span className="home-brand-mark">CC</span>
                    <span>CarCareHome</span>
                </Link>
                <nav className="home-menu">
                    <Link to="/home">Trang chủ</Link>
                    <div
                        className={`home-menu-dropdown ${isServiceMenuOpen ? "open" : ""}`}
                        onMouseEnter={() => setIsServiceMenuOpen(true)}
                        onMouseLeave={() => {
                            setIsServiceMenuOpen(false);
                            setActiveCategory(null);
                        }}
                    >
                        <button
                            type="button"
                            className="home-menu-trigger"
                            aria-haspopup="true"
                            aria-expanded={isServiceMenuOpen}
                            onClick={() => setIsServiceMenuOpen((prev) => !prev)}
                        >
                            Dịch vụ
                        </button>
                        <div className="home-dropdown-panel hierarchical">
                            <div className="category-list">
                                <Link
                                    to="/services"
                                    className="all-services-link"
                                    onClick={() => setIsServiceMenuOpen(false)}
                                    onMouseEnter={() => setActiveCategory(null)}
                                >
                                    Tất cả dịch vụ
                                </Link>
                                {categories.map((cat) => (
                                    <div
                                        key={cat.id || cat.name}
                                        className={`category-item-wrapper ${activeCategory === cat.name ? 'active' : ''}`}
                                        onMouseEnter={() => setActiveCategory(cat.name)}
                                    >
                                        <Link
                                            to={`/services/${encodeURIComponent(cat.name)}`}
                                            className="category-item-link"
                                            onClick={() => setIsServiceMenuOpen(false)}
                                        >
                                            {cat.name}
                                            <span className="arrow-right">›</span>
                                        </Link>
                                    </div>
                                ))}
                            </div>

                            <div className={`services-sub-panel ${activeCategory ? 'visible' : ''}`}>
                                {activeCategory ? (
                                    <>
                                        <p className="sub-panel-title">{activeCategory}</p>
                                        <div className="sub-services-grid">
                                            {groupedServices[activeCategory]?.length > 0 ? (
                                                groupedServices[activeCategory].map(svc => (
                                                    <Link
                                                        key={svc.id}
                                                        to={`/services/detail/${svc.id}`}
                                                        className="sub-service-link"
                                                        onClick={() => setIsServiceMenuOpen(false)}
                                                    >
                                                        <span className="svc-dot">•</span>
                                                        {svc.name}
                                                    </Link>
                                                ))
                                            ) : (
                                                <p className="empty-sub">Chưa có dịch vụ con</p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="sub-panel-placeholder">
                                        <p>Chọn một danh mục để xem danh sách dịch vụ chi tiết.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <a href="/home#products">Sản phẩm</a>
                    <a href="/home#contact">Liên hệ</a>
                </nav>
                <div className="home-nav-actions">
                    {currentUser ? (
                        <>
                            <span className="home-user-pill">Xin chào, {displayName}</span>
                            {isAdmin ? (
                                <button
                                    type="button"
                                    className="home-secondary-btn"
                                    onClick={() => navigate("/admin")}
                                >
                                    Quản trị
                                </button>
                            ) : null}
                            <button type="button" className="home-link-btn" onClick={onLogout}>
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="home-link-btn">
                                Đăng nhập
                            </Link>
                            <Link to="/register" className="home-primary-btn">
                                Đăng ký
                            </Link>
                        </>
                    )}
                </div>
            </header>
        </div>
    );
};

export default Header;
