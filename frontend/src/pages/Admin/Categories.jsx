import { useEffect, useState, useMemo } from "react";
import { getCategories, fetchWithAuth } from "../../services/api";
import "./style.css";

const emptyForm = {
    name: "",
    icon: "",
};

function CategoryManagement() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const data = await getCategories();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Fetch categories error:", error);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchData();
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const filteredCategories = useMemo(() => {
        return (categories || []).filter((cat) =>
            (cat.name || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [categories, searchTerm]);

    const summary = useMemo(() => ({
        total: (categories || []).length,
        withIcon: (categories || []).filter(c => c.icon).length
    }), [categories]);

    function onChange(event) {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function onIconChange(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm((prev) => ({ ...prev, icon: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    }

    async function onSubmit(event) {
        event.preventDefault();
        const payload = { name: (form.name || "").trim(), icon: form.icon };
        if (!payload.name) return;

        try {
            const endpoint = editingId ? `/categories/${editingId}` : "/categories";
            const method = editingId ? "PUT" : "POST";
            const result = await fetchWithAuth(endpoint, {
                method,
                body: JSON.stringify(payload),
            });

            if (result?.error) {
                alert(result.message || "Không thể lưu danh mục");
                return;
            }
            await fetchData();
            setIsFormOpen(false);
            setForm(emptyForm);
            setEditingId(null);
        } catch (error) {
            console.error("Save category error:", error);
        }
    }

    function onEdit(category) {
        setEditingId(category.id);
        setForm({
            name: category.name || "",
            icon: category.icon || "",
        });
        setIsFormOpen(true);
    }

    async function onDelete(id) {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
        try {
            const result = await fetchWithAuth(`/categories/${id}`, { method: "DELETE" });
            if (result?.error) {
                alert(result.message || "Xóa thất bại");
                return;
            }
            await fetchData();
        } catch (error) {
            console.error("Delete category error:", error);
        }
    }

    return (
        <div style={{ minHeight: '100%' }}>
            <header className="topbar">
                <div>
                  <p className="eyebrow" style={{ color: "var(--admin-primary)", opacity: 0.8 }}>SYSTEM CATEGORIES</p>
                  <h2 style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.04em', background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.4))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Danh Mục Dịch Vụ</h2>
                </div>
            </header>

            <section className="stats-grid" style={{ marginBottom: '40px' }}>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), transparent)', backdropFilter: 'blur(10px)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <p className="eyebrow">TỔNG DANH MỤC</p>
                    <strong style={{ textShadow: '0 0 30px rgba(59, 130, 246, 0.4)' }}>{summary.total}</strong>
                    <span style={{ opacity: 0.5 }}>Nhóm dịch vụ chính</span>
                </div>
                <div className="stat-card" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderLeft: '5px solid #10b981' }}>
                    <p className="eyebrow">CÓ BIỂU TƯỢNG</p>
                    <strong style={{ color: '#10b981' }}>{summary.withIcon}</strong>
                    <span style={{ opacity: 0.5 }}>Đã thiết lập Icon</span>
                </div>
            </section>

            <section className="service-layout">
                <article className="panel" style={{ padding: '0', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', overflow: 'hidden' }}>
                    <div className="panel-heading" style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '20px', flex: 1, maxWidth: '600px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input 
                                    type="text" 
                                    placeholder="Tìm theo tên danh mục..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        height: '60px',
                                        padding: '0 20px 0 55px', 
                                        borderRadius: '18px', 
                                        background: 'rgba(0,0,0,0.4)', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        color: '#fff',
                                        fontSize: '1rem'
                                    }}
                                />
                                <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-primary)' }}>
                                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button 
                                onClick={handleRefresh}
                                style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                            >
                                <svg className={isRefreshing ? 'spinning' : ''} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                            </button>
                            <button 
                                onClick={() => { setIsFormOpen(true); setEditingId(null); setForm(emptyForm); }}
                                className="primary-button"
                                style={{ height: '60px', padding: '0 30px', borderRadius: '18px', fontWeight: '900', fontSize: '0.9rem', letterSpacing: '0.05em' }}
                            >
                                + THÊM DANH MỤC
                            </button>
                        </div>
                    </div>

                    <div className="service-table" style={{ padding: '10px 0' }}>
                        <div className="booking-index-head" style={{ padding: '20px 40px', background: 'transparent', opacity: 0.5, fontWeight: '800', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'grid', gridTemplateColumns: '80px 1fr 150px' }}>
                            <span>Icon</span>
                            <span>Tên danh mục</span>
                            <span style={{ textAlign: 'right' }}>Thao tác</span>
                        </div>

                        {loading && !isRefreshing && <div style={{ padding: '100px', textAlign: 'center' }}><div className="spinner-heavy" style={{ margin: '0 auto' }}></div></div>}

                        {!loading && filteredCategories.map((cat) => (
                            <div key={cat.id} className="booking-item-row" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 150px', padding: '22px 30px', alignItems: 'center', margin: '0 10px' }}>
                                <span>
                                    {cat.icon ? <img src={cat.icon} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '10px' }} /> : <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}></div>}
                                </span>
                                <span style={{ fontWeight: '800', fontSize: '1.2rem', color: '#fff' }}>{cat.name}</span>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button onClick={() => onEdit(cat)} style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', color: '#fff', border: 'none', cursor: 'pointer' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    </button>
                                    <button onClick={() => onDelete(cat.id)} style={{ width: '44px', height: '44px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '14px', color: '#ef4444', border: 'none', cursor: 'pointer' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </article>
            </section>

            {isFormOpen && (
                <div className="service-modal-backdrop" style={{ background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(15px)' }} onClick={() => setIsFormOpen(false)}>
                    <article className="panel service-modal" style={{ maxWidth: '600px', width: '90%', padding: '0', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ padding: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <p className="eyebrow" style={{ color: '#3b82f6', fontWeight: '900' }}>{editingId ? "CẬP NHẬT" : "TẠO MỚI"}</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: '900', margin: '5px 0' }}>{editingId ? "Sửa Danh Mục" : "Thêm Danh Mục"}</h3>
                        </div>
                        
                        <form onSubmit={onSubmit} style={{ padding: '40px' }}>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>TÊN DANH MỤC</label>
                                <input 
                                    name="name"
                                    value={form.name}
                                    onChange={onChange}
                                    placeholder="Ví dụ: Bảo dưỡng, Rửa xe..."
                                    style={{ width: '100%', height: '54px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '0 20px', color: '#fff' }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '40px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>BIỂU TƯỢNG (ICON)</label>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                   <div style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                       {form.icon ? <img src={form.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.2 }}><path d="M12 5v14M5 12h14"/></svg>}
                                   </div>
                                   <label style={{ flex: 1, height: '54px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3b82f6', fontWeight: '800' }}>
                                       <input type="file" accept="image/*" onChange={onIconChange} hidden />
                                       {form.icon ? "Thay đổi Icon" : "Tải Icon lên"}
                                   </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button type="submit" className="primary-button" style={{ flex: 1, height: '54px', borderRadius: '14px' }}>LƯU DANH MỤC</button>
                                <button type="button" onClick={() => setIsFormOpen(false)} className="ghost-button" style={{ flex: 1, height: '54px', borderRadius: '14px' }}>HỦY BỎ</button>
                            </div>
                        </form>
                    </article>
                </div>
            )}
            <style>{`
                @keyframes spinning { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spinning { animation: spinning 1s linear infinite; }
                .booking-item-row { transition: 0.2s; border-radius: 14px; }
                .booking-item-row:hover { background: rgba(59, 130, 246, 0.05) !important; transform: translateX(5px); }
            `}</style>
        </div>
    );
}

export default CategoryManagement;
