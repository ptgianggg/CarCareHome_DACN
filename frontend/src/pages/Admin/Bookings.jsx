import { useEffect, useState, useMemo, useRef } from "react";
import { getBookings } from "../../services/api";
import "./style.css";

const ITEMS_PER_PAGE = 10;

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function formatDateTime(dateValue, timeValue) {
  if (!dateValue && !timeValue) return "-";
  return `${dateValue || ""} ${timeValue || ""}`.trim();
}

function statusTone(status) {
  const val = String(status || "").toLowerCase();
  if (val.includes("pending") || val.includes("chờ")) return "pending";
  if (val.includes("done") || val.includes("complete") || val.includes("success") || val.includes("thành công")) return "success";
  if (val.includes("cancel") || val.includes("fail") || val.includes("reject") || val.includes("hủy")) return "warning";
  return "active";
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Đang chờ xử lý" },
  { value: "SUCCESS", label: "Đặt thành công"},
  { value: "CANCEL", label: "Đã hủy bỏ" },
];

function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);
  const [detailBooking, setDetailBooking] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = useRef(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

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
      const data = await getBookings();
      if (data && data.error) {
        setErrorStatus(data.message || "Lỗi khi tải dữ liệu");
        setBookings([]);
      } else {
        setBookings(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Fetch bookings error:", error);
      setErrorStatus("Lỗi kết nối máy chủ");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = 
        (b.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.customerPhone || "").includes(searchTerm);
      const matchesStatus = filterStatus === "ALL" || (b.status || "PENDING") === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  useEffect(() => setCurrentPage(1), [searchTerm, filterStatus]);

  const summary = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter(b => (b.status || "PENDING") === "PENDING").length,
    success: bookings.filter(b => b.status === "SUCCESS").length,
    cancelled: bookings.filter(b => b.status === "CANCEL").length
  }), [bookings]);

  const selectedStatus = STATUS_OPTIONS.find(opt => opt.value === filterStatus);

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow" style={{ color: "var(--admin-primary)", opacity: 0.8 }}>SYSTEM MANAGEMENT</p>
          <h2 style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.04em', background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.4))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lịch Hẹn Khách Hàng</h2>
        </div>
      </header>

      {/* Summary Stats */}
      <section className="stats-grid" style={{ marginBottom: '40px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), transparent)', backdropFilter: 'blur(10px)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <p className="eyebrow">TỔNG LỊCH HẸN</p>
          <strong style={{ textShadow: '0 0 30px rgba(59, 130, 246, 0.4)' }}>{summary.total}</strong>
          <span style={{ opacity: 0.5 }}>Lịch hẹn hệ thống</span>
        </div>
        <div className="stat-card" style={{ background: 'rgba(252, 211, 77, 0.05)', border: '1px solid rgba(252, 211, 77, 0.2)', borderLeft: '5px solid #fbbf24' }}>
          <p className="eyebrow">ĐANG CHỜ</p>
          <strong style={{ color: '#fbbf24' }}>{summary.pending}</strong>
          <span style={{ opacity: 0.5 }}>Yêu cầu mới</span>
        </div>
        <div className="stat-card" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderLeft: '5px solid #10b981' }}>
          <p className="eyebrow">THÀNH CÔNG</p>
          <strong style={{ color: '#10b981' }}>{summary.success}</strong>
          <span style={{ opacity: 0.5 }}>Đã hoàn tất</span>
        </div>
        <div className="stat-card" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderLeft: '5px solid #ef4444' }}>
          <p className="eyebrow">ĐÃ HỦY</p>
          <strong style={{ color: '#ef4444' }}>{summary.cancelled}</strong>
          <span style={{ opacity: 0.5 }}>Bị từ chối/Hủy</span>
        </div>
      </section>

      <section className="service-layout">
        <article className="panel" style={{ padding: '0', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', overflow: 'hidden' }}>
          
          {/* Controls Bar - CUSTOM UI */}
          <div className="panel-heading" style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '20px', flex: 1, minWidth: '400px' }}>
              
              {/* Premium Search */}
              <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
                <input 
                  type="text" 
                  placeholder="Tìm theo khách hàng, biển số xe, SĐT..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: '100%', 
                    height: '60px',
                    padding: '0 20px 0 55px', 
                    borderRadius: '18px', 
                    background: 'rgba(0,0,0,0.4)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    color: '#fff',
                    fontSize: '1rem',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
                <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-primary)' }}>
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
              </div>

              {/* CUSTOM STATUS SELECT */}
              <div style={{ position: 'relative' }} ref={statusRef}>
                <div 
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  style={{ 
                    height: '60px', 
                    minWidth: '240px', 
                    background: 'rgba(0,0,0,0.4)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '18px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '0 20px', 
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: '0.3s'
                  }}
                >
                  <span style={{ marginRight: '10px', fontSize: '1.2rem' }}>{selectedStatus.icon}</span>
                  <span style={{ color: '#fff', fontWeight: '800', fontSize: '0.95rem', flex: 1 }}>{selectedStatus.label}</span>
                  <svg style={{ transform: isStatusOpen ? 'rotate(180deg)' : 'none', transition: '0.3s', opacity: 0.5 }} width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
                </div>

                {isStatusOpen && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '70px', 
                    width: '100%', 
                    background: '#0f172a', 
                    border: '1px solid rgba(255,255,255,0.15)', 
                    borderRadius: '18px', 
                    padding: '8px', 
                    zIndex: 100,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    animation: 'slideUp 0.3s ease'
                  }}>
                    {STATUS_OPTIONS.map((opt) => (
                      <div 
                        key={opt.value}
                        onClick={() => { setFilterStatus(opt.value); setIsStatusOpen(false); }}
                        style={{ 
                          padding: '14px 18px', 
                          borderRadius: '12px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          color: filterStatus === opt.value ? '#3b82f6' : '#94a3b8',
                          background: filterStatus === opt.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          cursor: 'pointer',
                          fontWeight: '700',
                          transition: '0.2s'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleRefresh}
              style={{ 
                width: '60px', 
                height: '60px', 
                background: 'rgba(59, 130, 246, 0.1)', 
                border: '1px solid rgba(59, 130, 246, 0.3)', 
                borderRadius: '18px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--admin-primary)',
                cursor: 'pointer'
              }}
            >
              <svg className={isRefreshing ? 'spinning' : ''} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
          </div>

          <style>{`
            @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes spin { 100% { transform: rotate(360deg); } }
            .spinning { animation: spin 0.8s linear infinite; }
            .booking-index-table span { display: flex; align-items: center; }
            .booking-item-row { transition: 0.3s; border-radius: 14px; margin: 0 10px; border-bottom: 1px solid rgba(255,255,255,0.03); }
            .booking-item-row:hover { background: rgba(59, 130, 246, 0.05); transform: translateX(5px); }
          `}</style>

          {/* Table Content */}
          <div className="booking-index-table" style={{ padding: '10px 0' }}>
            <div className="booking-index-head" style={{ padding: '20px 40px', background: 'transparent', opacity: 0.5, fontWeight: '800', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              <span>Khách hàng</span>
              <span>Liên hệ</span>
              <span>Phương tiện</span>
              <span>Dịch vụ</span>
              <span>Thời gian</span>
              <span style={{ textAlign: 'right' }}>Thanh toán</span>
              <span style={{ textAlign: 'center' }}>Trạng thái</span>
            </div>

            {loading && !isRefreshing && <div style={{ padding: '100px', textAlign: 'center' }}><div className="spinner-heavy" style={{ margin: '0 auto' }}></div></div>}

            {!loading && paginatedBookings.map((b) => (
              <div 
                key={b.id} 
                className="booking-item-row" 
                onDoubleClick={() => setDetailBooking(b)}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '20px 30px', cursor: 'pointer', alignItems: 'center' }}
              >
                <div>
                  <p style={{ fontWeight: '900', margin: 0, fontSize: '1.05rem', color: '#fff' }}>{b.customerName}</p>
                  <small style={{ opacity: 0.4 }}>ORD-#{b.id}</small>
                </div>
                <span style={{ fontWeight: '600', opacity: 0.8 }}>{b.customerPhone}</span>
                <div style={{ fontSize: '0.9rem' }}>
                  <p style={{ margin: 0, fontWeight: '700' }}>{b.vehiclePlate || "N/A"}</p>
                  <small style={{ opacity: 0.4 }}>{b.vehicleType}</small>
                </div>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.serviceType}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: '800' }}>{b.bookingTime}</p>
                  <small style={{ opacity: 0.4 }}>{b.bookingDate}</small>
                </div>
                <span style={{ fontWeight: '900', color: '#3b82f6', fontSize: '1.2rem', justifyContent: 'flex-end' }}>{formatPrice(b.totalPrice)}</span>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <span className={`status ${statusTone(b.status)}`} style={{ padding: '8px 16px', borderRadius: '12px', fontWeight: '900', fontSize: '0.7rem' }}>
                    {b.status === "SUCCESS" ? "THÀNH CÔNG" : b.status === "CANCEL" ? "ĐÃ HỦY" : "ĐANG CHỜ"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Premium Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ opacity: 0.4, fontSize: '0.9rem' }}>Đang xem lịch hẹn {paginatedBookings.length} trong {filteredBookings.length}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setCurrentPage(c => Math.max(1, c-1))} style={{ width: '45px', height: '45px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>{"<"}</button>
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentPage(i+1)}
                    style={{ 
                      width: '45px', height: '45px', borderRadius: '14px', 
                      background: currentPage === i+1 ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontWeight: '900', cursor: 'pointer'
                    }}
                  >{i+1}</button>
                ))}
                <button onClick={() => setCurrentPage(c => Math.min(totalPages, c+1))} style={{ width: '45px', height: '45px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>{">"}</button>
              </div>
            </div>
          )}
        </article>
      </section>

      {/* Modern Detail Modal */}
      {detailBooking && (
        <div className="service-modal-backdrop" style={{ background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(15px)' }} onClick={() => setDetailBooking(null)}>
          <article className="panel service-modal" style={{ maxWidth: '850px', width: '95%', padding: '0', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p className="eyebrow" style={{ color: '#3b82f6', fontWeight: '900' }}>HỒ SƠ LỊCH HẸN</p>
                <h3 style={{ fontSize: '2rem', fontWeight: '900', margin: '5px 0' }}>{detailBooking.customerName}</h3>
                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>ORD-ITEM-CODE: #{detailBooking.id}</span>
              </div>
              <button onClick={() => setDetailBooking(null)} style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
            
            <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div>
                <p className="eyebrow">👤 KHÁCH HÀNG</p>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '18px' }}>
                  <p><strong>Điện thoại:</strong> {detailBooking.customerPhone}</p>
                  <p><strong>Email:</strong> {detailBooking.customerEmail || "N/A"}</p>
                  <p><strong>Địa chỉ:</strong> {detailBooking.addressName}</p>
                </div>
              </div>
              <div>
                <p className="eyebrow">🔧 DỊCH VỤ</p>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '18px' }}>
                  <p><strong>Ngày đặt:</strong> {detailBooking.bookingDate}</p>
                  <p><strong>Khung giờ:</strong> {detailBooking.bookingTime}</p>
                  <p><strong>Trạng thái:</strong> <span className={`status ${statusTone(detailBooking.status)}`}>{detailBooking.status}</span></p>
                </div>
              </div>
            </div>

            <div style={{ padding: '0 40px 40px' }}>
              <p className="eyebrow">💰 CHI TIẾT THANH TOÁN</p>
              <div style={{ background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.1), transparent)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.1rem' }}>
                  <span style={{ fontWeight: '700', opacity: 0.6 }}>Phí dịch vụ:</span>
                  <span style={{ fontWeight: '900', color: '#fff' }}>{formatPrice(detailBooking.totalPrice - (detailBooking.travelFee || 0))}</span>
                </div>
                {detailBooking.distance != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '1.1rem' }}>
                    <span style={{ fontWeight: '700', opacity: 0.6 }}>Phí di chuyển ({detailBooking.distance} km):</span>
                    <span style={{ fontWeight: '900', color: '#fff' }}>
                      {detailBooking.travelFee === 0 && detailBooking.distance > 0 ? <span style={{ color: '#4ade80', marginRight: '8px' }}>FREE</span> : ""}
                      {formatPrice(detailBooking.travelFee)}
                    </span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: '700', opacity: 0.6 }}>TỔNG CHI PHÍ THỰC TẾ:</span>
                  <span style={{ fontSize: '2.5rem', fontWeight: '900', color: '#3b82f6' }}>{formatPrice(detailBooking.totalPrice)}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '30px 40px', background: 'rgba(255,255,255,0.02)', textAlign: 'right' }}>
              <button onClick={() => setDetailBooking(null)} className="primary-button" style={{ padding: '15px 50px', borderRadius: '16px' }}>ĐÓNG HỒ SƠ</button>
            </div>
          </article>
        </div>
      )}
    </>
  );
}

export default BookingManagement;
