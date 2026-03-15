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
    image: "",
    active: true,
};

function formatPrice(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")} d`;
}

function normalizeService(service) {
    return {
        id: service.id,
        name: service.name || "",
        category: service.category || "",
        description: service.description || "",
        price: Number(service.price || 0),
        duration: Number(service.duration || 0),
        imageUrl: service.imageUrl || "",
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

    function resolveImageUrl(service) {
        return localImageMap[String(service.id)] || service.imageUrl || "";
    }

    function onImageChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setForm((prev) => ({ ...prev, image: String(reader.result || "") }));
        };
        reader.readAsDataURL(file);
    }

    async function onSubmit(event) {
        event.preventDefault();

        const imageUrlToSave = form.image?.startsWith("data:") ? "" : form.image || "";

        const payload = {
            name: form.name.trim(),
            category: form.category.trim(),
            description: form.description.trim(),
            price: Number(form.price),
            duration: Number(form.duration),
            imageUrl: imageUrlToSave,
            active: Boolean(form.active),
        };

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
            if (savedId && form.image?.startsWith("data:")) {
                setLocalImageMap((prev) => ({
                    ...prev,
                    [String(savedId)]: form.image,
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
        setForm({
            name: service.name,
            price: String(service.price),
            duration: String(service.duration),
            category: service.category,
            description: service.description,
            image: resolveImageUrl(service),
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

    return (
        <>
            <header className="topbar">
                <div>
                    <p className="eyebrow">Dich vu</p>
                    <h2>Quan ly danh muc dich vu</h2>
                    <p className="topbar-copy"></p>
                </div>
            </header>

            <nav className="admin-tabs">
                <NavLink to="/admin/services" className={({ isActive }) => isActive ? "tab-item active" : "tab-item"}>
                    Dịch vụ
                </NavLink>
                <NavLink to="/admin/categories" className={({ isActive }) => isActive ? "tab-item active" : "tab-item"}>
                    Danh mục
                </NavLink>
            </nav>

            <section className="service-layout">
                <article className="panel service-table-panel">
                    <div className="panel-heading">
                        <div>
                            <p className="eyebrow">Danh sach</p>
                            <h3>Dich vu hien co ({filteredServices.length})</h3>
                        </div>
                        <button type="button" className="primary-button" onClick={onAddClick}>
                            Thêm
                        </button>
                    </div>

                    <div className="filter-bar">
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Tìm kiếm theo tên dịch vụ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="filter-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">Tất cả danh mục</option>
                            {categoryOptions.map((cat) => (
                                <option key={cat.id || cat.name} value={cat.name}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="service-table">
                        <div className="service-table-head">
                            <span>Ten</span>
                            <span>Nhom</span>
                            <span>Mo ta</span>
                            <span>Anh</span>
                            <span>Gia</span>
                            <span>Thoi gian</span>
                            <span>Trang thai</span>
                            <span>Tac vu</span>
                        </div>

                        {loading ? <p>Dang tai du lieu...</p> : null}

                        {!loading &&
                            filteredServices.map((service) => (
                                <div
                                    key={service.id}
                                    className="service-table-row"
                                    onDoubleClick={() => setDetailService(service)}
                                >
                                    <span>{service.name}</span>
                                    <span>{service.category}</span>
                                    <span className="service-description">{service.description}</span>
                                    <span>
                                        {resolveImageUrl(service) ? (
                                            <img
                                                className="service-thumb"
                                                src={resolveImageUrl(service)}
                                                alt={service.name}
                                            />
                                        ) : (
                                            <span className="no-image">Chua co anh</span>
                                        )}
                                    </span>
                                    <span>{formatPrice(service.price)}</span>
                                    <span>{service.duration} phut</span>
                                    <span>
                                        <span className={`status-badge ${service.active ? "active" : "inactive"}`}>
                                            {service.active ? "Hoat dong" : "Tam dung"}
                                        </span>
                                    </span>
                                    <span
                                        className="row-actions"
                                        onDoubleClick={(event) => event.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            className="ghost-button action-button"
                                            onClick={() => onEdit(service)}
                                        >
                                            Sua
                                        </button>
                                        <button
                                            type="button"
                                            className="danger-button action-button"
                                            onClick={() => onDelete(service.id)}
                                        >
                                            Xoa
                                        </button>
                                    </span>
                                </div>
                            ))}

                        {!loading && !services.length ? (
                            <div className="empty-state">
                                <p>Chua co dich vu. Bam Them de tao moi.</p>
                            </div>
                        ) : null}
                    </div>
                </article>
            </section>

            {isFormOpen ? (
                <div className="service-modal-backdrop" onClick={closeForm}>
                    <article className="panel service-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="panel-heading">
                            <div>
                                <p className="eyebrow">{editingId ? "Cap nhat" : "Tao moi"}</p>
                                <h3>{editingId ? "Sua dich vu" : "Them dich vu"}</h3>
                            </div>
                        </div>

                        <form className="service-form" onSubmit={onSubmit}>
                            <label>
                                Ten dich vu
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={onChange}
                                    placeholder="Nhap ten dich vu"
                                    required
                                />
                            </label>

                            <label>
                                Gia (VND)
                                <input
                                    name="price"
                                    type="number"
                                    min="1000"
                                    step="1000"
                                    value={form.price}
                                    onChange={onChange}
                                    placeholder="Vi du: 1500000"
                                    required
                                />
                            </label>

                            <label>
                                Thoi gian (phut)
                                <input
                                    name="duration"
                                    type="number"
                                    min="10"
                                    step="5"
                                    value={form.duration}
                                    onChange={onChange}
                                    placeholder="Vi du: 120"
                                    required
                                />
                            </label>

                            <label>
                                Nhom dich vu
                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={onChange}
                                    required
                                >
                                    <option value="">-- Chon danh muc --</option>
                                    {categoryOptions.map(cat => (
                                        <option key={cat.id || cat.name} value={cat.name}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Mo ta
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={onChange}
                                    placeholder="Mo ta chi tiet ve dich vu..."
                                    rows={3}
                                    required
                                />
                            </label>

                            <label className="toggle-label">
                                Trang thai hoat dong
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

                            <label>
                                Upload anh
                                <input type="file" accept="image/*" onChange={onImageChange} />
                                <small className="no-image">Anh tu may tinh chi dung de preview tam thoi.</small>
                            </label>

                            {form.image ? (
                                <div className="service-image-preview">
                                    <img src={form.image} alt="Service preview" />
                                </div>
                            ) : null}

                            <div className="service-form-actions">
                                <button type="submit" className="primary-button">
                                    {editingId ? "Luu thay doi" : "Them dich vu"}
                                </button>
                                <button type="button" className="ghost-button" onClick={closeForm}>
                                    Dong
                                </button>
                            </div>
                        </form>
                    </article>
                </div>
            ) : null}

            {detailService ? (
                <div className="service-modal-backdrop" onClick={closeDetailModal}>
                    <article className="panel service-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="panel-heading">
                            <div>
                                <p className="eyebrow">Chi tiet</p>
                                <h3>{detailService.name}</h3>
                            </div>
                        </div>

                        <div className="service-detail">
                            <div className="service-detail-image">
                                {resolveImageUrl(detailService) ? (
                                    <img src={resolveImageUrl(detailService)} alt={detailService.name} />
                                ) : (
                                    <span className="no-image">Chua co anh</span>
                                )}
                            </div>
                            <div className="service-detail-grid">
                                <p>
                                    <strong>Nhom:</strong> {detailService.category}
                                </p>
                                <p>
                                    <strong>Gia:</strong> {formatPrice(detailService.price)}
                                </p>
                                <p>
                                    <strong>Thoi gian:</strong> {detailService.duration} phut
                                </p>
                                <p>
                                    <strong>Trang thai:</strong> {detailService.active ? "Hoat dong" : "Tam dung"}
                                </p>
                                <p className="service-detail-description">
                                    <strong>Mo ta:</strong> {detailService.description}
                                </p>
                            </div>
                        </div>

                        <div className="service-form-actions">
                            <button
                                type="button"
                                className="ghost-button"
                                onClick={() => {
                                    closeDetailModal();
                                    onEdit(detailService);
                                }}
                            >
                                Sua
                            </button>
                            <button type="button" className="ghost-button" onClick={closeDetailModal}>
                                Dong
                            </button>
                        </div>
                    </article>
                </div>
            ) : null}
        </>
    );
}

export default ServiceManagement;
