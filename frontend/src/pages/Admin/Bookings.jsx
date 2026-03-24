import { useEffect, useState, useMemo, useRef } from "react";
import { getBookings, getAvailableStaff, assignStaff } from "../../services/api";
import BookingRow from "./components/BookingRow";
import BookingDetailModal from "./components/BookingDetailModal";
import "./style.css";

import { toast } from "react-hot-toast";

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ phân công" },
  { value: "SUCCESS", label: "Đã giao việc" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "AWAITING_FINAL_PAYMENT", label: "Chờ thanh toán cuối" },
  { value: "STAFF_REJECT", label: "Staff từ chối" },
  { value: "COMPLETED", label: "Hoàn tất" },
  { value: "CANCEL", label: "Đã hủy bỏ" },
];

function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [detailBooking, setDetailBooking] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = useRef(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const PRICE_OPTIONS = [
    { value: "ALL", label: "Tất cả giá" },
    { value: "UNDER_100", label: "Dưới 100k" },
    { value: "100_500", label: "100k - 500k" },
    { value: "500_1000", label: "500k - 1tr" },
    { value: "OVER_1000", label: "Trên 1tr" },
  ];

  const DATE_OPTIONS = [
    { value: "ALL", label: "Tất cả thời gian" },
    { value: "TODAY", label: "Hôm nay" },
    { value: "THIS_WEEK", label: "Tuần này" },
    { value: "THIS_MONTH", label: "Tháng này" },
  ];

  const [filterPrice, setFilterPrice] = useState("ALL");
  const [filterDate, setFilterDate] = useState("ALL");
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);

  const priceRef = useRef(null);
  const dateRef = useRef(null);

  useEffect(() => {
    fetchData();
    const handleClickOutside = (event) => {
      if (statusRef.current && !statusRef.current.contains(event.target)) setIsStatusOpen(false);
      if (priceRef.current && !priceRef.current.contains(event.target)) setIsPriceOpen(false);
      if (dateRef.current && !dateRef.current.contains(event.target)) setIsDateOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [bookingsData, usersData] = await Promise.all([
        getBookings(),
        getAvailableStaff()
      ]);
      
      if (bookingsData && bookingsData.error) {
        console.error(bookingsData.message || "Lỗi khi tải dữ liệu");
        setBookings([]);
      } else {
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      }

      if (Array.isArray(usersData)) {
          const staff = usersData.filter(u => u.role?.name === 'STAFF' || u.role?.name === 'ROLE_STAFF');
          setStaffList(staff);
      }
    } catch (error) {
      console.error("Fetch bookings error:", error);
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

  const handleAssignStaff = async () => {
    if (selectedStaffIds.length === 0 || !detailBooking) return;
    setIsAssigning(true);
    try {
        await assignStaff(detailBooking.id, selectedStaffIds);
        await fetchData();
        const selectedStaffs = staffList.filter(s => selectedStaffIds.includes(s.id));
        setDetailBooking(prev => ({...prev, assignedStaffs: selectedStaffs}));
        toast.success("Đã phân công nhân viên thành công!");
    } catch {
        toast.error("Lỗi khi phân công nhân viên");
    } finally {
        setIsAssigning(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = 
        (b.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.customerPhone || "").includes(searchTerm) ||
        (b.vehiclePlate || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === "ALL" || (b.status || "PENDING") === filterStatus;

      let matchesPrice = true;
      if (filterPrice === "UNDER_100") matchesPrice = b.totalPrice < 100000;
      else if (filterPrice === "100_500") matchesPrice = b.totalPrice >= 100000 && b.totalPrice <= 500000;
      else if (filterPrice === "500_1000") matchesPrice = b.totalPrice > 500000 && b.totalPrice <= 1000000;
      else if (filterPrice === "OVER_1000") matchesPrice = b.totalPrice > 1000000;

      let matchesDate = true;
      if (filterDate === "TODAY") {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        matchesDate = (b.bookingDate === todayStr);
      } else if (filterDate === "THIS_WEEK") {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const bDate = new Date(b.bookingDate);
        matchesDate = bDate >= startOfWeek;
      } else if (filterDate === "THIS_MONTH") {
        const now = new Date();
        const bDate = new Date(b.bookingDate);
        matchesDate = bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesStatus && matchesPrice && matchesDate;
    });
  }, [bookings, searchTerm, filterStatus, filterPrice, filterDate]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  useEffect(() => setCurrentPage(1), [searchTerm, filterStatus, filterPrice, filterDate]);

  const summary = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter(b => (b.status || "PENDING") === "PENDING" || b.status === "STAFF_REJECT").length,
    success: bookings.filter(b => b.status === "SUCCESS" || b.status === "IN_PROGRESS" || b.status === "COMPLETED").length,
    cancelled: bookings.filter(b => b.status === "CANCEL").length
  }), [bookings]);

  // Xác định những nhân viên đang bận (đang làm việc chưa hoàn tất)
  const busyStaffIds = useMemo(() => {
    const busyIds = new Set();
    bookings.forEach(b => {
      // Nếu đơn đang thực hiện và có nhân viên gán
      if (b.assignedStaffs && b.assignedStaffs.length > 0 && 
          b.status !== 'COMPLETED' && 
          b.status !== 'CANCEL' && 
          b.status !== 'STAFF_REJECT') {
        b.assignedStaffs.forEach(s => busyIds.add(s.id));
      }
    });
    return busyIds;
  }, [bookings]);

  const selectedStatus = STATUS_OPTIONS.find(opt => opt.value === filterStatus);

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow" style={{ color: "var(--admin-primary)", opacity: 0.8 }}>QUẢN LÝ HỆ THỐNG</p>
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
          <p className="eyebrow">XỬ LÝ/XONG</p>
          <strong style={{ color: '#10b981' }}>{summary.success}</strong>
          <span style={{ opacity: 0.5 }}>Đã hoàn tất/Xác nhận</span>
        </div>
        <div className="stat-card" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderLeft: '5px solid #ef4444' }}>
          <p className="eyebrow">ĐÃ HỦY</p>
          <strong style={{ color: '#ef4444' }}>{summary.cancelled}</strong>
          <span style={{ opacity: 0.5 }}>Bị từ chối/Hủy</span>
        </div>
      </section>

      <section className="service-layout">
        <article className="panel" style={{ padding: '0', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', overflow: 'hidden' }}>
          
          {/* Controls Bar */}
          <div className="panel-heading" style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '20px', flex: 1, minWidth: '400px' }}>
              
              <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
                <input 
                  type="text" 
                  placeholder="Tìm theo khách hàng, biển số xe, SĐT..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: '100%', height: '60px', padding: '0 20px 0 55px', 
                    borderRadius: '18px', background: 'rgba(0,0,0,0.4)', 
                    border: '1px solid rgba(255,255,255,0.1)', color: '#fff'
                  }}
                />
                <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-primary)' }}>
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
              </div>

              <div style={{ position: 'relative' }} ref={statusRef}>
                <div 
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  style={{ 
                    height: '60px', minWidth: '180px', background: 'rgba(0,0,0,0.4)', 
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', 
                    display: 'flex', alignItems: 'center', padding: '0 20px', cursor: 'pointer'
                  }}
                >
                  <span style={{ color: '#fff', fontWeight: '800', fontSize: '0.85rem', flex: 1 }}>{selectedStatus?.label}</span>
                  <svg style={{ transform: isStatusOpen ? 'rotate(180deg)' : 'none', transition: '0.3s', opacity: 0.5 }} width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
                </div>

                {isStatusOpen && (
                  <div style={{ 
                    position: 'absolute', top: '70px', width: '220px', 
                    background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', 
                    borderRadius: '18px', padding: '8px', zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                  }}>
                    {STATUS_OPTIONS.map((opt) => (
                      <div 
                        key={opt.value}
                        onClick={() => { setFilterStatus(opt.value); setIsStatusOpen(false); }}
                        style={{ 
                          padding: '12px 14px', borderRadius: '12px', display: 'flex', 
                          alignItems: 'center', gap: '10px', color: filterStatus === opt.value ? '#3b82f6' : '#94a3b8',
                          background: filterStatus === opt.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem'
                        }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ position: 'relative' }} ref={priceRef}>
                <div 
                  onClick={() => setIsPriceOpen(!isPriceOpen)}
                  style={{ 
                    height: '60px', minWidth: '160px', background: 'rgba(0,0,0,0.4)', 
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', 
                    display: 'flex', alignItems: 'center', padding: '0 20px', cursor: 'pointer'
                  }}
                >
                  <span style={{ color: '#fff', fontWeight: '800', fontSize: '0.85rem', flex: 1 }}>{PRICE_OPTIONS.find(o => o.value === filterPrice).label}</span>
                  <svg style={{ transform: isPriceOpen ? 'rotate(180deg)' : 'none', transition: '0.3s', opacity: 0.5 }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
                </div>
                {isPriceOpen && (
                  <div style={{ position: 'absolute', top: '70px', width: '180px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '18px', padding: '8px', zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                    {PRICE_OPTIONS.map(opt => (
                      <div key={opt.value} onClick={() => { setFilterPrice(opt.value); setIsPriceOpen(false); }} style={{ padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', color: filterPrice === opt.value ? '#3b82f6' : '#94a3b8', background: filterPrice === opt.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent', fontSize: '0.85rem' }}>
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ position: 'relative' }} ref={dateRef}>
                <div 
                  onClick={() => setIsDateOpen(!isDateOpen)}
                  style={{ 
                    height: '60px', minWidth: '180px', background: 'rgba(0,0,0,0.4)', 
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', 
                    display: 'flex', alignItems: 'center', padding: '0 20px', cursor: 'pointer'
                  }}
                >
                  <span style={{ color: '#fff', fontWeight: '800', fontSize: '0.85rem', flex: 1 }}>{DATE_OPTIONS.find(o => o.value === filterDate).label}</span>
                  <svg style={{ transform: isDateOpen ? 'rotate(180deg)' : 'none', transition: '0.3s', opacity: 0.5 }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
                </div>
                {isDateOpen && (
                  <div style={{ position: 'absolute', top: '70px', width: '200px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '18px', padding: '8px', zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                    {DATE_OPTIONS.map(opt => (
                      <div key={opt.value} onClick={() => { setFilterDate(opt.value); setIsDateOpen(false); }} style={{ padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', color: filterDate === opt.value ? '#3b82f6' : '#94a3b8', background: filterDate === opt.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent', fontSize: '0.85rem' }}>
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleRefresh} style={{ width: '60px', height: '60px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '18px', color: 'var(--admin-primary)', cursor: 'pointer' }}>
              <svg className={isRefreshing ? 'spinning' : ''} width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
          </div>

          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
            .spinning { animation: spin 0.8s linear infinite; }
            .booking-index-table span { display: flex; align-items: center; }
            .booking-item-row { transition: 0.3s; border-radius: 14px; margin: 0 10px; border-bottom: 1px solid rgba(255,255,255,0.03); }
            .booking-item-row:hover { background: rgba(59, 130, 246, 0.05); transform: translateX(5px); }
            
            .page-btn {
              width: 40px;
              height: 40px;
              border-radius: 12px;
              background: rgba(255,255,255,0.03);
              border: 1px solid rgba(255,255,255,0.08);
              color: rgba(255,255,255,0.5);
              font-weight: 800;
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              display: grid;
              place-items: center;
            }
            .page-btn:hover {
              background: rgba(59, 130, 246, 0.1);
              border-color: rgba(59, 130, 246, 0.3);
              color: #fff;
              transform: translateY(-2px);
            }
            .page-btn.active {
              background: #3b82f6;
              border-color: #3b82f6;
              color: #fff;
              box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
            }
            .page-btn:disabled {
              opacity: 0.2;
              cursor: not-allowed;
              transform: none;
            }
          `}</style>

          <div className="booking-index-table" style={{ padding: '10px 0' }}>
            <div className="booking-index-head" style={{ 
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr 1fr 1fr 0.8fr',
              padding: '20px 30px', 
              margin: '0 10px',
              background: 'transparent', 
              opacity: 0.5, 
              fontWeight: '800', 
              fontSize: '0.7rem', 
              letterSpacing: '0.15em', 
              textTransform: 'uppercase' 
            }}>
              <span>Khách hàng</span>
              <span>Liên hệ</span>
              <span>Phương tiện</span>
              <span>Dịch vụ</span>
              <span>Thời gian</span>
              <span style={{ textAlign: 'right', paddingRight: '20px' }}>Thanh toán</span>
              <span style={{ textAlign: 'center' }}>Trạng thái</span>
            </div>

            {loading && !isRefreshing && <div style={{ padding: '100px', textAlign: 'center' }}><div className="spinner-heavy" style={{ margin: '0 auto' }}></div></div>}

            {!loading && paginatedBookings.map((b) => (
              <BookingRow key={b.id} b={b} onClick={setDetailBooking} />
            ))}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: '500' }}>
                Hiển thị <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{paginatedBookings.length}</strong> / {filteredBookings.length} bản ghi
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={() => setCurrentPage(c => Math.max(1, c-1))} 
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
                </button>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => setCurrentPage(i+1)} 
                      className={`page-btn ${currentPage === i+1 ? 'active' : ''}`}
                    >
                      {i+1}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setCurrentPage(c => Math.min(totalPages, c+1))} 
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          )}
        </article>
      </section>

      <BookingDetailModal 
        detailBooking={detailBooking}
        staffList={staffList}
        busyStaffIds={busyStaffIds}
        selectedStaffIds={selectedStaffIds}
        isAssigning={isAssigning}
        setSelectedStaffIds={setSelectedStaffIds}
        handleAssignStaff={handleAssignStaff}
        onClose={() => setDetailBooking(null)}
      />
    </>
  );
}

export default BookingManagement;
