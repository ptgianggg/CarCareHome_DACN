import { useEffect, useState, useMemo, useRef } from "react";
import {
    createService,
    deleteService,
    getServices,
    updateService,
    getCategories,
} from "../../services/api";
import "./style.css";

const ITEMS_PER_PAGE = 10;
const LOCAL_IMAGE_MAP_KEY = "service_local_images";

function normalizeService(service) {
    return {
        id: service.id,
        name: service.name || "",
        category: service.category || "",
        description: service.description || "",
        price: Number(service.price || 0),
        duration: Number(service.duration || 0),
        images: service.imageUrls || [],
        active: service.active ?? true,
    };
}

function formatPrice(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

const emptyForm = {
    name: "",
    price: "",
    duration: "",
    category: "",
    description: "",
    images: [],
    active: true,
};

function ServiceManagement() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [detailService, setDetailService] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [isCatFilterOpen, setIsCatFilterOpen] = useState(false);
    const [isCatFormOpen, setIsCatFormOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const catFilterRef = useRef(null);
    const catFormRef = useRef(null);

    const [localImageMap, setLocalImageMap] = useState(() => {
        try {
            const raw = localStorage.getItem(LOCAL_IMAGE_MAP_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch { return {}; }
    });

    useEffect(() => {
        localStorage.setItem(LOCAL_IMAGE_MAP_KEY, JSON.stringify(localImageMap));
    }, [localImageMap]);



    const PRICE_OPTIONS = [
        { value: "ALL", label: "Tất cả giá" },
        { value: "UNDER_100", label: "Dưới 100k" },
        { value: "100_500", label: "100k - 500k" },
        { value: "500_1000", label: "500k - 1tr" },
        { value: "OVER_1000", label: "Trên 1tr" }
    ];

    const STATUS_OPTIONS_FILTER = [
        { value: "ALL", label: "Tất cả trạng thái" },
        { value: "ACTIVE", label: "Đang hoạt động" },
        { value: "INACTIVE", label: "Tạm dừng" }
    ];

    const [filterPrice, setFilterPrice] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [isPriceOpen, setIsPriceOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);

    const priceRef = useRef(null);
    const statusRef = useRef(null);

    useEffect(() => {
        fetchData();
        const handleClickOutside = (e) => {
            if (catFilterRef.current && !catFilterRef.current.contains(e.target)) setIsCatFilterOpen(false);
            if (catFormRef.current && !catFormRef.current.contains(e.target)) setIsCatFormOpen(false);
            if (priceRef.current && !priceRef.current.contains(e.target)) setIsPriceOpen(false);
            if (statusRef.current && !statusRef.current.contains(e.target)) setIsStatusOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [svcData, catData] = await Promise.all([getServices(), getCategories()]);
            const list = Array.isArray(svcData) ? svcData.map(normalizeService) : [];
            setServices(list);
            setCategoryOptions(Array.isArray(catData) ? catData : []);
        } catch (error) {
            console.error("Fetch data error:", error);
            setServices([]);
            setCategoryOptions([]);
        } finally {
            setLoading(false);
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchData();
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const filteredServices = useMemo(() => {
        return (services || []).filter((svc) => {
            const matchesSearch = (svc.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (svc.description || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === "ALL" || svc.category === selectedCategory;
            
            let matchesPrice = true;
            if (filterPrice === "UNDER_100") matchesPrice = svc.price < 100000;
            else if (filterPrice === "100_500") matchesPrice = svc.price >= 100000 && svc.price <= 500000;
            else if (filterPrice === "500_1000") matchesPrice = svc.price > 500000 && svc.price <= 1000000;
            else if (filterPrice === "OVER_1000") matchesPrice = svc.price > 1000000;

            let matchesStatus = true;
            if (filterStatus === "ACTIVE") matchesStatus = svc.active;
            else if (filterStatus === "INACTIVE") matchesStatus = !svc.active;

            return matchesSearch && matchesCategory && matchesPrice && matchesStatus;
        });
    }, [services, searchTerm, selectedCategory, filterPrice, filterStatus]);

    const paginatedServices = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return (filteredServices || []).slice(start, start + ITEMS_PER_PAGE);
    }, [filteredServices, currentPage]);

    const totalPages = Math.ceil((filteredServices || []).length / ITEMS_PER_PAGE);
    useEffect(() => setCurrentPage(1), [searchTerm, selectedCategory, filterPrice, filterStatus]);

    const summary = useMemo(() => ({
        total: (services || []).length,
        active: (services || []).filter(s => s.active).length,
        premium: (services || []).filter(s => s.price > 500000).length
    }), [services]);

    function resolveImageUrl(service) {
        if (service.images && service.images.length > 0) return service.images[0];
        return localImageMap[String(service.id)]?.[0] || "";
    }

    function onImageChange(event) {
        const files = Array.from(event.target.files || []);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => setForm(p => ({ ...p, images: [...(p.images || []), String(reader.result)] }));
            reader.readAsDataURL(file);
        });
    }

    async function onSubmit(event) {
        event.preventDefault();
        const payload = {
            name: (form.name || "").trim(),
            category: (form.category || "").trim(),
            description: (form.description || "").trim(),
            price: Number(form.price),
            duration: Number(form.duration),
            imageUrls: (form.images || []).filter(img => !img.startsWith("data:")),
            active: Boolean(form.active),
        };

        if (!payload.name || !payload.category || !payload.price) return;

        try {
            const result = editingId ? await updateService(editingId, payload) : await createService(payload);
            const savedId = editingId || result?.id;
            if (savedId && (form.images || []).some(img => img.startsWith("data:"))) {
                setLocalImageMap(prev => ({ ...prev, [String(savedId)]: form.images }));
            }
            await fetchData();
            setIsFormOpen(false);
            setForm(emptyForm);
            setEditingId(null);
        } catch (error) { console.error("Save error:", error); }
    }

    function onEdit(service) {
        setEditingId(service.id);
        const imgs = (service.images && service.images.length > 0) ? service.images : (localImageMap[String(service.id)] || []);
        setForm({ ...service, images: imgs, price: String(service.price), duration: String(service.duration) });
        setIsFormOpen(true);
    }

    async function onDelete(id) {
        if (!window.confirm("Xóa dịch vụ này?")) return;
        try {
            const ok = await deleteService(id);
            if (ok) {
                setLocalImageMap(p => { const n = { ...p }; delete n[String(id)]; return n; });
                await fetchData();
                if (editingId === id) setIsFormOpen(false);
                if (detailService?.id === id) setDetailService(null);
            }
        } catch (error) { console.error(error); }
    }

    // Dynamic but more compact grid system
    const gridLayout = "2fr 1.2fr 80px 1.2fr 1fr 1fr";

    return (
        <div style={{ minHeight: '100%' }}>
            <header className="topbar">
                <div>
                    <p className="eyebrow" style={{ color: "var(--admin-primary)", opacity: 0.8 }}>CATALOG MANAGEMENT</p>
                    <h2 style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.04em', background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.4))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dịch Vụ CarCare</h2>
                </div>
            </header>

            <section className="stats-grid" style={{ marginBottom: '40px' }}>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), transparent)', backdropFilter: 'blur(10px)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <p className="eyebrow">TỔNG DỊCH VỤ</p>
                    <strong style={{ textShadow: '0 0 30px rgba(59, 130, 246, 0.4)' }}>{summary.total}</strong>
                    <span style={{ opacity: 0.5 }}>Trong hệ thống</span>
                </div>
                <div className="stat-card" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderLeft: '5px solid #10b981' }}>
                    <p className="eyebrow">ĐANG HOẠT ĐỘNG</p>
                    <strong style={{ color: '#10b981' }}>{summary.active}</strong>
                    <span style={{ opacity: 0.5 }}>Sẵn sàng</span>
                </div>
                <div className="stat-card" style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', borderLeft: '5px solid #8b5cf6' }}>
                    <p className="eyebrow">DỊCH VỤ CAO CẤP</p>
                    <strong style={{ color: '#8b5cf6' }}>{summary.premium}</strong>
                    <span style={{ opacity: 0.5 }}>Giá trên 500k</span>
                </div>
            </section>

            <section className="service-layout">
                <article className="panel" style={{ padding: '0', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', overflow: 'hidden' }}>

                    <div className="panel-heading" style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                        <div style={{ display: 'flex', gap: '15px', flex: 1, minWidth: '400px', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm dịch vụ..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', height: '60px', padding: '0 20px 0 55px', borderRadius: '18px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                />
                                <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-primary)' }}>
                                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                </div>
                            </div>

                            <div style={{ position: 'relative' }} ref={catFilterRef}>
                                <div onClick={() => setIsCatFilterOpen(!isCatFilterOpen)} style={{ height: '60px', minWidth: '180px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', display: 'flex', alignItems: 'center', padding: '0 20px', cursor: 'pointer', userSelect: 'none' }}>
                                    <span style={{ color: '#fff', fontWeight: '800', flex: 1, fontSize: '0.9rem' }}>{selectedCategory === "ALL" ? "Tất cả danh mục" : selectedCategory}</span>
                                    <svg style={{ transform: isCatFilterOpen ? 'rotate(180deg)' : 'none', transition: '0.3s', opacity: 0.5 }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                                {isCatFilterOpen && (
                                    <div style={{ position: 'absolute', top: '70px', width: '220px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '18px', padding: '8px', zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s ease' }}>
                                        <div onClick={() => { setSelectedCategory("ALL"); setIsCatFilterOpen(false); }} style={{ padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', color: selectedCategory === "ALL" ? '#3b82f6' : '#94a3b8', background: selectedCategory === "ALL" ? 'rgba(59, 130, 246, 0.1)' : 'transparent', fontSize: '0.85rem' }}> Tất cả danh mục</div>
                                        {(categoryOptions || []).map(cat => (
                                            <div key={cat.id} onClick={() => { setSelectedCategory(cat.name); setIsCatFilterOpen(false); }} style={{ padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', color: selectedCategory === cat.name ? '#3b82f6' : '#94a3b8', background: selectedCategory === cat.name ? 'rgba(59, 130, 246, 0.1)' : 'transparent', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                                                {cat.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ position: 'relative' }} ref={priceRef}>
                                <div onClick={() => setIsPriceOpen(!isPriceOpen)} style={{ height: '60px', minWidth: '160px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', display: 'flex', alignItems: 'center', padding: '0 20px', cursor: 'pointer', userSelect: 'none' }}>
                                    <span style={{ color: '#fff', fontWeight: '800', flex: 1, fontSize: '0.9rem' }}>{PRICE_OPTIONS.find(o => o.value === filterPrice).label}</span>
                                    <svg style={{ transform: isPriceOpen ? 'rotate(180deg)' : 'none', transition: '0.3s', opacity: 0.5 }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                                {isPriceOpen && (
                                    <div style={{ position: 'absolute', top: '70px', width: '180px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '18px', padding: '8px', zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s ease' }}>
                                        {PRICE_OPTIONS.map(opt => (
                                            <div key={opt.value} onClick={() => { setFilterPrice(opt.value); setIsPriceOpen(false); }} style={{ padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', color: filterPrice === opt.value ? '#3b82f6' : '#94a3b8', background: filterPrice === opt.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent', fontSize: '0.85rem' }}>
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ position: 'relative' }} ref={statusRef}>
                                <div onClick={() => setIsStatusOpen(!isStatusOpen)} style={{ height: '60px', minWidth: '180px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', display: 'flex', alignItems: 'center', padding: '0 20px', cursor: 'pointer', userSelect: 'none' }}>
                                    <span style={{ color: '#fff', fontWeight: '800', flex: 1, fontSize: '0.9rem' }}>{STATUS_OPTIONS_FILTER.find(o => o.value === filterStatus).label}</span>
                                    <svg style={{ transform: isStatusOpen ? 'rotate(180deg)' : 'none', transition: '0.3s', opacity: 0.5 }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                                {isStatusOpen && (
                                    <div style={{ position: 'absolute', top: '70px', width: '200px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '18px', padding: '8px', zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s ease' }}>
                                        {STATUS_OPTIONS_FILTER.map(opt => (
                                            <div key={opt.value} onClick={() => { setFilterStatus(opt.value); setIsStatusOpen(false); }} style={{ padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', color: filterStatus === opt.value ? '#3b82f6' : '#94a3b8', background: filterStatus === opt.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent', fontSize: '0.85rem' }}>
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={handleRefresh} style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                                <svg className={isRefreshing ? 'spinning' : ''} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                            </button>
                            <button onClick={() => { setForm(emptyForm); setEditingId(null); setIsFormOpen(true); }} className="primary-button" style={{ height: '60px', padding: '0 25px', borderRadius: '18px', fontWeight: '900' }}>+ THÊM DỊCH VỤ</button>
                        </div>
                    </div>

                    <div className="service-table" style={{ padding: '20px 0' }}>
                        <div className="booking-index-head" style={{ padding: '20px 40px', background: 'transparent', opacity: 0.5, fontWeight: '800', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'grid', gridTemplateColumns: gridLayout }}>
                            <span>Tên dịch vụ</span>
                            <span style={{ textAlign: 'center' }}>Nhóm</span>
                            <span style={{ textAlign: 'center' }}>Ảnh</span>
                            <span style={{ textAlign: 'center' }}>Giá tiền</span>
                            <span style={{ textAlign: 'center' }}>Trạng thái</span>
                            <span style={{ textAlign: 'right' }}>Thao tác</span>
                        </div>

                        {!loading && paginatedServices.map((svc) => (
                            <div key={svc.id} className="booking-item-row" onDoubleClick={() => setDetailService(svc)} style={{ display: 'grid', gridTemplateColumns: gridLayout, padding: '22px 40px', alignItems: 'center', margin: '0 10px' }}>
                                <span style={{ fontWeight: '800', fontSize: '1.2rem', color: '#fff' }}>{svc.name}</span>
                                <div style={{ textAlign: 'center' }}>
                                    <span className="cat-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '6px 14px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '900', display: 'inline-block' }}>{svc.category}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    {resolveImageUrl(svc) ? <img src={resolveImageUrl(svc)} alt="" style={{ width: '54px', height: '54px', borderRadius: '14px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.05)' }} /> : <div style={{ width: '54px', height: '54px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px' }}></div>}
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontWeight: '900', color: '#fff', fontSize: '1.2rem' }}>{formatPrice(svc.price)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <span className={`status ${svc.active ? 'success' : 'warning'}`} style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.65rem', minWidth: '100px', textAlign: 'center' }}>{svc.active ? "HOẠT ĐỘNG" : "TẠM DỪNG"}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button onClick={() => onEdit(svc)} style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', color: '#fff', border: 'none', cursor: 'pointer' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                                    <button onClick={() => onDelete(svc.id)} style={{ width: '44px', height: '44px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '14px', color: '#ef4444', border: 'none', cursor: 'pointer' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg></button>
                                </div>
                            </div>
                        ))}
                        {loading && !isRefreshing && <div style={{ padding: '100px', textAlign: 'center' }}><div className="spinner-heavy" style={{ margin: '0 auto' }}></div></div>}
                    </div>

                    {!loading && totalPages > 1 && (
                        <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ opacity: 0.4, fontSize: '0.9rem' }}>Hiển thị {paginatedServices.length} trong {filteredServices.length} dịch vụ</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setCurrentPage(c => Math.max(1, c - 1))} style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }}>{"<"}</button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button key={i} onClick={() => setCurrentPage(i + 1)} style={{ width: '44px', height: '44px', borderRadius: '12px', background: currentPage === i + 1 ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '800' }}>{i + 1}</button>
                                ))}
                                <button onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }}>{">"}</button>
                            </div>
                        </div>
                    )}
                </article>
            </section>

            {isFormOpen && (
                <div className="service-modal-backdrop" style={{ background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(15px)' }} onClick={() => setIsFormOpen(false)}>
                    <article className="panel service-modal" style={{ maxWidth: '850px', width: '95%', padding: '0', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '35px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <p className="eyebrow" style={{ color: '#3b82f6', fontWeight: '900' }}>{editingId ? "CẬP NHẬT" : "TẠO MỚI"}</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: '900', margin: '5px 0' }}>{editingId ? "Chỉnh Sửa Dịch Vụ" : "Thêm Dịch Vụ Mới"}</h3>
                        </div>

                        <form onSubmit={onSubmit} style={{ padding: '35px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <label className="form-group-label" style={{ display: 'block' }}>TÊN DỊCH VỤ <input name="name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', height: '54px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '0 20px', color: '#fff', marginTop: '8px' }} required /></label>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <label className="form-group-label">GIÁ TIỀN (VNĐ) <input name="price" type="number" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} style={{ width: '100%', height: '54px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '0 20px', color: '#fff', marginTop: '8px' }} required /></label>
                                        <label className="form-group-label">THỜI GIAN (PHÚT) <input name="duration" type="number" value={form.duration} onChange={(e) => setForm(p => ({ ...p, duration: e.target.value }))} style={{ width: '100%', height: '54px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '0 20px', color: '#fff', marginTop: '8px' }} required /></label>
                                    </div>

                                    <div style={{ position: 'relative' }} ref={catFormRef}>
                                        <label className="form-group-label">DANH MỤC</label>
                                        <div onClick={() => setIsCatFormOpen(!isCatFilterOpen)} style={{ height: '54px', width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', marginTop: '8px', display: 'flex', alignItems: 'center', padding: '0 20px', cursor: 'pointer' }}>
                                            <span style={{ color: form.category ? '#fff' : 'rgba(255,255,255,0.3)', fontWeight: '800' }}>{form.category || "Chọn danh mục..."}</span>
                                        </div>
                                        {isCatFormOpen && (
                                            <div style={{ position: 'absolute', top: '90px', width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '14px', padding: '5px', zIndex: 100 }}>
                                                {(categoryOptions || []).map(cat => (
                                                    <div key={cat.id} onClick={() => { setForm(p => ({ ...p, category: cat.name })); setIsCatFormOpen(false); }} style={{ padding: '12px 15px', borderRadius: '10px', cursor: 'pointer', background: form.category === cat.name ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: form.category === cat.name ? '#3b82f6' : '#fff' }}>{cat.name}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <label className="form-group-label">MÔ TẢ CHI TIẾT <textarea name="description" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} style={{ width: '100%', height: '142px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '15px 20px', color: '#fff', marginTop: '8px', resize: 'none' }} required /></label>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '14px' }}>
                                        <span style={{ fontWeight: '800' }}>TRẠNG THÁI HOẠT ĐỘNG</span>
                                        <div onClick={() => setForm(p => ({ ...p, active: !p.active }))} style={{ width: '50px', height: '26px', background: form.active ? '#3b82f6' : 'rgba(255,255,255,0.1)', borderRadius: '13px', position: 'relative', cursor: 'pointer', padding: '3px', transition: '0.3s' }}>
                                            <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transform: form.active ? 'translateX(24px)' : 'none', transition: '0.3s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '30px' }}>
                                <p className="eyebrow">HÌNH ẢNH DỊCH VỤ</p>
                                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '10px' }}>
                                    {(form.images || []).map((img, i) => (
                                        <div key={i} style={{ width: '100px', height: '100px', borderRadius: '14px', overflow: 'hidden', position: 'relative', border: '2px solid var(--admin-primary)' }}>
                                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button type="button" onClick={() => setForm(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))} style={{ position: 'absolute', top: 5, right: 5, width: 20, height: 20, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', cursor: 'pointer' }}>×</button>
                                        </div>
                                    ))}
                                    <label style={{ width: '100px', height: '100px', borderRadius: '14px', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}>
                                        <input type="file" accept="image/*" multiple onChange={onImageChange} hidden />
                                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                                    </label>
                                </div>
                            </div>

                            <div style={{ marginTop: '40px', display: 'flex', gap: '15px' }}>
                                <button type="submit" className="primary-button" style={{ flex: 1, height: '54px' }}>LƯU DỊCH VỤ</button>
                                <button type="button" onClick={() => setIsFormOpen(false)} className="ghost-button" style={{ height: '54px', padding: '0 30px' }}>HỦY</button>
                            </div>
                        </form>
                    </article>
                </div>
            )}

            {detailService && (
                <div className="service-modal-backdrop" style={{ background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(25px)', zIndex: 1001, position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', padding: '20px' }} onClick={() => setDetailService(null)}>
                    <article className="panel service-modal" style={{ maxWidth: '900px', width: '100%', padding: '0', background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 50px 100px rgba(0,0,0,0.6)', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ padding: '40px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.01)', flexShrink: 0 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <span style={{ padding: '6px 14px', borderRadius: '100px', background: 'rgba(59, 130, 246, 0.14)', color: '#3b82f6', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                                        Chi tiết dịch vụ #{detailService.id}
                                    </span>
                                    <span className={`status ${detailService.active ? 'success' : 'warning'}`} style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: '900' }}>
                                        {detailService.active ? "ĐANG KINH DOANH" : "ĐÃ TẠM DỪNG"}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '2.4rem', fontWeight: '900', margin: '0', letterSpacing: '-0.02em', color: '#fff' }}>{detailService.name}</h3>
                            </div>
                            <button onClick={() => setDetailService(null)} style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }}>
                                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div style={{ overflowY: 'auto', padding: '40px', flex: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) 1.5fr', gap: '40px' }}>
                                
                                <section>
                                    <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'rgba(255,255,255,0.3)', marginBottom: '20px', letterSpacing: '2px', textTransform: 'uppercase' }}>Hình ảnh thực tế</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {(() => {
                                            const imgs = (detailService.images && detailService.images.length > 0) ? detailService.images : (localImageMap[String(detailService.id)] || []);
                                            if (imgs.length === 0) return (
                                                <div style={{ height: '260px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.2)' }}>
                                                    Không có hình ảnh
                                                </div>
                                            );
                                            return (
                                                <>
                                                    <img src={imgs[0]} alt="" style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
                                                        {imgs.slice(1).map((link, idx) => (
                                                            <img key={idx} src={link} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }} />
                                                        ))}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </section>

                                <section>
                                    <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'rgba(255,255,255,0.3)', marginBottom: '20px', letterSpacing: '2px', textTransform: 'uppercase' }}>Thông tin chi tiết</h4>
                                    
                                    <div style={{ display: 'grid', gap: '20px' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>DANH MỤC NHÓM</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ padding: '6px 14px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.14)', color: '#3b82f6', fontWeight: '900', fontSize: '0.9rem' }}>{detailService.category}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>THỜI GIAN THI CÔNG</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '1.2rem', fontWeight: '900' }}>
                                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                                    {detailService.duration} phút
                                                </div>
                                            </div>

                                            <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#3b82f6', fontWeight: '900' }}>GIÁ NIÊM YẾT</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '1.6rem', fontWeight: '900' }}>
                                                    {formatPrice(detailService.price)}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <p style={{ margin: '0 0 15px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>MÔ TẢ DỊCH VỤ</p>
                                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', fontSize: '1rem' }}>
                                                {detailService.description || "Chưa có mô tả chi tiết cho dịch vụ này."}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        <div style={{ padding: '30px 40px', background: 'rgba(0,0,0,0.3)', textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <button onClick={() => setDetailService(null)} className="primary-button" style={{ padding: '18px 60px', borderRadius: '20px', fontWeight: '900' }}>HOÀN TẤT XEM</button>
                        </div>
                    </article>
                </div>
            )}

            <style>{`
                @keyframes spinning { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spinning { animation: spinning 1s linear infinite; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .booking-item-row { transition: 0.2s; border-radius: 14px; }
                .booking-item-row:hover { background: rgba(59, 130, 246, 0.05) !important; transform: translateX(5px); }
            `}</style>
        </div>
    );
}

export default ServiceManagement;
