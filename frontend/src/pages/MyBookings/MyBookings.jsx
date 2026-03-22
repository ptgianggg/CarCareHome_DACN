import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyBookings } from "@/services/api";
import { 
  Calendar, 
  MapPin, 
  Car, 
  Clock, 
  ChevronRight, 
  Search, 
  Package, 
  CreditCard,
  AlertCircle
} from "lucide-react";
import "./MyBookings.css";

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);

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

      {/* Modal chi tiết */}
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

              <div className="detail-section">
                <h4><Car size={16} /> Danh sách xe & Dịch vụ</h4>
                <div className="items-list-premium">
                  {selectedBooking.items && selectedBooking.items.length > 0 ? (
                    selectedBooking.items.map((item, i) => (
                      <div key={i} className="item-row-premium">
                        <div className="item-v-info">
                          <strong>{item.vehicleType}</strong>
                          <span>{item.vehiclePlate}</span>
                        </div>
                        <div className="item-s-info">{item.serviceType}</div>
                        <div className="item-price">{formatPrice(item.price)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="fallback-item">
                      <p>{selectedBooking.vehicleType} - {selectedBooking.vehiclePlate}</p>
                      <p>{selectedBooking.serviceType}</p>
                    </div>
                  )}
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
                      {selectedBooking.travelFee === 0 && selectedBooking.distance > 0 ? <span style={{ color: '#4ade80', marginRight: '8px', fontSize: '0.8rem', fontWeight: 'bold', background: 'rgba(34, 197, 94, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>FREE</span> : ""}
                      {formatPrice(selectedBooking.travelFee)}
                    </strong>
                  </div>
                )}
                <div className="summary-row" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '10px', paddingTop: '10px' }}>
                  <span>Tổng tiền thực tế:</span>
                  <strong>{formatPrice(selectedBooking.totalPrice)}</strong>
                </div>
                <div className="summary-row">
                  <span>Đã đặt cọc:</span>
                  <strong className="accent">{formatPrice(selectedBooking.depositAmount)}</strong>
                </div>
                <div className="summary-row total">
                  <span>Cần thanh toán thêm:</span>
                  <strong>{formatPrice((selectedBooking.totalPrice || 0) - (selectedBooking.depositAmount || 0))}</strong>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <button className="btn-done" onClick={() => setSelectedBooking(null)}>Đóng</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
