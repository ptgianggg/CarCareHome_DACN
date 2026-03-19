import { useEffect, useState } from "react";
import {
    createService,
    deleteService,
    getServices,
    updateService,
    getCategories,
} from "../../services/api";
import { NavLink } from "react-router-dom";
import "./style.css";


const LOCAL_IMAGE_MAP_KEY = "service_local_images";

const emptyForm = {
    name: "",
    price: "",
    duration: "",
    category: "",
    description: "",
    images: [],
    active: true,
};

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

function ServiceManagement() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [detailService, setDetailService] = useState(null);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [localImageMap, setLocalImageMap] = useState(() => {
        try {
            const raw = localStorage.getItem(LOCAL_IMAGE_MAP_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem(LOCAL_IMAGE_MAP_KEY, JSON.stringify(localImageMap));
    }, [localImageMap]);

    useEffect(() => {
        fetchData();
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

    const filteredServices = services.filter((svc) => {
        const matchesSearch = svc.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "" || svc.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    function onChange(event) {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function resetForm() {
        setForm(emptyForm);
        setEditingId(null);
    }

    function onAddClick() {
        resetForm();
        setIsFormOpen(true);
    }

    function closeForm() {
        setIsFormOpen(false);
        resetForm();
    }

    function closeDetailModal() {
        setDetailService(null);
    }

    function formatPrice(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function resolveImageUrl(service) {
    if (service.images && service.images.length > 0) return service.images[0];
    return localImageMap[String(service.id)]?.[0] || "";
}

function onImageChange(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
            setForm((prev) => ({ 
                ...prev, 
                images: [...prev.images, String(reader.result || "")] 
            }));
        };
        reader.readAsDataURL(file);
    });
}

async function onSubmit(event) {
    event.preventDefault();

    const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        duration: Number(form.duration),
        imageUrls: form.images.filter(img => !img.startsWith("data:")), // Keep existing ones
        active: Boolean(form.active),
    };

    // New images will be handled by localImageMap for now as before, because backend doesn't handle base64 easily
    // but wait, I should really implement real upload.
    // However, let's stick to the user's "compact UI" request first.

        if (
            !payload.name ||
            !payload.category ||
            !payload.description ||
            Number.isNaN(payload.price) ||
            Number.isNaN(payload.duration) ||
            payload.price <= 0 ||
            payload.duration <= 0
        ) {
            alert("Vui long nhap day du thong tin hop le");
            return;
        }

        try {
            const result = editingId
                ? await updateService(editingId, payload)
                : await createService(payload);

            if (result?.error) {
                alert(result.message || "Khong the luu dich vu");
                return;
            }

            const savedId = editingId || result?.id;
            if (savedId && form.images.some(img => img.startsWith("data:"))) {
                setLocalImageMap((prev) => ({
                    ...prev,
                    [String(savedId)]: form.images,
                }));
            }

            await fetchData();
            closeForm();
        } catch (error) {
            console.error("Save service error:", error);
            alert("Co loi xay ra khi luu dich vu");
        }
    }

    function onEdit(service) {
        setEditingId(service.id);
        const currentImages = service.images && service.images.length > 0 
            ? service.images 
            : (localImageMap[String(service.id)] || []);

        setForm({
            name: service.name,
            price: String(service.price),
            duration: String(service.duration),
            category: service.category,
            description: service.description,
            images: currentImages,
            active: service.active,
        });
        setIsFormOpen(true);
    }

    async function onDelete(id) {
        if (!window.confirm("Ban co chac chan muon xoa dich vu nay?")) return;

        try {
            const ok = await deleteService(id);
            if (!ok) {
                alert("Xoa that bai");
                return;
            }

            setLocalImageMap((prev) => {
                const next = { ...prev };
                delete next[String(id)];
                return next;
            });

            await fetchData();
            if (editingId === id) closeForm();
            if (detailService?.id === id) closeDetailModal();
        } catch (error) {
            console.error("Delete service error:", error);
            alert("Khong the xoa dich vu");
        }
    }

    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    return (
        <>
            <header className="topbar">
                <div>
                    <p className="eyebrow">Dịch vụ</p>
                    <h2>Quản lý danh mục dịch vụ</h2>
                    <p className="topbar-copy">Tạo mới, cập nhật và quản lý các gói dịch vụ chăm sóc xe của trung tâm.</p>
                </div>
            </header>

            <section className="service-layout">
                <article className="panel service-table-panel">
                    <div className="panel-heading">
                        <div>
                            <p className="eyebrow">Danh sách</p>
                            <h3>Dịch vụ hiện có ({filteredServices.length})</h3>
                        </div>
                        <button type="button" className="primary-button add-btn" onClick={onAddClick}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Thêm dịch vụ mới
                        </button>
                    </div>

                    <div className="filter-bar">
                        <div className="filter-search-wrapper">
                            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <input
                                type="text"
                                className="filter-input"
                                placeholder="Tìm kiếm theo tên dịch vụ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="custom-dropdown-container">
                            <div 
                                className={`custom-select-trigger ${selectedCategory ? 'has-value' : ''}`}
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            >
                                <span>{selectedCategory || "Tất cả danh mục"}</span>
                                <svg className={`chevron ${showFilterDropdown ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                            {showFilterDropdown && (
                                <>
                                    <div className="dropdown-overlay-fixed" onClick={() => setShowFilterDropdown(false)}></div>
                                    <div className="custom-dropdown-list glass-morphism">
                                        <div 
                                            className={`dropdown-option ${selectedCategory === "" ? 'selected' : ''}`}
                                            onClick={() => { setSelectedCategory(""); setShowFilterDropdown(false); }}
                                        >
                                            Tất cả danh mục
                                        </div>
                                        {categoryOptions.map((cat) => (
                                            <div 
                                                key={cat.id || cat.name} 
                                                className={`dropdown-option ${selectedCategory === cat.name ? 'selected' : ''}`}
                                                onClick={() => { setSelectedCategory(cat.name); setShowFilterDropdown(false); }}
                                            >
                                                {cat.name}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="service-table">
                        <div className="service-table-head">
                            <span>Tên dịch vụ</span>
                            <span>Nhóm</span>
                            <span>Mô tả</span>
                            <span>Ảnh</span>
                            <span>Giá tiền</span>
                            <span>Thời gian</span>
                            <span>Trạng thái</span>
                            <span>Thao tác</span>
                        </div>

                        {loading ? (
                            <div className="table-loading">
                                <span className="spinner"></span>
                                <p>Đang tải dữ liệu...</p>
                            </div>
                        ) : null}

                        {!loading &&
                            filteredServices.map((service) => (
                                <div
                                    key={service.id}
                                    className="service-table-row"
                                    onDoubleClick={() => setDetailService(service)}
                                >
                                    <span className="font-bold">{service.name}</span>
                                    <span className="cat-column">
                                        {(() => {
                                            const cat = categoryOptions.find(c => c.name === service.category);
                                            return (
                                                <div className="cat-with-icon">
                                                    {cat?.icon && <img src={cat.icon} alt="" className="cat-row-icon" />}
                                                    <span className="cat-badge">{service.category}</span>
                                                </div>
                                            );
                                        })()}
                                    </span>
                                    <span className="service-description">{service.description}</span>
                                    <span>
                                        {resolveImageUrl(service) ? (
                                            <img
                                                className="service-thumb"
                                                src={resolveImageUrl(service)}
                                                alt={service.name}
                                            />
                                        ) : (
                                            <span className="no-image-placeholder">N/A</span>
                                        )}
                                    </span>
                                    <span className="price-text">{formatPrice(service.price)}</span>
                                    <span>{service.duration} phút</span>
                                    <span>
                                        <span className={`status-badge ${service.active ? "active" : "inactive"}`}>
                                            {service.active ? "Hoạt động" : "Tạm dừng"}
                                        </span>
                                    </span>
                                    <span
                                        className="row-actions"
                                        onDoubleClick={(event) => event.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            className="action-btn edit"
                                            onClick={() => onEdit(service)}
                                            title="Sửa"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        </button>
                                        <button
                                            type="button"
                                            className="action-btn delete"
                                            onClick={() => onDelete(service.id)}
                                            title="Xóa"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                        </button>
                                    </span>
                                </div>
                            ))}

                        {!loading && !services.length ? (
                            <div className="empty-state">
                                <p>Chưa có dịch vụ nào. Bấm "Thêm dịch vụ mới" để bắt đầu.</p>
                            </div>
                        ) : null}
                    </div>
                </article>
            </section>

            {isFormOpen ? (
                <div className="service-modal-backdrop" onClick={closeForm}>
                    <article className="panel service-modal glass-morphism" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <p className="eyebrow">{editingId ? "Cập nhật" : "Tạo mới"}</p>
                                <h3>{editingId ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}</h3>
                            </div>
                            <button className="close-modal-btn" onClick={closeForm}>&times;</button>
                        </div>

                        <form className="service-form" onSubmit={onSubmit}>
                            <div className="form-grid">
                                <label className="form-group">
                                    Tên dịch vụ
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={onChange}
                                        placeholder="Ví dụ: Rửa xe cao cấp"
                                        required
                                    />
                                </label>

                                <label className="form-group">
                                    Giá dịch vụ (VNĐ)
                                    <input
                                        name="price"
                                        type="number"
                                        min="1000"
                                        step="1000"
                                        value={form.price}
                                        onChange={onChange}
                                        placeholder="Ví dụ: 150000"
                                        required
                                    />
                                </label>

                                <label className="form-group">
                                    Thời gian ước tính (phút)
                                    <input
                                        name="duration"
                                        type="number"
                                        min="10"
                                        step="5"
                                        value={form.duration}
                                        onChange={onChange}
                                        placeholder="Ví dụ: 45"
                                        required
                                    />
                                </label>

                                <div className="form-group">
                                    Danh mục dịch vụ
                                    <div className="custom-dropdown-container">
                                        <div 
                                            className={`custom-select-trigger ${form.category ? 'has-value' : ''}`}
                                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                        >
                                            <span>{form.category || "-- Chọn danh mục --"}</span>
                                            <svg className={`chevron ${showCategoryDropdown ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        </div>
                                        {showCategoryDropdown && (
                                            <>
                                                <div className="dropdown-overlay-fixed" onClick={() => setShowCategoryDropdown(false)}></div>
                                                <div className="custom-dropdown-list glass-morphism">
                                                    {categoryOptions.map((cat) => (
                                                        <div 
                                                            key={cat.id || cat.name} 
                                                            className={`dropdown-option ${form.category === cat.name ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setForm(prev => ({ ...prev, category: cat.name }));
                                                                setShowCategoryDropdown(false);
                                                            }}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                                        >
                                                            {cat.icon && (
                                                                <img 
                                                                    src={cat.icon} 
                                                                    alt="" 
                                                                    style={{ width: '20px', height: '20px', objectFit: 'contain', borderRadius: '4px' }} 
                                                                />
                                                            )}
                                                            {cat.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <label className="form-group full-width">
                                    Mô tả dịch vụ
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={onChange}
                                        placeholder="Mô tả chi tiết các bước thực hiện..."
                                        rows={4}
                                        required
                                    />
                                </label>

                                <div className="form-group full-width">
                                    <p className="field-label">Hình ảnh dịch vụ (Có thể chọn nhiều)</p>
                                    <div className="image-grid-container">
                                        {form.images.map((img, index) => (
                                            <div key={index} className="image-preview-item">
                                                <img src={img} alt={`Preview ${index}`} />
                                                <button 
                                                    type="button" 
                                                    className="remove-image-btn"
                                                    onClick={() => setForm(prev => ({ 
                                                        ...prev, 
                                                        images: prev.images.filter((_, i) => i !== index) 
                                                    }))}
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                        <label className="compact-upload-box">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                multiple 
                                                onChange={onImageChange} 
                                                hidden 
                                            />
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                            <span>Thêm ảnh</span>
                                        </label>
                                    </div>
                                </div>

                                <label className="toggle-label full-width">
                                    <span>Trạng thái hoạt động</span>
                                    <span className="switch">
                                        <input
                                            type="checkbox"
                                            checked={form.active}
                                            onChange={(event) =>
                                                setForm((prev) => ({ ...prev, active: event.target.checked }))
                                            }
                                        />
                                        <span className="slider" />
                                    </span>
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="ghost-button" onClick={closeForm}>
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="primary-button submit-btn">
                                    {editingId ? "Lưu thay đổi" : "Tạo dịch vụ ngay"}
                                </button>
                            </div>
                        </form>
                    </article>
                </div>
            ) : null}

            {detailService ? (
                <div className="service-modal-backdrop" onClick={closeDetailModal}>
                    <article className="panel service-modal detail-modal glass-morphism" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <p className="eyebrow">Chi tiết dịch vụ</p>
                                <h3>{detailService.name}</h3>
                            </div>
                            <button className="close-modal-btn" onClick={closeDetailModal}>&times;</button>
                        </div>

                        <div className="service-detail-content">
                            <div className="detail-gallery">
                                {detailService.images && detailService.images.length > 0 ? (
                                    detailService.images.map((img, idx) => (
                                        <div key={idx} className="detail-gallery-item">
                                            <img src={img} alt={`${detailService.name} ${idx}`} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-image-big">Chưa có ảnh</div>
                                )}
                            </div>
                            <div className="detail-info-grid">
                                <div className="info-item">
                                    <label>Danh mục</label>
                                    <p>{detailService.category}</p>
                                </div>
                                <div className="info-item">
                                    <label>Giá dịch vụ</label>
                                    <p className="price">{formatPrice(detailService.price)}</p>
                                </div>
                                <div className="info-item">
                                    <label>Thời gian</label>
                                    <p>{detailService.duration} phút</p>
                                </div>
                                <div className="info-item">
                                    <label>Trạng thái</label>
                                    <p>
                                        <span className={`status-badge ${detailService.active ? "active" : "inactive"}`}>
                                            {detailService.active ? "Đang hoạt động" : "Đang tạm dừng"}
                                        </span>
                                    </p>
                                </div>
                                <div className="info-item full-width">
                                    <label>Mô tả chi tiết</label>
                                    <div className="description-box">{detailService.description}</div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="primary-button"
                                onClick={() => {
                                    closeDetailModal();
                                    onEdit(detailService);
                                }}
                            >
                                Chỉnh sửa thông tin
                            </button>
                            <button type="button" className="ghost-button" onClick={closeDetailModal}>
                                Đóng lại
                            </button>
                        </div>
                    </article>
                </div>
            ) : null}
        </>
    );
}

export default ServiceManagement;
