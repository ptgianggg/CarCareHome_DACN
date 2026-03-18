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
                            <span>Tên danh mục</span>
                            <span>Tác vụ</span>
                        </div>

                        {loading ? <p>Đang tải dữ liệu...</p> : null}

                        {!loading &&
                            filteredCategories.map((cat) => (
                                <div key={cat.id} className="category-table-row">
                                    <span style={{ fontWeight: "700" }}>{cat.name}</span>
                                    <span className="row-actions">
                                        <button
                                            type="button"
                                            className="ghost-button action-button"
                                            onClick={() => onEdit(cat)}
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            type="button"
                                            className="danger-button action-button"
                                            onClick={() => onDelete(cat.id)}
                                        >
                                            Xóa
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
                            <label>
                                Tên danh mục
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
