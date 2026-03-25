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
  UserCheck,
  Phone,
  Coins,
  Ticket
} from "lucide-react";
import toast from 'react-hot-toast';
import PhoneVerificationModal from "@/components/common/PhoneVerificationModal/PhoneVerificationModal";
import { useNavigate } from "react-router-dom";
import "./MyBookings.css";

const MyBookings = () => {
  const { user, verifyLoyalty } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const navigate = useNavigate();
  
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
      const result = await addReview(id, revRating, revComment);
      if (result?.error) {
        toast.error(result.message || "Gửi đánh giá thất bại");
        return;
      }
      toast.success("Cảm ơn bạn đã đánh giá dịch vụ!");
      fetchUserBookings(); 
      setSelectedBooking(prev => ({...prev, rating: revRating, reviewComment: revComment}));
    } catch (error) {
      console.error("Error sending review:", error);
      toast.error("Lỗi hệ thống khi gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy lịch hẹn này?")) {
      try {
        const result = await updateBookingStatus(id, 'CANCEL');
        if (result?.error) {
          toast.error(result.message || "Lỗi khi hủy lịch hẹn");
          return;
        }
        toast.success("Đã hủy lịch hẹn thành công");
        fetchUserBookings();
        setSelectedBooking(null);
      } catch (error) {
        console.error("Error cancelling booking:", error);
        toast.error("Lỗi kết nối khi hủy lịch hẹn");
      }
    }
  };

  const getStatusText = (status) => {
    const s = String(status || "").toUpperCase();
    if (s.includes("WAITING_FOR_PAYMENT")) return "Chờ thanh toán";
    if (s.includes("AWAITING_FINAL_PAYMENT")) return "Đang thanh toán";
    if (s.includes("PENDING")) return "Chờ xử lý";
    if (s.includes("COMPLETED")) return "Hoàn tất";
    if (s.includes("SUCCESS")) return "Đã duyệt";
    if (s.includes("CANCEL")) return "Đã hủy";
    if (s.includes("REJECT")) return "Từ chối";
    if (s.includes("IN_PROGRESS")) return "Đang thực hiện";
    return status || "PENDING";
  };

  const getStatusBadge = (status) => {
    const s = String(status || "").toUpperCase();
    if (s.includes("WAITING_FOR_PAYMENT")) return "status-warning";
    if (s.includes("AWAITING_FINAL_PAYMENT")) return "status-warning";
    if (s.includes("PENDING")) return "status-pending";
    if (s.includes("COMPLETED")) return "status-success";
    if (s.includes("SUCCESS")) return "status-active";
    if (s.includes("CANCEL") || s.includes("REJECT")) return "status-error";
    if (s.includes("IN_PROGRESS")) return "status-active";
    return "status-active";
  };

  const filteredBookings = bookings.filter(b => {
    const s = String(b.status || "").toLowerCase();
    if (activeTab === "all") return true;
    if (activeTab === "waiting_for_payment") return s === "waiting_for_payment";
    if (activeTab === "pending") return s === "pending";
    if (activeTab === "success") return s.includes("success") || s.includes("completed");
    if (activeTab === "cancel") return s.includes("cancel") || s.includes("reject");
    return s.includes(activeTab);
  });

  const CountdownTimer = ({ createdAt, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
      const calculateTimeLeft = () => {
        const start = new Date(createdAt).getTime();
        const now = new Date().getTime();
        const diff = 5 * 60 * 1000 - (now - start);
        return Math.max(0, diff);
      };

      setTimeLeft(calculateTimeLeft());
      const timer = setInterval(() => {
        const remaining = calculateTimeLeft();
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
          if (onExpire) onExpire();
        }
      }, 1000);

      return () => clearInterval(timer);
    }, [createdAt]);

    if (timeLeft <= 0) return <span className="timer-expired">Hết hạn</span>;

    const mins = Math.floor(timeLeft / 60000);
    const secs = Math.floor((timeLeft % 60000) / 1000);
    return <span className="timer-active">{mins}:{secs < 10 ? '0' : ''}{secs}</span>;
  };

  const formatPrice = (price) => Number(price || 0).toLocaleString() + " ₫";
  const formatDate = (date, time) => `${date || ""} ${time || ""}`.trim();

  return (
    <div className="my-bookings-container">
      <div className="glass-bg-effect"></div>
      
      <div className="bookings-wrapper">
        <header className="page-header">
          <div className="badge">LỊCH SỬ DỊCH VỤ</div>
          <div className="header-main-row">
            <h1>Lịch hẹn của tôi</h1>
            <button className="loyalty-lookup-btn" onClick={() => setShowPhoneModal(true)}>
              <Coins size={18} />
              <span>Tra cứu điểm thưởng</span>
            </button>
          </div>
         
        </header>

        <section className="bookings-tabs-container">
          <div className="bookings-tabs">
            <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
              <span>Tất cả</span>
            </button>
            <button className={activeTab === "waiting_for_payment" ? "active" : ""} onClick={() => setActiveTab("waiting_for_payment")}>
              <span>Chờ thanh toán</span>
            </button>
            <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")}>
              <span>Chờ duyệt</span>
            </button>
            <button className={activeTab === "success" ? "active" : ""} onClick={() => setActiveTab("success")}>
              <span>Hoàn tất</span>
            </button>
            <button className={activeTab === "cancel" ? "active" : ""} onClick={() => setActiveTab("cancel")}>
              <span>Đã hủy</span>
            </button>
          </div>
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
                      <div>
                        <h3 style={{ marginBottom: '2px' }}>Booking #{booking.id}</h3>
                        <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.4 }}>Ngày tạo: {booking.createdAt ? new Date(booking.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"}</p>
                      </div>
                      <span className={`status-pill ${getStatusBadge(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                    <div className="info-details">
                      <div className="detail-pill"><Car size={13} /> {booking.items?.length || 1} Xe</div>
                      <div className="detail-pill"><Clock size={13} /> {formatDate(booking.bookingDate, booking.bookingTime)}</div>
                      {booking.status === "WAITING_FOR_PAYMENT" && (
                        <div className="pay-countdown-pill">
                          <Clock size={12} strokeWidth={3} />
                          <CountdownTimer createdAt={booking.createdAt} onExpire={fetchUserBookings} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="card-right">
                  <div className="price-wrapper">
                    <span className="price-label">Tổng thanh toán</span>
                    <span className="price-value">{formatPrice(booking.totalPrice)}</span>
                  </div>
                  {/* Points Badge */}
                  <div className="points-badge-mini">
                    <Coins size={12} className="points-icon" />
                    <span>+{booking.pointsEarned || Math.floor(((booking.totalPrice || 0) - (booking.travelFee || 0)) / 10000)} điểm</span>
                  </div>
                  <div className="action-circle">
                    <ChevronRight size={18} />
                  </div>
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
                  <p><strong>Ngày tạo đơn:</strong> {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString('vi-VN') : "N/A"}</p>
                  <p><strong>Ngày thực hiện:</strong> {selectedBooking.bookingDate}</p>
                  <p><strong>Giờ bắt đầu:</strong> {selectedBooking.bookingTime}</p>
                  <p className="full"><strong>Địa chỉ:</strong> {selectedBooking.addressName}</p>
                  <p className="full"><strong>Ghi chú:</strong> {selectedBooking.note || "Không có ghi chú"}</p>
                </div>
              </div>

              {selectedBooking.assignedStaffs && selectedBooking.assignedStaffs.length > 0 && (
                <div className="detail-section">
                  <h4><UserCheck size={16} /> Chuyên viên thực hiện</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                    {selectedBooking.assignedStaffs.map(as => (
                      <div key={as.id} style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '15px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                        {as.avatar ? (
                          <img src={as.avatar} alt={as.name} style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--p-accent, #3b82f6)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 'bold' }}>
                            {as.name?.charAt(0)}
                          </div>
                        )}
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{as.name}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={10} /> {as.phone || "N/A"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedBooking.proofImage && (
                <div className="detail-section">
                  <h4><Camera size={16} /> Hình ảnh nghiệm thu</h4>
                  <div className="proof-image-container" style={{ position: 'relative', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', padding: '10px' }}>
                    <img 
                      src={selectedBooking.proofImage} 
                      alt="Ảnh nghiệm thu dịch vụ" 
                      style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', display: 'block', margin: '0 auto' }} 
                    />
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
                  <strong>{formatPrice((selectedBooking.totalPrice || 0) + (selectedBooking.discountAmount || 0) - (selectedBooking.travelFee || 0))}</strong>
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
                {selectedBooking.discountAmount > 0 && (
                  <div className="summary-row voucher-applied-row" style={{ color: '#4ade80' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Ticket size={14} /> Voucher ({selectedBooking.voucherCode}):
                    </span>
                    <strong>-{formatPrice(selectedBooking.discountAmount)}</strong>
                  </div>
                )}
                <div className="summary-row total-calc" style={{ borderTop: '1.5px solid rgba(255,255,255,0.1)', marginTop: '8px', paddingTop: '8px' }}>
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

                <div className="summary-row points-row" style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', marginTop: '8px', paddingTop: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Coins size={14} color="#fbbf24" /> 
                    {selectedBooking.status === "COMPLETED" ? "Điểm đã nhận:" : "Điểm tích lũy dự kiến:"}
                  </span>
                  <strong style={{ color: '#fbbf24' }}>
                    +{selectedBooking.pointsEarned || Math.floor(((selectedBooking.totalPrice || 0) - (selectedBooking.travelFee || 0)) / 10000)} điểm
                  </strong>
                </div>

                <div className="summary-row payment-status">
                  <span>Trạng thái thanh toán:</span>
                  <span className={`status-pill ${selectedBooking.paymentStatus === 'PAID_FULL' ? 'status-success' : (selectedBooking.paymentStatus === 'DEPOSITED' ? 'status-active' : 'status-warning')}`}>
                    {selectedBooking.paymentStatus === 'PAID_FULL' ? 'Đã thanh toán đủ' : (selectedBooking.paymentStatus === 'DEPOSITED' ? 'Đã cọc 10%' : 'Chờ thanh toán')}
                  </span>
                </div>
              </div>

              {selectedBooking.status === 'WAITING_FOR_PAYMENT' && (
                <div className="repay-section" style={{ marginTop: '20px', padding: '16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#10b981' }}>⏳ Đang chờ thanh toán cọc</p>
                    <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>
                      Hết hiệu lực sau: <CountdownTimer createdAt={selectedBooking.createdAt} onExpire={() => setSelectedBooking(null)} />
                    </div>
                  </div>
                  <button 
                    className="btn-primary-premium" 
                    style={{ marginTop: '10px', width: '100%' }}
                    onClick={async () => {
                      try {
                        const response = await fetch(`${import.meta.env.VITE_API_URL}/momo/create-payment/${selectedBooking.id}`, {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}` 
                          }
                        });
                        const data = await response.json();
                        if (response.ok && data.payUrl) {
                          window.location.href = data.payUrl;
                        } else {
                          toast.error(data.message || "Lỗi khởi tạo thanh toán");
                        }
                      } catch {
                        toast.error("Không thể kết nối đến máy chủ");
                      }
                    }}
                  >
                    Thanh toán ngay qua MoMo
                  </button>
                </div>
              )}

              {selectedBooking.status === 'AWAITING_FINAL_PAYMENT' && (
                <div className="repay-section" style={{ marginTop: '20px', padding: '15px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', border: '1px dashed #a855f7' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#a855f7', fontWeight: '600' }}>
                    Dịch vụ đã hoàn tất. Kỹ thuật viên đang chờ bạn thanh toán phần còn lại.
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                    Số tiền cần thanh toán: <strong style={{ color: '#fff' }}>{formatPrice((selectedBooking.totalPrice || 0) - (selectedBooking.depositAmount || 0))}</strong>
                  </p>
                </div>
              )}

              {selectedBooking.status === 'COMPLETED' && (
                <div className="detail-section rating-section" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', marginTop: '10px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#fff', fontSize: '1.1rem' }}>
                    <Star size={18} fill="#fbbf24" stroke="#fbbf24" /> Đánh giá dịch vụ
                  </h4>
                  
                  {selectedBooking.rating ? (
                    <div className="rating-result" style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={18} fill={i < selectedBooking.rating ? "#fbbf24" : "none"} stroke={i < selectedBooking.rating ? "#fbbf24" : "rgba(255,255,255,0.2)"} />
                        ))}
                      </div>
                      <p style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                        "{selectedBooking.reviewComment || "Cảm ơn bạn đã tin tưởng dịch vụ của CarCareHome!"}"
                      </p>
                    </div>
                  ) : (
                    <div className="rating-form" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>Trải nghiệm của bạn như thế nào? Hãy chia sẻ để chúng tôi hoàn thiện hơn.</p>
                      
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'center' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={32} 
                            style={{ 
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              transform: i < revRating ? 'scale(1.1)' : 'scale(1)'
                            }}
                            fill={i < revRating ? "#fbbf24" : "none"} 
                            stroke={i < revRating ? "#fbbf24" : "rgba(255,255,255,0.3)"}
                            onClick={() => setRevRating(i + 1)}
                            onMouseEnter={() => setRevRating(i + 1)}
                          />
                        ))}
                      </div>

                      <textarea 
                        placeholder="Nhận xét của bạn về dịch vụ..."
                        value={revComment}
                        onChange={(e) => setRevComment(e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: '100px',
                          background: 'rgba(0, 0, 0, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          padding: '16px',
                          color: '#fff',
                          fontSize: '0.95rem',
                          outline: 'none',
                          resize: 'none',
                          marginBottom: '16px',
                          transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#1d70ff'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                      />

                      <button 
                        className="hero-primary-btn" 
                        style={{ 
                          width: '100%', 
                          justifyContent: 'center',
                          padding: '16px',
                          background: revRating > 0 ? 'linear-gradient(to right, #1d70ff, #31a4ff)' : 'rgba(255,255,255,0.05)',
                          color: revRating > 0 ? '#fff' : 'rgba(255,255,255,0.2)',
                          cursor: revRating > 0 ? 'pointer' : 'not-allowed'
                        }}
                        onClick={() => revRating > 0 && handleSendReview(selectedBooking.id)}
                        disabled={submittingReview || revRating === 0}
                      >
                        {submittingReview ? "ĐANG GỬI..." : "GỬI ĐÁNH GIÁ NGAY"}
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
      <PhoneVerificationModal 
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)} 
        onVerify={() => {
          setShowPhoneModal(false);
          verifyLoyalty();
          navigate("/loyalty");
        }}
        correctPhone={user?.phone}
      />
    </div>
  );
};

export default MyBookings;
