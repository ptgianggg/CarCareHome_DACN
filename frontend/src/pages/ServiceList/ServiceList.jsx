import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getServices } from "../../services/api";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./style.css";

const LOCAL_IMAGE_MAP_KEY = "service_local_images";
const API_BASE_URL = "http://localhost:8080";
const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1520340356584-f9d60d106df9?auto=format&fit=crop&q=80&w=400";

function ServiceImage({ service, localImageMap }) {
    const rawImage = (localImageMap[String(service.id)] || service.imageUrl || "").trim();

    const candidates = [];
    if (rawImage) {
        if (rawImage.startsWith("data:") || rawImage.startsWith("http")) {
            candidates.push(rawImage);
        } else if (rawImage.startsWith("/")) {
            candidates.push(`${API_BASE_URL}${rawImage}`);
            candidates.push(`${API_BASE_URL}/uploads${rawImage}`);
        } else {
            candidates.push(`${API_BASE_URL}/${rawImage}`);
            candidates.push(`${API_BASE_URL}/uploads/${rawImage}`);
            candidates.push(`${API_BASE_URL}/images/${rawImage}`);
            candidates.push(new URL(`../../assets/images/${rawImage}`, import.meta.url).href);
        }
    }
    candidates.push(FALLBACK_IMAGE);

    const [index, setIndex] = useState(0);

    useEffect(() => {
        setIndex(0);
    }, [rawImage, service.id]);

    return (
        <img
            src={candidates[Math.min(index, candidates.length - 1)]}
            alt={service.name}
            onError={() => {
                setIndex((prev) => (prev < candidates.length - 1 ? prev + 1 : prev));
            }}
        />
    );
}
const fallbackIcons = {
    "Bảo dưỡng định kỳ": "https://cdn-icons-png.flaticon.com/512/1971/1971050.png",
    "Chăm sóc": "https://cdn-icons-png.flaticon.com/512/2884/2884852.png",
    "Rửa xe & Hút bụi": "https://cdn-icons-png.flaticon.com/512/5759/5759083.png",
    "Sửa chữa": "https://cdn-icons-png.flaticon.com/512/3133/3133887.png",
    "Thuê xe": "https://cdn-icons-png.flaticon.com/512/1879/1879007.png"
};
const ServiceList = () => {
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [localImageMap, setLocalImageMap] = useState({});
    const navigate = useNavigate();
    const { categoryName } = useParams();

    useEffect(() => {
        try {
            const raw = localStorage.getItem(LOCAL_IMAGE_MAP_KEY);
            setLocalImageMap(raw ? JSON.parse(raw) : {});
        } catch {
            setLocalImageMap({});
        }
    }, []);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [catsRes, servsRes] = await Promise.all([
                    import("../../services/api").then(m => m.getCategories()),
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

    if (loading) {
        return (
            <div className="service-list-page">
                <Header />
                <div className="loading" style={{ minHeight: "50vh", display: "flex", justifyContent: "center", alignItems: "center" }}>Đang tải dịch vụ...</div>
                <Footer />
            </div>
        );
    }
    // Group active services by dynamic categories
    const activeServices = services.filter(s => s.active !== false);

    let groupedServices = categories.map(cat => ({
        title: cat.name,
        icon: cat.icon,
        id: cat.id,
        items: activeServices.filter(s => s.category === cat.name)
    })).filter(group => group.items.length > 0);

    // Collect other categories not in the DB
    const mappedCatNames = categories.map(c => c.name);
    const otherItems = activeServices.filter(s => !mappedCatNames.includes(s.category));
    if (otherItems.length > 0) {
        groupedServices.push({
            title: "Khác",
            icon: "",
            items: otherItems
        });
    }

    // Filter if categoryName exists in URL
    if (categoryName) {
        const decodedName = decodeURIComponent(categoryName);
        groupedServices = groupedServices.filter(g => g.title === decodedName);
    }

    const resolveIcon = (service) => {
        const localMapImg = localImageMap[String(service.id)];
        if (localMapImg && localMapImg.startsWith("data:")) return localMapImg;
        if (service.imageUrl) return `${API_BASE_URL}${service.imageUrl.startsWith('/') ? '' : '/'}${service.imageUrl}`;
        return fallbackIcons[service.category] || FALLBACK_IMAGE;
    };

    return (
        <div className="service-list-page" style={{ backgroundColor: "#f3f4f6" }}>
            <Header />
            <div className="categories-layout">
                <div className="category-top-bar">
                    <button className="icon-btn" onClick={() => navigate(categoryName ? "/services" : "/home")}>←</button>
                    <span className="title">{categoryName ? decodeURIComponent(categoryName) : "Tất cả dịch vụ"}</span>
                    <button className="icon-btn" onClick={() => navigate("/home")}>🏠</button>
                </div>

                {groupedServices.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                        Chưa có dịch vụ nào đang hoạt động.
                    </div>
                ) : null}

                {groupedServices.map((cat, idx) => (
                    <div className="category-section" key={idx} id={cat.title.replace(/\s+/g, '-').toLowerCase()}>
                        <h2 className="cat-heading">
                            {cat.icon && <img src={cat.icon} alt="" style={{ width: 24, height: 24, verticalAlign: 'middle', marginRight: 8 }} />}
                            {cat.title}
                        </h2>
                        <div className="cat-grid">
                            {cat.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="cat-card"
                                    onClick={() => navigate(`/services/detail/${item.id}`)}
                                >
                                    <img src={resolveIcon(item)} alt={item.name} className="cat-icon" onError={(e) => { e.target.src = cat.icon || fallbackIcons[cat.title] || FALLBACK_IMAGE; }} />
                                    <span className="cat-label">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <Footer />
        </div>
    );
};

export default ServiceList;



