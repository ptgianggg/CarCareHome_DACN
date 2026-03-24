import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Car,
  Camera,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  Star,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import { addReview, getMyBookings, updateBookingStatus } from "@/services/api";

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

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:8080";

  useEffect(() => {
    if (user?.email) {
      fetchUserBookings();
    }
  }, [user]);

  useEffect(() => {
    setRevRating(selectedBooking?.rating || 0);
    setRevComment(selectedBooking?.reviewComment || "");
  }, [selectedBooking]);

  const fetchUserBookings = async () => {
    setLoading(true);
    try {
      const data = await getMyBookings(user.email);
      if (Array.isArray(data)) {
        setBookings(data);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Fetch my bookings failed:", error);
      setBookings([]);
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
        throw new Error(result.message);
      }

      toast.success("Cảm ơn bạn đã đánh giá dịch vụ!");
      await fetchUserBookings();
      setSelectedBooking((prev) =>
        prev
          ? {
              ...prev,
              rating: revRating,
              reviewComment: revComment,
            }
          : prev
      );
    } catch {
      toast.error("Gửi đánh giá thất bại");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy lịch hẹn này?")) return;

    try {
      const result = await updateBookingStatus(id, "CANCEL");
      if (result?.error) {
        throw new Error(result.message);
      }

      toast.success("Đã hủy lịch hẹn thành công");
      await fetchUserBookings();
      setSelectedBooking(null);
    } catch {
      toast.error("Lỗi khi hủy lịch hẹn");
    }
  };

  const getStatusBadge = (status) => {
    const normalized = String(status || "").toUpperCase();
    if (normalized === "PENDING" || normalized === "STAFF_REJECT") return "status-pending";
    if (normalized === "COMPLETED") return "status-success";
    if (normalized === "CANCEL") return "status-error";
    return "status-active";
  };

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const normalized = String(booking.status || "").toUpperCase();

        if (activeTab === "pending") {
          return normalized !== "COMPLETED" && normalized !== "CANCEL";
        }
        if (activeTab === "success") {
          return normalized === "COMPLETED";
        }
        if (activeTab === "cancel") {
          return normalized === "CANCEL";
        }
        return true;
      }),
    [activeTab, bookings]
  );

  const formatPrice = (price) => `${Number(price || 0).toLocaleString()} ₫`;
  const formatDate = (date, time) => `${date || ""} ${time || ""}`.trim();

  const resolveProofImage = (proofImage) => {
    if (!proofImage) return null;
    if (proofImage.startsWith("data:") || proofImage.startsWith("http")) return proofImage;
    if (proofImage.startsWith("/")) return `${apiBaseUrl}${proofImage}`;
    return null;
  };

  const proofImageUrl = resolveProofImage(selectedBooking?.proofImage);

  return (
    <div className="my-bookings-container">
      <div className="glass-bg-effect" />

      <div className="bookings-wrapper">
        <header className="page-header">
          <div className="badge">LỊCH SỬ DỊCH VỤ</div>
          <h1>Lịch hẹn của tôi</h1>
          <p>Quản lý và theo dõi tiến độ chăm sóc xế yêu của bạn</p>
        </header>

        <section className="bookings-tabs">
          <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
            Tất cả
          </button>
          <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")}>
            Đang xử lý
          </button>
          <button className={activeTab === "success" ? "active" : ""} onClick={() => setActiveTab("success")}>
            Hoàn tất
          </button>
          <button className={activeTab === "cancel" ? "active" : ""} onClick={() => setActiveTab("cancel")}>
            Đã hủy
          </button>
        </section>

        <div className="bookings-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
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
                      <span>
                        <Car size={14} /> {booking.items?.length || 1} xe
                      </span>
                      <span>
                        <Clock size={14} /> {formatDate(booking.bookingDate, booking.bookingTime)}
                      </span>
                      <span>
                        <MapPin size={14} /> {booking.addressName?.split(",")[0]}...
                      </span>
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
          <div className="booking-modal-card glass-modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>Chi tiết lịch hẹn #{selectedBooking.id}</h2>
              <button className="close-btn" onClick={() => setSelectedBooking(null)}>
                &times;
              </button>
            </header>

            <div className="modal-content">
              <div className="detail-section">
                <h4>
                  <Calendar size={16} /> Thông tin chung
                </h4>
                <div className="detail-grid">
                  <p>
                    <strong>Ngày thực hiện:</strong> {selectedBooking.bookingDate}
                  </p>
                  <p>
                    <strong>Giờ bắt đầu:</strong> {selectedBooking.bookingTime}
                  </p>
                  <p className="full">
                    <strong>Địa chỉ:</strong> {selectedBooking.addressName}
                  </p>
                  <p className="full">
                    <strong>Ghi chú:</strong> {selectedBooking.note || "Không có ghi chú"}
                  </p>
                </div>
              </div>

              {selectedBooking.assignedStaff && (
                <div className="detail-section">
                  <h4>
                    <UserCheck size={16} /> Nhân viên thực hiện
                  </h4>
                  <div className="staff-card-inline">
                    <div className="staff-avatar-inline">
                      {selectedBooking.assignedStaff.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="staff-name-inline">{selectedBooking.assignedStaff.name}</p>
                      <p className="staff-role-inline">Chuyên viên kỹ thuật</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedBooking.proofImage && (
                <div className="detail-section">
                  <h4>
                    <Camera size={16} /> Hình ảnh nghiệm thu
                  </h4>
                  <div className="proof-image-container">
                    {proofImageUrl ? (
                      <img src={proofImageUrl} alt="Nghiệm thu" className="proof-image" />
                    ) : (
                      <p className="proof-image-placeholder">Đã có ảnh nghiệm thu được tải lên.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4>
                  <Car size={16} /> Danh sách xe và dịch vụ
                </h4>
                <div className="items-list-premium">
                  {selectedBooking.items && selectedBooking.items.length > 0 ? (
                    selectedBooking.items.map((item, index) => (
                      <div key={index} className="item-row-premium">
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
                      <p>
                        {selectedBooking.vehicleType} - {selectedBooking.vehiclePlate}
                      </p>
                      <p>{selectedBooking.serviceType}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section payment-summary">
                <div className="summary-row">
                  <span>Tiền dịch vụ:</span>
                  <strong>
                    {formatPrice((selectedBooking.totalPrice || 0) - (selectedBooking.travelFee || 0))}
                  </strong>
                </div>
                {selectedBooking.distance != null && (
                  <div className="summary-row">
                    <span>Phí di chuyển ({selectedBooking.distance} km):</span>
                    <strong>
                      {selectedBooking.travelFee === 0 && selectedBooking.distance > 0 ? (
                        <span className="free-badge">FREE</span>
                      ) : null}
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
                  <strong>
                    {formatPrice((selectedBooking.totalPrice || 0) - (selectedBooking.depositAmount || 0))}
                  </strong>
                </div>
              </div>

              {selectedBooking.status === "COMPLETED" && (
                <div className="detail-section rating-section">
                  <h4>
                    <Star size={16} /> Đánh giá dịch vụ
                  </h4>
                  {selectedBooking.rating ? (
                    <div className="rating-result">
                      <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            size={20}
                            fill={index < selectedBooking.rating ? "#fbbf24" : "none"}
                            stroke={index < selectedBooking.rating ? "#fbbf24" : "currentColor"}
                          />
                        ))}
                      </div>
                      <p style={{ fontStyle: "italic", opacity: 0.8 }}>
                        "{selectedBooking.reviewComment || "Không có nhận xét"}"
                      </p>
                    </div>
                  ) : (
                    <div className="rating-form">
                      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            size={28}
                            style={{ cursor: "pointer" }}
                            fill={index < revRating ? "#fbbf24" : "none"}
                            stroke={index < revRating ? "#fbbf24" : "currentColor"}
                            onClick={() => setRevRating(index + 1)}
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
                        style={{ marginTop: "10px", width: "100%", padding: "12px" }}
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

            <footer className="modal-footer modal-footer-actions">
              {selectedBooking.status === "PENDING" && (
                <button
                  className="btn-done btn-cancel-booking"
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                >
                  Hủy lịch hẹn
                </button>
              )}
              <button className="btn-done" onClick={() => setSelectedBooking(null)}>
                Đóng
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
