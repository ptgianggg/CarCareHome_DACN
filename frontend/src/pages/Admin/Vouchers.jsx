import { useEffect, useState, useMemo, useRef } from "react";
import {
    getAllVouchers,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    toggleVoucherStatus
} from "../../services/api";
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Edit3, 
  RotateCw, 
  Search, 
  CheckCircle, 
  PauseCircle,
  Coins,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Target,
  Gift,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import "./style.css";

const ITEMS_PER_PAGE = 8;
const TIER_OPTIONS = ["ALL", "BRONZE", "SILVER", "GOLD", "VIP"];
const TYPE_OPTIONS = [
  { value: "CASH", label: "Tiền mặt (VNĐ)" },
  { value: "PERCENT", label: "Phần trăm (%)" },
  { value: "SERVICE", label: "Miễn phí dịch vụ" }
];

const emptyForm = {
    code: "",
    title: "",
    description: "",
    pointsRequired: 0,
    discountType: "CASH",
    discountValue: 0,
    minOrderValue: 0,
    targetTier: "ALL",
    status: "ACTIVE",
    startDate: "",
    endDate: ""
};

const CustomDropdown = ({ value, options, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = value === "ALL" ? "Tất cả hạng" : value;

  return (
    <div className="custom-premium-dropdown" ref={dropdownRef} style={{ width: '200px', position: 'relative', zIndex: 100 }}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ 
          height: '60px', 
          background: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid rgba(59, 130, 246, 0.3)', 
          borderRadius: '18px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 20px', 
          cursor: 'pointer',
          transition: '0.3s'
        }}
      >
        <span style={{ color: '#fff', fontWeight: '800', fontSize: '0.9rem' }}>{selectedLabel}</span>
        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.3s', opacity: 0.5 }} />
      </div>
      
      {isOpen && (
        <div style={{ position: 'absolute', top: '70px', left: 0, right: 0, background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s ease' }}>
          {options.map((opt) => (
            <div 
              key={opt} 
              onClick={() => { onChange(opt); setIsOpen(false); }} 
              style={{ 
                padding: '12px 14px', 
                borderRadius: '12px', 
                cursor: 'pointer', 
                fontWeight: '700', 
                color: value === opt ? '#3b82f6' : '#94a3b8', 
                background: value === opt ? 'rgba(59, 130, 246, 0.1)' : 'transparent', 
                fontSize: '0.85rem',
                transition: '0.2s'
              }}
              onMouseEnter={(e) => { if(value !== opt) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { if(value !== opt) e.currentTarget.style.background = 'transparent'; }}
            >
              {opt === "ALL" ? "Tất cả hạng" : opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function VoucherManagement() {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterTier, setFilterTier] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL");

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const data = await getAllVouchers();
            setVouchers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Fetch vouchers error:", error);
            setVouchers([]);
        } finally {
            setLoading(false);
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchData();
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const filteredVouchers = useMemo(() => {
        return vouchers.filter(v => {
            const matchesSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 v.code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTier = filterTier === "ALL" || v.targetTier === filterTier;
            const matchesStatus = filterStatus === "ALL" || v.status === filterStatus;
            return matchesSearch && matchesTier && matchesStatus;
        });
    }, [vouchers, searchTerm, filterTier, filterStatus]);

    const paginatedVouchers = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredVouchers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredVouchers, currentPage]);

    const totalPages = Math.ceil(filteredVouchers.length / ITEMS_PER_PAGE);

    const stats = useMemo(() => ({
        total: vouchers.length,
        active: vouchers.filter(v => v.status === "ACTIVE").length,
        mostExpensive: vouchers.length > 0 ? Math.max(...vouchers.map(v => v.pointsRequired)) : 0,
        vipOnly: vouchers.filter(v => v.targetTier === "VIP").length
    }), [vouchers]);

    async function onSubmit(e) {
        e.preventDefault();
        try {
            const now = new Date();
            now.setHours(0, 0, 0, 0); // Reset time for date-only comparison

            if (form.startDate) {
                const sDate = new Date(form.startDate);
                if (sDate < now && !editingId) { // Only check for new vouchers
                    alert("Ngày bắt đầu không được trong quá khứ!");
                    return;
                }
            }

            if (form.startDate && form.endDate) {
                if (new Date(form.endDate) < new Date(form.startDate)) {
                    alert("Ngày kết thúc phải sau ngày bắt đầu!");
                    return;
                }
            }

            // Chuẩn hóa dữ liệu trước khi gửi để tránh lỗi 400 (Bad Request)
            const finalForm = { ...form };
            
            // Đảm bảo các trường do Server quản lý không bị gán chuỗi rỗng gây lỗi parsing
            if (!finalForm.createdAt) delete finalForm.createdAt;
            if (!finalForm.updatedAt) delete finalForm.updatedAt;

            // Đảm bảo ID trong Body khớp với ID trên URL (Tránh lỗi 400 từ một số cấu hình Server)
            if (editingId) finalForm.id = editingId;

            // Chuyển đổi và kiểm tra giá trị số
            finalForm.pointsRequired = Number(finalForm.pointsRequired) || 0;
            finalForm.discountValue = Number(finalForm.discountValue) || 0;
            finalForm.minOrderValue = Number(finalForm.minOrderValue) || 0;

            // Chuẩn hóa định dạng ngày để khớp với LocalDateTime của Backend (ISO-8601)
            if (finalForm.startDate && !finalForm.startDate.includes('T')) {
                finalForm.startDate = `${finalForm.startDate}T00:00:00`;
            } else if (!finalForm.startDate) {
                finalForm.startDate = null; // Tránh gửi chuỗi rỗng "" vào kiểu LocalDateTime
            }

            if (finalForm.endDate && !finalForm.endDate.includes('T')) {
                finalForm.endDate = `${finalForm.endDate}T23:59:59`;
            } else if (!finalForm.endDate) {
                finalForm.endDate = null;
            }

            if (editingId) {
                await updateVoucher(editingId, finalForm);
            } else {
                await createVoucher(finalForm);
            }
            await fetchData();
            setIsFormOpen(false);
            setForm(emptyForm);
            setEditingId(null);
        } catch (error) {
            console.error("Save voucher error:", error);
            alert("Không thể lưu voucher. Lỗi: " + (error.message || "400 Bad Request"));
        }
    }

    function onEdit(v) {
        setEditingId(v.id);
        setForm(v);
        setIsFormOpen(true);
    }

    async function onDelete(id) {
        if (!window.confirm("Bạn có chắc chắn muốn xóa voucher này?")) return;
        try {
            await deleteVoucher(id);
            fetchData();
        } catch (error) {
            console.error("Delete error:", error);
        }
    }

    async function onToggle(id) {
        try {
            await toggleVoucherStatus(id);
            fetchData();
        } catch (error) {
            console.error("Toggle error:", error);
        }
    }

    const getTierColor = (tier) => {
      switch(tier) {
        case 'VIP': return 'linear-gradient(135deg, #f59e0b, #ef4444)';
        case 'GOLD': return 'linear-gradient(135deg, #fbbf24, #f59e0b)';
        case 'SILVER': return 'linear-gradient(135deg, #94a3b8, #64748b)';
        case 'BRONZE': return 'linear-gradient(135deg, #b45309, #78350f)';
        default: return 'rgba(255,255,255,0.05)';
      }
    };

    return (
        <div className="voucher-mgmt-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header className="topbar">
                <div className="topbar-left">
                    <p className="eyebrow" style={{ color: "var(--admin-primary)", display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Gift size={14} /> LOYALTY PROGRAM
                    </p>
                    <h2 style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.04em', margin: '8px 0' }}>
                      Quản lý Voucher
                    </h2>
                   
                </div>
            </header>

            <section className="stats-grid" style={{ marginBottom: '40px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card premium-card" style={{ display: 'flex', alignItems: 'center', padding: '24px' }}>
                    <div className="stat-icon-wrapper blue">
                      <Ticket size={24} />
                    </div>
                    <div className="stat-info">
                      <p className="eyebrow">TỔNG VOUCHER</p>
                      <strong>{stats.total}</strong>
                      <span className="stat-meta">Trong hệ thống</span>
                    </div>
                </div>
                <div className="stat-card premium-card" style={{ display: 'flex', alignItems: 'center', padding: '24px' }}>
                    <div className="stat-icon-wrapper green">
                      <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                      <p className="eyebrow">ĐANG HOẠT ĐỘNG</p>
                      <strong style={{ color: 'var(--admin-success)' }}>{stats.active}</strong>
                      <span className="stat-meta">Sẵn sàng quy đổi</span>
                    </div>
                </div>
                <div className="stat-card premium-card" style={{ display: 'flex', alignItems: 'center', padding: '24px' }}>
                    <div className="stat-icon-wrapper yellow">
                      <Coins size={24} />
                    </div>
                    <div className="stat-info">
                      <p className="eyebrow">ĐIỂM CAO NHẤT</p>
                      <strong style={{ color: '#fbbf24' }}>{stats.mostExpensive}</strong>
                      <span className="stat-meta">Yêu cầu hội viên</span>
                    </div>
                </div>
                <div className="stat-card premium-card" style={{ display: 'flex', alignItems: 'center', padding: '24px' }}>
                    <div className="stat-icon-wrapper red">
                      <Target size={24} />
                    </div>
                    <div className="stat-info">
                      <p className="eyebrow">DÀNH RIÊNG VIP</p>
                      <strong style={{ color: '#ef4444' }}>{stats.vipOnly}</strong>
                      <span className="stat-meta">Ưu đãi hạng cao</span>
                    </div>
                </div>
            </section>

            <section className="panel glass-morphism" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '32px', overflow: 'hidden' }}>
                <div className="panel-heading" style={{ padding: '32px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}>
                    <div className="filter-controls" style={{ display: 'flex', gap: '20px', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
                        <div className="search-wrapper" style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                            <Search size={20} className="search-icon-fixed" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                            <input
                                type="text"
                                placeholder="Tìm theo tên voucher hoặc mã code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="premium-input-search"
                                style={{ width: '100%', height: '60px', paddingLeft: '55px', borderRadius: '18px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.95rem' }}
                            />
                        </div>
                        
                        <div className="tier-filter-box" style={{ position: 'relative' }}>
                          <CustomDropdown 
                            value={filterTier} 
                            options={TIER_OPTIONS} 
                            onChange={setFilterTier} 
                            placeholder="Chọn hạng"
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={handleRefresh} className="icon-action-btn" style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <RotateCw className={isRefreshing ? 'spinning' : ''} size={22} />
                            </button>
                            <button onClick={() => { setForm(emptyForm); setEditingId(null); setIsFormOpen(true); }} className="primary-button add-voucher-btn" style={{ height: '60px', padding: '0 30px', borderRadius: '18px', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                              <Plus size={20} strokeWidth={3} style={{ marginRight: '8px' }} /> THÊM VOUCHER
                            </button>
                        </div>
                    </div>
                </div>

                <div className="table-responsive" style={{ padding: '0 20px' }}>
                    <table className="voucher-data-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', opacity: 0.4, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800' }}>
                                <th style={{ padding: '0 25px' }}>Voucher</th>
                                <th>Ưu đãi</th>
                                <th>Hiệu lực</th>
                                <th>Chi phí</th>
                                <th>Đối tượng</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: 'right', paddingRight: '25px' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && paginatedVouchers.map(v => (
                                <tr key={v.id} className="voucher-row-item" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', transition: '0.3s' }}>
                                    <td style={{ padding: '20px 25px', borderRadius: '20px 0 0 20px' }}>
                                        <div style={{ fontWeight: '800', color: '#fff', fontSize: '1.1rem', marginBottom: '6px' }}>{v.title}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <code style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.5px' }}>{v.code}</code>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                          <span style={{ fontWeight: '900', color: '#fff', fontSize: '1.2rem' }}>
                                            {v.discountType === 'PERCENT' ? `${v.discountValue}%` : `${Number(v.discountValue).toLocaleString()}đ`}
                                          </span>
                                          <span style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', fontWeight: '700' }}>{v.discountType === 'CASH' ? 'Giảm trực tiếp' : v.discountType === 'PERCENT' ? 'Giảm theo %' : 'Dịch vụ miễn phí'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                                            <Clock size={12} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>
                                              {v.startDate ? new Date(v.startDate).toLocaleDateString() : 'Bất kì'}
                                            </span>
                                            <span style={{ opacity: 0.3 }}>→</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>
                                              {v.endDate ? new Date(v.endDate).toLocaleDateString() : 'Bất kì'}
                                            </span>
                                          </div>
                                          {(() => {
                                            const now = new Date();
                                            const s = v.startDate ? new Date(v.startDate) : null;
                                            const e = v.endDate ? new Date(v.endDate) : null;
                                            if (e && now > e) return <span style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: '900', textTransform: 'uppercase' }}>● Đã hết hạn</span>;
                                            if (s && now < s) return <span style={{ fontSize: '0.6rem', color: '#3b82f6', fontWeight: '900', textTransform: 'uppercase' }}>● Chưa bắt đầu</span>;
                                            return <span style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: '900', textTransform: 'uppercase' }}>● Đang diễn ra</span>;
                                          })()}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(251, 191, 36, 0.1)', padding: '8px 14px', borderRadius: '12px' }}>
                                          <Coins size={16} color="#fbbf24" />
                                          <strong style={{ color: '#fbbf24', fontSize: '1.1rem' }}>{v.pointsRequired}</strong>
                                          <span style={{ fontSize: '0.7rem', color: '#fbbf24', opacity: 0.7, fontWeight: '700' }}>PTS</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ 
                                          fontSize: '0.75rem', 
                                          fontWeight: '900', 
                                          padding: '6px 14px', 
                                          borderRadius: '10px',
                                          background: getTierColor(v.targetTier),
                                          color: v.targetTier === 'BRONZE' ? '#fff' : v.targetTier === 'ALL' ? '#94a3b8' : '#fff',
                                          boxShadow: v.targetTier === 'VIP' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none',
                                          display: 'inline-block'
                                        }}>
                                          {v.targetTier}
                                        </span>
                                    </td>
                                    <td>
                                        <div 
                                          onClick={() => onToggle(v.id)}
                                          className={`status-pill ${v.status === 'ACTIVE' ? 'active' : 'paused'}`}
                                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content', padding: '8px 16px', borderRadius: '12px', background: v.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: v.status === 'ACTIVE' ? '#10b981' : '#f59e0b' }}
                                        >
                                          {v.status === 'ACTIVE' ? <CheckCircle size={14} /> : <PauseCircle size={14} />}
                                          <span style={{ fontWeight: '900', fontSize: '0.7rem', textTransform: 'uppercase' }}>{v.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 25px', borderRadius: '0 20px 20px 0', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                          <button onClick={() => onEdit(v)} style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Chỉnh sửa"><Edit3 size={20} /></button>
                                          <button onClick={() => onDelete(v.id)} style={{ width: '44px', height: '44px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '14px', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Xóa"><Trash2 size={20} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {!loading && filteredVouchers.length === 0 && (
                      <div className="empty-voucher-state" style={{ padding: '100px 0', textAlign: 'center' }}>
                        <div style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
                          <Gift size={48} opacity={0.2} />
                        </div>
                        <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '8px' }}>Không tìm thấy voucher</h3>
                        <p style={{ color: 'var(--admin-text-muted)' }}>Hãy thử thay đổi từ khóa tìm kiếm hoặc lọc theo hạng khác</p>
                      </div>
                    )}
                </div>

                <footer className="panel-footer" style={{ padding: '32px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
                      Đang xem <strong style={{ color: '#fff' }}>{paginatedVouchers.length}</strong> trên tổng số <strong style={{ color: 'var(--admin-primary)' }}>{filteredVouchers.length}</strong> voucher
                    </div>
                    {totalPages > 1 && (
                      <div className="pagination-system" style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                            className="pagine-nav-btn"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => (
                              <button 
                                key={i} 
                                onClick={() => setCurrentPage(i + 1)} 
                                className={`pagine-num-btn ${currentPage === i + 1 ? 'active' : ''}`}
                              >
                                {i + 1}
                              </button>
                          ))}
                          <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                            className="pagine-nav-btn"
                          >
                            <ChevronRight size={18} />
                          </button>
                      </div>
                    )}
                </footer>
            </section>

            {isFormOpen && (
                <div className="admin-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(15px)', zIndex: 3000, display: 'grid', placeItems: 'center', padding: '30px' }} onClick={() => setIsFormOpen(false)}>
                    <div className="admin-modal-box glass-morphism" style={{ maxWidth: '750px', width: '100%', borderRadius: '32px', overflow: 'hidden', animation: 'modalEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>
                        <header style={{ padding: '40px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <p className="eyebrow" style={{ color: 'var(--admin-primary)' }}>{editingId ? 'CẬP NHẬT THÔNG TIN' : 'CẤU HÌNH MỚI'}</p>
                              <h3 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '4px 0' }}>{editingId ? 'Chỉnh sửa Voucher' : 'Tạo Voucher Đổi Điểm'}</h3>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: '44px', height: '44px', borderRadius: '14px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                <AlertCircle size={22} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        </header>

                        <form onSubmit={onSubmit} style={{ padding: '40px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                              <div className="input-group">
                                <label className="premium-label">MÃ CODE HIỂN THỊ <small style={{ opacity: 0.5 }}>(Tự động nếu để trống)</small></label>
                                <input className="premium-field" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="VD: SALEOFF50" />
                              </div>
                              <div className="input-group">
                                <label className="premium-label">TIÊU ĐỀ VOUCHER</label>
                                <input className="premium-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="VD: Giảm 50k dịch vụ rửa xe" required />
                              </div>
                            </div>
                            
                            <div className="input-group" style={{ marginBottom: '24px' }}>
                                <label className="premium-label">MÔ TẢ CHI TIẾT ƯU ĐÃI</label>
                                <textarea className="premium-field" style={{ height: '100px', padding: '15px 20px', resize: 'none' }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Nhập chi tiết điều kiện áp dụng..." />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                              <div className="input-group">
                                <label className="premium-label">HẠNG THÀNH VIÊN ÁP DỤNG</label>
                                <div style={{ position: 'relative' }}>
                                  <ChevronDown size={16} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                  <select className="premium-field" style={{ appearance: 'none' }} value={form.targetTier} onChange={e => setForm({...form, targetTier: e.target.value})}>
                                    {TIER_OPTIONS.map(o => <option key={o} value={o}>{o === 'ALL' ? 'Tất cả (Mặc định)' : o}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div className="input-group">
                                <label className="premium-label">SỐ ĐIỂM CẦN ĐỔI</label>
                                <div style={{ position: 'relative' }}>
                                  <Coins size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#fbbf24' }} />
                                  <input type="number" className="premium-field" style={{ paddingLeft: '45px' }} value={form.pointsRequired} onChange={e => setForm({...form, pointsRequired: e.target.value})} required />
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', marginBottom: '32px' }}>
                              <div className="input-group">
                                <label className="premium-label">LOẠI GIẢM GIÁ</label>
                                <select className="premium-field" value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})}>
                                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                              </div>
                              <div className="input-group">
                                <label className="premium-label">GIÁ TRỊ QUY ĐỔI ({form.discountType === 'PERCENT' ? '%' : 'VNĐ'})</label>
                                <input type="number" className="premium-field" value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} required />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                              <div className="input-group">
                                <label className="premium-label">NGÀY BẮT ĐẦU (TỪ 00:00)</label>
                                <div style={{ position: 'relative' }}>
                                  <Clock size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                  <input type="date" className="premium-field" style={{ paddingLeft: '45px' }} value={form.startDate ? form.startDate.split('T')[0] : ""} onChange={e => setForm({...form, startDate: e.target.value})} />
                                </div>
                              </div>
                              <div className="input-group">
                                <label className="premium-label">NGÀY KẾT THÚC (ĐẾN 23:59)</label>
                                <div style={{ position: 'relative' }}>
                                  <Clock size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                  <input type="date" className="premium-field" style={{ paddingLeft: '45px' }} value={form.endDate ? form.endDate.split('T')[0] : ""} onChange={e => setForm({...form, endDate: e.target.value})} />
                                </div>
                              </div>
                            </div>

                            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '20px 25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ fontWeight: '900', fontSize: '0.9rem', color: '#fff' }}>TRẠNG THÁI KÍCH HOẠT</span>
                                  
                                </div>
                                <div 
                                  onClick={() => setForm(p => ({ ...p, status: p.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }))} 
                                  style={{ 
                                    width: '60px', 
                                    height: '32px', 
                                    background: form.status === 'ACTIVE' ? 'var(--admin-success)' : 'rgba(255,255,255,0.1)', 
                                    borderRadius: '16px', 
                                    position: 'relative', 
                                    cursor: 'pointer', 
                                    padding: '4px', 
                                    transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                    boxShadow: form.status === 'ACTIVE' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                                  }}
                                >
                                    <div style={{ 
                                      width: '24px', 
                                      height: '24px', 
                                      background: '#fff', 
                                      borderRadius: '50%', 
                                      transform: form.status === 'ACTIVE' ? 'translateX(28px)' : 'none', 
                                      transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
                                    }}></div>
                                </div>
                            </div>

                            <div className="modal-footer-actions" style={{ display: 'flex', gap: '16px' }}>
                                <button type="submit" className="primary-button full-btn" style={{ flex: 1, height: '64px', fontSize: '1.1rem' }}>XÁC NHẬN LƯU VOUCHER</button>
                                <button type="button" onClick={() => setIsFormOpen(false)} className="ghost-button" style={{ height: '64px', padding: '0 40px' }}>HỦY BỎ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .voucher-data-table th, .voucher-data-table td { vertical-align: middle; }
                .stat-icon-wrapper { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-right: 20px; flex-shrink: 0; }
                .stat-icon-wrapper.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
                .stat-icon-wrapper.green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
                .stat-icon-wrapper.yellow { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
                .stat-icon-wrapper.red { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
                
                .stat-card.premium-card { display: flex; align-items: center; padding: 28px; transition: 0.3s; }
                .stat-card.premium-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.3); }
                .stat-meta { font-size: 0.8rem; color: var(--admin-text-muted); font-weight: 500; }
                
                .voucher-row-item:hover { background: rgba(255,255,255,0.06) !important; transform: scale(1.005); }
                
                .action-circle-btn { width: 44px; height: 44px; border-radius: 50%; border: none; background: rgba(255,255,255,0.04); color: var(--admin-text-soft); display: grid; placeItems: center; cursor: pointer; transition: 0.3s; }
                .action-circle-btn.edit:hover { background: var(--admin-primary); color: #fff; box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4); }
                .action-circle-btn.delete:hover { background: var(--admin-danger); color: #fff; box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4); }
                
                .pagine-nav-btn, .pagine-num-btn { width: 44px; height: 44px; borderRadius: 12px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #fff; cursor: pointer; display: grid; placeItems: center; transition: 0.3s; font-weight: 800; }
                .pagine-num-btn.active { background: var(--admin-primary); border-color: var(--admin-primary); box-shadow: 0 0 15px rgba(59, 130, 246, 0.3); }
                .pagine-nav-btn:disabled { opacity: 0.2; cursor: not-allowed; }
                .pagine-nav-btn:hover:not(:disabled), .pagine-num-btn:hover:not(.active) { background: rgba(255,255,255,0.1); }

                .premium-label { display: block; font-size: 0.75rem; font-weight: 900; color: #94a3b8; margin-bottom: 10px; letter-spacing: 1px; text-transform: uppercase; }
                .premium-field { width: 100%; height: 56px; background: rgba(0,0,0,0.4); border: 2px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 0 20px; color: #fff; font-size: 1rem; outline: none; transition: 0.3s; }
                .premium-field:focus { border-color: var(--admin-primary); background: rgba(0,0,0,0.6); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
                .premium-field option { background: #0f172a; color: #fff; }

                @keyframes modalEntry { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}

export default VoucherManagement;
