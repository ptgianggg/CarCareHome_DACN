import { useEffect, useState } from "react";
import {
    getCategories,
    fetchWithAuth,
} from "../../services/api";
import { NavLink } from "react-router-dom";
import "./style.css";


const emptyForm = {
    name: "",
    icon: "",
};

function CategoryManagement() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
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

    const filteredCategories = categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    async function onSubmit(event) {
        event.preventDefault();

        const payload = {
            name: form.name.trim(),
            icon: form.icon,
        };

        if (!payload.name) {
            alert("Vui lòng nhập tên danh mục");
            return;
        }

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
            closeForm();
        } catch (error) {
            console.error("Save category error:", error);
            alert("Có lỗi xảy ra khi lưu danh mục");
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
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này? Các dịch vụ thuộc danh mục này sẽ bị ẩn hoặc mất nhóm.")) return;

        try {
            const result = await fetchWithAuth(`/categories/${id}`, {
                method: "DELETE",
            });

            if (result?.error) {
                alert(result.message || "Xóa thất bại");
                return;
            }

            await fetchData();
            if (editingId === id) closeForm();
        } catch (error) {
            console.error("Delete category error:", error);
            alert("Không thể xóa danh mục");
        }
    }

    return (
        <>
            <header className="topbar">
                <div>
                    <p className="eyebrow">Danh mục</p>
                    <h2>Quản lý danh mục dịch vụ</h2>
                    <p className="topbar-copy">Quản lý các nhóm dịch vụ để dễ dàng phân loại và tìm kiếm.</p>
                </div>
            </header>



            <section className="service-layout">
                <article className="panel service-table-panel">
                    <div className="panel-heading">
                        <div>
                            <p className="eyebrow">Danh sách</p>
                            <h3>Danh mục hiện có ({filteredCategories.length})</h3>
                        </div>
                        <button type="button" className="primary-button" onClick={onAddClick}>
                            Thêm
                        </button>
                    </div>

                    <div className="filter-bar">
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Tìm kiếm theo tên danh mục..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="service-table">
                        <div className="category-table-head">
                            <span className="col-icon">Icon</span>
                            <span className="col-name">Tên danh mục</span>
                            <span className="col-actions">Tác vụ</span>
                        </div>

                        {loading ? <p>Đang tải dữ liệu...</p> : null}

                        {!loading &&
                            filteredCategories.map((cat) => (
                                <div key={cat.id} className="category-table-row">
                                    <span className="col-icon">
                                        {cat.icon ? (
                                            <img src={cat.icon} alt={cat.name} className="table-row-icon" />
                                        ) : (
                                            <div className="no-icon-placeholder">-</div>
                                        )}
                                    </span>
                                    <span className="col-name" style={{ fontWeight: "700" }}>{cat.name}</span>
                                    <span className="col-actions">
                                        <button
                                            type="button"
                                            className="ghost-button action-icon-btn"
                                            onClick={() => onEdit(cat)}
                                            title="Sửa"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        </button>
                                        <button
                                            type="button"
                                            className="danger-button action-icon-btn"
                                            onClick={() => onDelete(cat.id)}
                                            title="Xóa"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        </button>
                                    </span>
                                </div>
                            ))}

                        {!loading && !filteredCategories.length ? (
                            <div className="empty-state">
                                <p>Không tìm thấy danh mục nào. {categories.length === 0 ? "Bấm Thêm để tạo mới." : ""}</p>
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
                                <p className="eyebrow">{editingId ? "Cập nhật" : "Tạo mới"}</p>
                                <h3>{editingId ? "Sửa danh mục" : "Thêm danh mục"}</h3>
                            </div>
                        </div>

                        <form className="service-form" onSubmit={onSubmit}>
                            <label className="form-group">
                                Tên danh mục
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={onChange}
                                    placeholder="Ví dụ: Bảo dưỡng định kỳ"
                                    required
                                />
                            </label>

                            <div className="form-group">
                                <p className="field-label">Biểu tượng danh mục (Icon)</p>
                                <div className="category-icon-upload">
                                    {form.icon && (
                                        <div className="icon-preview-box">
                                            <img src={form.icon} alt="Preview" />
                                            <button 
                                                type="button" 
                                                className="remove-icon-btn"
                                                onClick={() => setForm(p => ({...p, icon: ""}))}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    )}
                                    <label className="icon-upload-trigger">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={onIconChange} 
                                            hidden 
                                        />
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                        <span>{form.icon ? "Thay đổi Icon" : "Tải Icon lên"}</span>
                                    </label>
                                </div>
                            </div>

                            <div className="service-form-actions">
                                <button type="submit" className="primary-button">
                                    {editingId ? "Lưu thay đổi" : "Thêm danh mục"}
                                </button>
                                <button type="button" className="ghost-button" onClick={closeForm}>
                                    Đóng
                                </button>
                            </div>
                        </form>
                    </article>
                </div>
            ) : null}
        </>
    );
}

export default CategoryManagement;
