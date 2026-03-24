import { useEffect, useMemo, useRef, useState } from "react";

import { assignStaff, getAvailableStaff, getBookings } from "../../services/api";
import BookingDetailModal from "./components/BookingDetailModal";
import BookingRow from "./components/BookingRow";

import "./style.css";

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái", icon: "📋" },
  { value: "PENDING", label: "Chờ phân công", icon: "⏳" },
  { value: "SUCCESS", label: "Đã giao việc", icon: "✅" },
  { value: "IN_PROGRESS", label: "Đang thực hiện", icon: "🔧" },
  { value: "STAFF_REJECT", label: "Staff từ chối", icon: "⚠️" },
  { value: "COMPLETED", label: "Hoàn tất", icon: "🏁" },
  { value: "CANCEL", label: "Đã hủy bỏ", icon: "❌" },
];

function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);
  const [detailBooking, setDetailBooking] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const statusRef = useRef(null);

  useEffect(() => {
    fetchData();

    const handleClickOutside = (event) => {
      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setIsStatusOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchData() {
    setLoading(true);
    setErrorStatus(null);

    try {
      const [bookingsData, usersData] = await Promise.all([getBookings(), getAvailableStaff()]);

      if (bookingsData && bookingsData.error) {
        setErrorStatus(bookingsData.message || "Lỗi khi tải dữ liệu");
        setBookings([]);
      } else {
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      }

      if (usersData && usersData.error) {
        setStaffList([]);
        setErrorStatus((prev) => prev || usersData.message || "Lỗi khi tải danh sách nhân viên");
      } else if (Array.isArray(usersData)) {
        const staff = usersData.filter(
          (user) => user.role?.name === "STAFF" || user.role?.name === "ROLE_STAFF"
        );
        setStaffList(staff);
      } else {
        setStaffList([]);
      }
    } catch (error) {
      console.error("Fetch bookings error:", error);
      setErrorStatus("Lỗi kết nối máy chủ");
      setBookings([]);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffId || !detailBooking) return;

    try {
      await assignStaff(detailBooking.id, Number(selectedStaffId));
      await fetchData();

      const staff = staffList.find((item) => String(item.id) === String(selectedStaffId));
      setDetailBooking((prev) => (prev ? { ...prev, assignedStaff: staff } : prev));
      alert("Đã phân công nhân viên thành công!");
    } catch {
      alert("Lỗi khi phân công nhân viên");
    }
  };

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const matchesSearch =
          (booking.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (booking.customerPhone || "").includes(searchTerm) ||
          (booking.vehiclePlate || "").toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === "ALL" || (booking.status || "PENDING") === filterStatus;
        return matchesSearch && matchesStatus;
      }),
    [bookings, searchTerm, filterStatus]
  );

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  useEffect(() => setCurrentPage(1), [searchTerm, filterStatus]);

  const summary = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter(
        (booking) => (booking.status || "PENDING") === "PENDING" || booking.status === "STAFF_REJECT"
      ).length,
      success: bookings.filter((booking) =>
        ["SUCCESS", "IN_PROGRESS", "COMPLETED"].includes(booking.status)
      ).length,
      cancelled: bookings.filter((booking) => booking.status === "CANCEL").length,
    }),
    [bookings]
  );

  const selectedStatus = STATUS_OPTIONS.find((option) => option.value === filterStatus) || STATUS_OPTIONS[0];

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow" style={{ color: "var(--admin-primary)", opacity: 0.8 }}>
            QUẢN LÝ HỆ THỐNG
          </p>
          <h2
            style={{
              fontSize: "2.8rem",
              fontWeight: "900",
              letterSpacing: "-0.04em",
              background: "linear-gradient(to right, #fff, rgba(255,255,255,0.4))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Lịch hẹn khách hàng
          </h2>
        </div>
      </header>

      <section className="stats-grid" style={{ marginBottom: "40px" }}>
        <div
          className="stat-card"
          style={{
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), transparent)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
          }}
        >
          <p className="eyebrow">TỔNG LỊCH HẸN</p>
          <strong style={{ textShadow: "0 0 30px rgba(59, 130, 246, 0.4)" }}>{summary.total}</strong>
          <span style={{ opacity: 0.5 }}>Lịch hẹn hệ thống</span>
        </div>
        <div
          className="stat-card"
          style={{
            background: "rgba(252, 211, 77, 0.05)",
            border: "1px solid rgba(252, 211, 77, 0.2)",
            borderLeft: "5px solid #fbbf24",
          }}
        >
          <p className="eyebrow">ĐANG CHỜ</p>
          <strong style={{ color: "#fbbf24" }}>{summary.pending}</strong>
          <span style={{ opacity: 0.5 }}>Yêu cầu mới</span>
        </div>
        <div
          className="stat-card"
          style={{
            background: "rgba(16, 185, 129, 0.05)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderLeft: "5px solid #10b981",
          }}
        >
          <p className="eyebrow">XỬ LÝ/XONG</p>
          <strong style={{ color: "#10b981" }}>{summary.success}</strong>
          <span style={{ opacity: 0.5 }}>Đã hoàn tất/xác nhận</span>
        </div>
        <div
          className="stat-card"
          style={{
            background: "rgba(239, 68, 68, 0.05)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderLeft: "5px solid #ef4444",
          }}
        >
          <p className="eyebrow">ĐÃ HỦY</p>
          <strong style={{ color: "#ef4444" }}>{summary.cancelled}</strong>
          <span style={{ opacity: 0.5 }}>Bị từ chối/Hủy</span>
        </div>
      </section>

      <section className="service-layout">
        <article
          className="panel"
          style={{
            padding: "0",
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "24px",
            overflow: "hidden",
          }}
        >
          <div
            className="panel-heading"
            style={{
              padding: "30px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              flexWrap: "wrap",
              gap: "25px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: "20px", flex: 1, minWidth: "400px" }}>
              <div style={{ position: "relative", flex: 1, maxWidth: "500px" }}>
                <input
                  type="text"
                  placeholder="Tìm theo khách hàng, biển số xe, SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    height: "60px",
                    padding: "0 20px 0 55px",
                    borderRadius: "18px",
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "20px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--admin-primary)",
                  }}
                >
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
              </div>

              <div style={{ position: "relative" }} ref={statusRef}>
                <div
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  style={{
                    height: "60px",
                    minWidth: "240px",
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "18px",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 20px",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ marginRight: "10px", fontSize: "1.2rem" }}>{selectedStatus.icon}</span>
                  <span style={{ color: "#fff", fontWeight: "800", fontSize: "0.95rem", flex: 1 }}>
                    {selectedStatus.label}
                  </span>
                  <svg
                    style={{
                      transform: isStatusOpen ? "rotate(180deg)" : "none",
                      transition: "0.3s",
                      opacity: 0.5,
                    }}
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>

                {isStatusOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "70px",
                      width: "100%",
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "18px",
                      padding: "8px",
                      zIndex: 100,
                    }}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => {
                          setFilterStatus(option.value);
                          setIsStatusOpen(false);
                        }}
                        style={{
                          padding: "14px 18px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          color: filterStatus === option.value ? "#3b82f6" : "#94a3b8",
                          background:
                            filterStatus === option.value ? "rgba(59, 130, 246, 0.1)" : "transparent",
                          cursor: "pointer",
                          fontWeight: "700",
                        }}
                      >
                        <span style={{ fontSize: "1.2rem" }}>{option.icon}</span>
                        <span>{option.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleRefresh}
              style={{
                width: "60px",
                height: "60px",
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "18px",
                color: "var(--admin-primary)",
                cursor: "pointer",
              }}
            >
              <svg
                className={isRefreshing ? "spinning" : ""}
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M23 4v6h-6" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>

          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
            .spinning { animation: spin 0.8s linear infinite; }
            .booking-index-table span { display: flex; align-items: center; }
            .booking-item-row { transition: 0.3s; border-radius: 14px; margin: 0 10px; border-bottom: 1px solid rgba(255,255,255,0.03); }
            .booking-item-row:hover { background: rgba(59, 130, 246, 0.05); transform: translateX(5px); }
          `}</style>

          {errorStatus && !loading && (
            <div
              style={{
                padding: "16px 30px",
                color: "#fca5a5",
                borderBottom: "1px solid rgba(239,68,68,0.15)",
                background: "rgba(239,68,68,0.06)",
              }}
            >
              {errorStatus}
            </div>
          )}

          <div className="booking-index-table" style={{ padding: "10px 0" }}>
            <div
              className="booking-index-head"
              style={{
                padding: "20px 40px",
                background: "transparent",
                opacity: 0.5,
                fontWeight: "800",
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              <span>Khách hàng</span>
              <span>Liên hệ</span>
              <span>Phương tiện</span>
              <span>Dịch vụ</span>
              <span>Thời gian</span>
              <span style={{ textAlign: "right" }}>Thanh toán</span>
              <span style={{ textAlign: "center" }}>Trạng thái</span>
            </div>

            {loading && !isRefreshing && (
              <div style={{ padding: "100px", textAlign: "center" }}>
                <div className="spinner-heavy" style={{ margin: "0 auto" }} />
              </div>
            )}

            {!loading &&
              paginatedBookings.map((booking) => (
                <BookingRow
                  key={booking.id}
                  b={booking}
                  onDoubleClick={(selected) => {
                    setDetailBooking(selected);
                    setSelectedStaffId(selected.assignedStaff?.id ? String(selected.assignedStaff.id) : "");
                  }}
                />
              ))}
          </div>

          {!loading && totalPages > 1 && (
            <div
              style={{
                padding: "30px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p style={{ opacity: 0.4, fontSize: "0.9rem" }}>
                Đang xem lịch hẹn {paginatedBookings.length} trong {filteredBookings.length}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="page-btn">
                  {"<"}
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`page-btn ${currentPage === index + 1 ? "active" : ""}`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  className="page-btn"
                >
                  {">"}
                </button>
              </div>
            </div>
          )}
        </article>
      </section>

      <BookingDetailModal
        detailBooking={detailBooking}
        staffList={staffList}
        selectedStaffId={selectedStaffId}
        setSelectedStaffId={setSelectedStaffId}
        handleAssignStaff={handleAssignStaff}
        onClose={() => setDetailBooking(null)}
      />
    </>
  );
}

export default BookingManagement;
