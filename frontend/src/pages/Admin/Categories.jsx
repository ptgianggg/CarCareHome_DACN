import { useEffect, useState } from "react";
import {
    getCategories,
    fetchWithAuth,
} from "../../services/api";
import { NavLink } from "react-router-dom";
import "./style.css";


const emptyForm = {
    name: "",
};

function CategoryManagement() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

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

    async function onSubmit(event) {
        event.preventDefault();

        const payload = {
            name: form.name.trim(),
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
                    <p className="eyebrow">Danh muc</p>
                    <h2>Quan ly danh muc lon</h2>
                    <p className="topbar-copy">Dong bo danh muc hien thi tren Header va trang Tat ca dich vu.</p>
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
                            <h3>Danh muc hien co ({categories.length})</h3>
                        </div>
                        <button type="button" className="primary-button" onClick={onAddClick}>
                            Thêm
                        </button>
                    </div>

                    <div className="service-table" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <div className="service-table-head">
                            <span>Tên danh mục</span>
                            <span>Tác vụ</span>
                        </div>

                        {loading ? <p>Đang tải dữ liệu...</p> : null}

                        {!loading &&
                            categories.map((cat) => (
                                <div key={cat.id} className="service-table-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                                    <span style={{ fontWeight: "700" }}>{cat.name}</span>
                                    <span className="row-actions">
                                        <button
                                            type="button"
                                            className="ghost-button action-button"
                                            onClick={() => onEdit(cat)}
                                        >
                                            Sua
                                        </button>
                                        <button
                                            type="button"
                                            className="danger-button action-button"
                                            onClick={() => onDelete(cat.id)}
                                        >
                                            Xoa
                                        </button>
                                    </span>
                                </div>
                            ))}

                        {!loading && !categories.length ? (
                            <div className="empty-state">
                                <p>Chua co danh muc. Bam Them de tao moi.</p>
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
                                <h3>{editingId ? "Sua danh muc" : "Them danh muc"}</h3>
                            </div>
                        </div>

                        <form className="service-form" onSubmit={onSubmit}>
                            <label>
                                Tên danh mục *
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={onChange}
                                    placeholder="Ví dụ: Bảo dưỡng định kỳ"
                                    required
                                />
                            </label>

                            <div className="service-form-actions">
                                <button type="submit" className="primary-button">
                                    {editingId ? "Luu thay doi" : "Them danh muc"}
                                </button>
                                <button type="button" className="ghost-button" onClick={closeForm}>
                                    Dong
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
