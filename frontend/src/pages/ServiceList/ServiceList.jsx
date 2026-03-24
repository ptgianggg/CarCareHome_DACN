import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getServices, getCategories } from "../../services/api";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./style.css";

const API_BASE_URL = "http://localhost:8089";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1520340356584-f9d60d106df9?auto=format&fit=crop&q=80&w=400";

const ServiceList = () => {
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [localImageMap, setLocalImageMap] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const { categoryName } = useParams();

    useEffect(() => {
        try {
            const raw = localStorage.getItem("service_local_images");
            setLocalImageMap(raw ? JSON.parse(raw) : {});
        } catch {
            setLocalImageMap({});
        }
    }, []);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [catsRes, servsRes] = await Promise.all([
                    getCategories(),
                    getServices()
                ]);
                setCategories(Array.isArray(catsRes) ? catsRes : []);
                setServices(Array.isArray(servsRes) ? servsRes : []);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const activeServices = useMemo(() => {
        return services.filter(s => s.active !== false);
    }, [services]);

    const groupedServices = useMemo(() => {
        let result = categories.map(cat => ({
            ...cat,
            items: activeServices.filter(s => s.category === cat.name)
        })).filter(group => group.items.length > 0);

        if (searchTerm.trim()) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.map(group => ({
                ...group,
                items: group.items.filter(item =>
                    item.name.toLowerCase().includes(lowerSearch) ||
                    (item.description && item.description.toLowerCase().includes(lowerSearch))
                )
            })).filter(group => group.items.length > 0);
        }

        if (categoryName) {
            const decodedName = decodeURIComponent(categoryName);
            result = result.filter(g => g.name === decodedName);
        }

        return result;
    }, [categories, activeServices, searchTerm, categoryName]);

    const resolveIcon = (service) => {
        // 1. Kiểm tra list ảnh từ DB (imageUrls)
        if (Array.isArray(service.imageUrls) && service.imageUrls.length > 0) {
            const url = service.imageUrls[0];
            return url.startsWith("http") ? url : `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
        }

        // 2. Kiểm tra ảnh cũ (imageUrl) để tương thích ngược
        if (service.imageUrl) {
            return service.imageUrl.startsWith("http")
                ? service.imageUrl
                : `${API_BASE_URL}${service.imageUrl.startsWith("/") ? "" : "/"}${service.imageUrl}`;
        }

        // 3. Kiểm tra ảnh cục bộ (Local Storage)
        const localImg = localImageMap[String(service.id)];
        if (localImg) {
            const firstLocal = Array.isArray(localImg) ? localImg[0] : localImg;
            if (typeof firstLocal === "string" && firstLocal.startsWith("data:")) {
                return firstLocal;
            }
        }

        return FALLBACK_IMAGE;
    };

    if (loading) {
        return (
            <div className="service-list-page">
                <Header />
                <div className="loading-refined">
                    <div className="spinner-heavy"></div>
                    <p>Đang chuẩn bị danh sách dịch vụ...</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="service-list-page">
            <Header />


            {/* Sticky Category Nav */}
            <div className="category-nav-wrapper">
                <div className="category-nav-scroll">
                    <div
                        className={`cat-nav-item ${!categoryName ? 'active' : ''}`}
                        onClick={() => navigate("/services")}
                    >
                        <span className="cat-nav-label">Tất cả</span>
                    </div>
                    {categories.map(cat => (
                        <div
                            key={cat.id}
                            className={`cat-nav-item ${categoryName === encodeURIComponent(cat.name) ? 'active' : ''}`}
                            onClick={() => navigate(`/services/${encodeURIComponent(cat.name)}`)}
                        >
                            {cat.icon && <img src={cat.icon} alt="" className="cat-nav-icon" />}
                            <span className="cat-nav-label">{cat.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <main className="service-content-main">
                {/* Search Bar */}
                <div className="search-filter-section">
                    <div className="search-input-group">
                        <input
                            type="text"
                            placeholder="Tìm kiếm dịch vụ bạn cần..."
                            className="premium-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="search-icon-btn">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                        </div>
                    </div>
                </div>

                {groupedServices.length === 0 ? (
                    <div className="loading-refined">
                        <p>Không tìm thấy dịch vụ nào đang hoạt động trong mục này.</p>
                        <button onClick={() => setSearchTerm("")} className="btn-solid" style={{ marginTop: '20px' }}>Hiện tất cả</button>
                    </div>
                ) : null}

                {groupedServices.map((cat, idx) => (
                    <div key={cat.id || idx} className="category-block" id={cat.name.replace(/\s+/g, '-').toLowerCase()}>
                        <div className="block-header">
                            {cat.icon && <img src={cat.icon} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />}
                            <h2>{cat.name}</h2>
                            <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to right, #edf2f7, transparent)', marginLeft: '10px' }}></div>
                        </div>

                        <div className="services-grid-refined">
                            {cat.items.map((service) => (
                                <div
                                    key={service.id}
                                    className="premium-card"
                                    onClick={() => navigate(`/services/detail/${service.id}`)}
                                >
                                    <div className="card-image-wrap">
                                        <img src={resolveIcon(service)} alt={service.name} />
                                        <div className="badge-overlay">
                                            <div className="price-badge-floating">
                                                {Number(service.price).toLocaleString()} đ
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-body-modern">
                                        <h3>{service.name}</h3>
                                        <p className="desc">{service.description || "Dịch vụ chăm sóc xe chuyên nghiệp nhất tại Car Care Home."}</p>

                                        <div className="card-footer-flex">
                                            <div className="duration-info">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="7" cy="7" r="6" /><path d="M7 3v4l2 2" /></svg>
                                                <span>60-90 phút</span>
                                            </div>
                                            <div className="view-btn-circle">
                                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </main>

            <Footer />
        </div>
    );
};

export default ServiceList;
