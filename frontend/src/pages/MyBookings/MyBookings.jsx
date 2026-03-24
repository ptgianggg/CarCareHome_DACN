import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyBookings, addReview, updateBookingStatus } from "@/services/api";
import { 
  Calendar, 
  MapPin, 
  Car, 
  Clock, 
  ChevronRight, 
  Package, 
  CreditCard,
  Star,
  Camera,
  UserCheck
} from "lucide-react";
import toast from 'react-hot-toast';
import "./MyBookings.css";

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  const [revRating, setRevRating] = useState(0);
  const [revComment, setRevComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetchUserBookings();
    }
  }, [user]);

  const fetchUserBookings = async () => {
    setLoading(true);
    try {
      const data = await getMyBookings(user.email);
      if (Array.isArray(data)) {
        setBookings(data);
      }
    } catch (error) {
      console.error("Fetch my bookings failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReview = async (id) => {
    if (revRating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }
    setSubmittingReview(true);
    try {
      await addReview(id, revRating, revComment);
      toast.success("Cảm ơn bạn đã đánh giá dịch vụ!");
      fetchUserBookings(); 
      setSelectedBooking(prev => ({...prev, rating: revRating, reviewComment: revComment}));
    } catch (error) {
      toast.error("Gửi đánh giá thất bại");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy lịch hẹn này?")) {
      try {
        await updateBookingStatus(id, 'CANCEL');
        toast.success("Đã hủy lịch hẹn thành công");
        fetchUserBookings();
        setSelectedBooking(null);
      } catch (error) {
        toast.error("Lỗi khi hủy lịch hẹn");
      }
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("pending") || s.includes("chờ")) return "status-pending";
    if (s.includes("success") || s.includes("done") || s.includes("hoàn tất")) return "status-success";
    if (s.includes("cancel") || s.includes("hủy")) return "status-error";
    return "status-active";
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === "all") return true;
    return String(b.status || "").toLowerCase().includes(activeTab);
  });

  const formatPrice = (price) => Number(price || 0).toLocaleString() + " ₫";
  const formatDate = (date, time) => `${date || ""} ${time || ""}`.trim();

  return (
    <div className="my-bookings-container">
      <div className="glass-bg-effect"></div>
      
      <div className="bookings-wrapper">
        <header className="page-header">
          <div className="badge">LỊCH SỬ DỊCH VỤ</div>
          <h1>Lịch hẹn của tôi</h1>
          <p>Quản lý và theo dõi tiến độ chăm sóc xế yêu của bạn</p>
        </header>

        <section className="bookings-tabs">
          <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>Tất cả</button>
          <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")}>Chờ xử lý</button>
          <button className={activeTab === "success" ? "active" : ""} onClick={() => setActiveTab("success")}>Hoàn tất</button>
          <button className={activeTab === "cancel" ? "active" : ""} onClick={() => setActiveTab("cancel")}>Đã hủy</button>
        </section>

        <div className="bookings-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải lịch hẹn...</p>
            </div>
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="booking-card-premium" onClick={() => setSelectedBooking(booking)}>
                <div className="card-main">
                  <div className="booking-icon">
                    <Calendar size={20} />
                  </div>
                  <div className="booking-info">
                    <div className="info-header">
                      <h3>Booking #{booking.id}</h3>
                      <span className={`status-pill ${getStatusBadge(booking.status)}`}>
                        {booking.status || "PENDING"}
                      </span>
                    </div>
                    <div className="info-details">
                      <span><Car size={14} /> {booking.items?.length || 1} Xe</span>
                      <span><Clock size={14} /> {formatDate(booking.bookingDate, booking.bookingTime)}</span>
                      <span><MapPin size={14} /> {booking.addressName?.split(',')[0]}...</span>
                    </div>
                  </div>
                </div>
                <div className="card-right">
                  <div className="price-info">
                    <span className="label">Tổng tiền</span>
                    <span className="value">{formatPrice(booking.totalPrice)}</span>
                  </div>
                  <ChevronRight size={20} className="arrow" />
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state-card">
              <Package size={48} />
              <h3>Chưa có lịch hẹn nào</h3>
              <p>Bạn chưa có lịch hẹn nào phù hợp với bộ lọc này.</p>
            </div>
          )}
        </div>
      </div>

      {selectedBooking && (
        <div className="booking-modal-backdrop" onClick={() => setSelectedBooking(null)}>
          <div className="booking-modal-card glass-modal" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h2>Chi tiết lịch hẹn #{selectedBooking.id}</h2>
              <button className="close-btn" onClick={() => setSelectedBooking(null)}>&times;</button>
            </header>
            
            <div className="modal-content">
              <div className="detail-section">
                <h4><Calendar size={16} /> Thông tin chung</h4>
                <div className="detail-grid">
                  <p><strong>Ngày thực hiện:</strong> {selectedBooking.bookingDate}</p>
                  <p><strong>Giờ bắt đầu:</strong> {selectedBooking.bookingTime}</p>
                  <p className="full"><strong>Địa chỉ:</strong> {selectedBooking.addressName}</p>
                  <p className="full"><strong>Ghi chú:</strong> {selectedBooking.note || "Không có ghi chú"}</p>
                </div>
              </div>

              {selectedBooking.assignedStaff && (
                <div className="detail-section">
                  <h4><UserCheck size={16} /> Nhân viên thực hiện</h4>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--p-accent)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 'bold' }}>
                      {selectedBooking.assignedStaff.name?.charAt(0)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{selectedBooking.assignedStaff.name}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>Chuyên viên kỹ thuật</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedBooking.proofImage && (
                <div className="detail-section">
                  <h4><Camera size={16} /> Hình ảnh nghiệm thu</h4>
                  <div className="proof-image-container" style={{ position: 'relative', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
                    <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>[Hình ảnh: {selectedBooking.proofImage}]</p>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4><Car size={16} /> Danh sách xe & Dịch vụ</h4>
                <div className="items-list-premium">
                  {selectedBooking.items?.map((item, i) => (
                    <div key={i} className="item-row-premium">
                      <div className="item-v-info">
                        <strong>{item.vehicleType}</strong>
                        <span>{item.vehiclePlate}</span>
                      </div>
                      <div className="item-s-info">{item.serviceType}</div>
                      <div className="item-price">{formatPrice(item.price)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section payment-summary">
                <div className="summary-row">
                  <span>Tiền dịch vụ:</span>
                  <strong>{formatPrice((selectedBooking.totalPrice || 0) - (selectedBooking.travelFee || 0))}</strong>
                </div>
                {selectedBooking.distance != null && (
                  <div className="summary-row">
                    <span>Phí di chuyển ({selectedBooking.distance} km):</span>
                    <strong>
                      {selectedBooking.travelFee === 0 && selectedBooking.distance > 0 ? <span className="free-badge">FREE</span> : ""}
                      {formatPrice(selectedBooking.travelFee)}
                    </strong>
                  </div>
                )}
                <div className="summary-row total-calc">
                  <span>Tổng tiền thực tế:</span>
                  <strong>{formatPrice(selectedBooking.totalPrice)}</strong>
                </div>
                <div className="summary-row">
                  <span>Đã đặt cọc:</span>
                  <strong className="accent">{formatPrice(selectedBooking.depositAmount)}</strong>
                </div>
                <div className="summary-row remaining">
                  <span>Cần thanh toán thêm:</span>
                  <strong>{formatPrice((selectedBooking.totalPrice || 0) - (selectedBooking.depositAmount || 0))}</strong>
                </div>
              </div>

              {selectedBooking.status === 'COMPLETED' && (
                <div className="detail-section rating-section" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                  <h4><Star size={16} /> Đánh giá dịch vụ</h4>
                  {selectedBooking.rating ? (
                    <div className="rating-result">
                      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={20} fill={i < selectedBooking.rating ? "#fbbf24" : "none"} stroke={i < selectedBooking.rating ? "#fbbf24" : "currentColor"} />
                        ))}
                      </div>
                      <p style={{ fontStyle: 'italic', opacity: 0.8 }}>"{selectedBooking.reviewComment || "Không có nhận xét"}"</p>
                    </div>
                  ) : (
                    <div className="rating-form">
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={28} 
                            style={{ cursor: 'pointer' }}
                            fill={i < revRating ? "#fbbf24" : "none"} 
                            stroke={i < revRating ? "#fbbf24" : "currentColor"}
                            onClick={() => setRevRating(i + 1)}
                          />
                        ))}
                      </div>
                      <textarea 
                        placeholder="Nhận xét của bạn về dịch vụ..."
                        value={revComment}
                        onChange={(e) => setRevComment(e.target.value)}
                        className="review-textarea"
                      />
                      <button 
                        className="btn-primary-premium" 
                        style={{ marginTop: '10px', width: '100%', padding: '12px' }}
                        onClick={() => handleSendReview(selectedBooking.id)}
                        disabled={submittingReview}
                      >
                        {submittingReview ? "ĐANG GỬI..." : "GỬI ĐÁNH GIÁ"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <footer className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {selectedBooking.status === 'PENDING' && (
                <button 
                  className="btn-done" 
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                  style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }}
                >
                  Hủy lịch hẹn
                </button>
              )}
              <button className="btn-done" onClick={() => setSelectedBooking(null)}>Đóng</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
