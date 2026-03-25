import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Star, 
  Trash2, 
  Eye, 
  EyeOff, 
  User, 
  Calendar, 
  MessageSquare,
  Search,
  CheckCircle,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8089/api";

const ReviewManagement = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRating, setFilterRating] = useState("all");

    const fetchReviews = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/admin/reviews`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReviews(res.data);
        } catch (err) {
            console.error("Fetch reviews failed", err);
            toast.error("Không thể tải danh sách đánh giá");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleToggleVisibility = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/admin/reviews/${id}/toggle-visibility`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Đã cập nhật hiển thị");
            fetchReviews();
        } catch (err) {
            toast.error("Lỗi cập nhật trạng thái");
        }
    };

    const handleDeleteReview = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này? Nội dung và điểm đánh giá sẽ bị xóa vĩnh viễn.")) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/admin/reviews/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Đã xóa đánh giá");
            fetchReviews();
        } catch (err) {
            toast.error("Lỗi khi xóa đánh giá");
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star 
                key={i} 
                size={14} 
                fill={i < rating ? "#fbbf24" : "none"} 
                color={i < rating ? "#fbbf24" : "#475569"} 
            />
        ));
    };

    const filteredReviews = reviews.filter(r => {
        const matchesSearch = r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (r.reviewComment || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRating = filterRating === "all" || r.rating === parseInt(filterRating);
        return matchesSearch && matchesRating;
    });

    if (loading) return <div className="admin-loading">Đang tải đánh giá...</div>;

    return (
        <div className="admin-review-page animate-fade-in">
            <header className="topbar" style={{ marginBottom: '30px' }}>
                <div>
                    <p className="eyebrow" style={{ color: "var(--admin-primary)", opacity: 0.8 }}>CUSTOMER FEEDBACK</p>
                    <h2 style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.04em', background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.4))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Quản lý Đánh giá</h2>
                </div>
            </header>

            <div className="admin-filters-bar glass-morphism">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên khách, nội dung..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="filter-input"
                    />
                </div>
                <div className="filter-select-group">
                    <Filter size={18} className="filter-icon" />
                    <select 
                        value={filterRating} 
                        onChange={(e) => setFilterRating(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Tất cả đánh giá</option>
                        <option value="5">5 sao - Tuyệt vời</option>
                        <option value="4">4 sao - Tốt</option>
                        <option value="3">3 sao - Bình thường</option>
                        <option value="2">2 sao - Kém</option>
                        <option value="1">1 sao - Rất kém</option>
                    </select>
                </div>
            </div>

            <div className="review-grid-admin">
                {filteredReviews.length > 0 ? filteredReviews.map(r => (
                    <div key={r.id} className="review-card-admin glass-morphism">
                        <div className="review-card-top">
                            <div className="reviewer-info">
                                <div className="reviewer-avatar">
                                    <User size={20} />
                                </div>
                                <div className="reviewer-details">
                                    <h4>{r.customerName}</h4>
                                    <span className="review-date">
                                        <Calendar size={12} /> {new Date(r.updatedAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                            <div className="review-rating-stars">
                                {renderStars(r.rating)}
                            </div>
                        </div>

                        <div className="review-body">
                            <div className="service-tag">
                                <strong>Dịch vụ:</strong> {r.serviceType}
                            </div>
                            <div className="review-comment-box">
                                <MessageSquare size={14} className="q-icon" />
                                <p>{r.reviewComment || "Không có bình luận."}</p>
                            </div>
                        </div>

                        <div className="review-card-footer">
                            <div className={`visibility-status ${r.showOnHome ? 'visible' : 'hidden'}`}>
                                {r.showOnHome ? <Eye size={14} /> : <EyeOff size={14} />}
                                <span>{r.showOnHome ? 'Đang hiện ở Trang chủ' : 'Đang ẩn'}</span>
                            </div>
                            <div className="review-actions">
                                <button 
                                    className={`action-btn-p tooltip-target ${r.showOnHome ? 'hide-btn' : 'show-btn'}`}
                                    onClick={() => handleToggleVisibility(r.id)}
                                    title={r.showOnHome ? "Ẩn khỏi trang chủ" : "Hiện lên trang chủ"}
                                >
                                    {r.showOnHome ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                <button 
                                    className="action-btn-p delete-btn tooltip-target"
                                    onClick={() => handleDeleteReview(r.id)}
                                    title="Xóa đánh giá"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="empty-reviews-state glass-morphism">
                        <MessageSquare size={48} className="empty-icon" />
                        <h3>Chưa có đánh giá nào</h3>
                        <p>Danh sách sẽ hiển thị khi có khách hàng thực hiện đánh giá đơn hàng.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewManagement;
