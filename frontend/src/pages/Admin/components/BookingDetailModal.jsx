import React from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  Briefcase,
  CheckCircle2,
  Info,
  ChevronDown,
  Coins,
  Ticket
} from 'lucide-react';

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function statusTone(status) {
  const val = String(status || "").toLowerCase();
  if (val.includes("pending") || val.includes("chờ")) return "pending";
  if (val.includes("awaiting")) return "pending";
  if (val.includes("done") || val.includes("complete") || val.includes("success") || val.includes("thành công")) return "success";
  if (val.includes("cancel") || val.includes("fail") || val.includes("reject") || val.includes("hủy")) return "warning";
  return "active";
}

const translateStatus = (st) => {
  const map = {
    "WAITING_FOR_PAYMENT": "CHỜ THANH TOÁN CỌC",
    "PENDING": "CHỜ PHÂN CÔNG",
    "SUCCESS": "ĐÃ XÁC NHẬN",
    "IN_PROGRESS": "ĐANG THỰC HIỆN",
    "AWAITING_FINAL_PAYMENT": "CHỜ THANH TOÁN CUỐI",
    "COMPLETED": "HOÀN TẤT",
    "CANCEL": "ĐÃ HỦY",
    "CANCELLED": "ĐÃ HỦY",
    "STAFF_REJECT": "KTV TỪ CHỐI"
  };
  return map[st] || st;
};

const BookingDetailModal = ({ detailBooking, staffList, busyStaffIds = new Set(), selectedStaffIds = [], isAssigning, setSelectedStaffIds, handleAssignStaff, onClose }) => {
  const [isStaffOpen, setIsStaffOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsStaffOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync assigned staff from booking to selection list if none selected
  React.useEffect(() => {
    if (detailBooking && selectedStaffIds && selectedStaffIds.length === 0 && detailBooking.assignedStaffs?.length > 0) {
      setSelectedStaffIds(detailBooking.assignedStaffs.map(s => s.id));
    }
  }, [detailBooking]);

  if (!detailBooking) return null;

  const needsDeposit = (detailBooking.totalPrice || 0) > 500000;
  const hasPaid = detailBooking.paymentStatus === 'DEPOSITED' || detailBooking.paymentStatus === 'PAID_FULL';
  const isLocked = detailBooking.status === 'WAITING_FOR_PAYMENT' || (detailBooking.status === 'PENDING' && needsDeposit && !hasPaid);

  const toggleStaff = (id) => {
    setSelectedStaffIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  return (
    <div className="service-modal-backdrop" style={{ background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(25px)', zIndex: 1000, position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', padding: '20px' }} onClick={onClose}>
      <article className="panel service-modal" style={{ maxWidth: '900px', width: '100%', padding: '0', background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 50px 100px rgba(0,0,0,0.6)', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header Section */}
        <div style={{ padding: '35px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.01)', flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ padding: '6px 14px', borderRadius: '100px', background: 'rgba(59, 130, 246, 0.14)', color: '#3b82f6', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                Hồ sơ lịch hẹn số #{detailBooking.id}
              </span>
              <span className={`status ${statusTone(detailBooking.status)}`} style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: '900' }}>
                {translateStatus(detailBooking.status)}
              </span>
            </div>
            <h3 style={{ fontSize: '2.2rem', fontWeight: '900', margin: '0', letterSpacing: '-0.02em', color: '#fff' }}>{detailBooking.customerName}</h3>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '5px' }}>
              <p style={{ fontSize: '0.8rem', opacity: 0.4, margin: 0, fontFamily: 'monospace' }}>UUID: #{detailBooking.id || "N/A"}</p>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></span>
              <p style={{ fontSize: '0.8rem', opacity: 0.4, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} /> Tạo đơn: {detailBooking.createdAt ? new Date(detailBooking.createdAt).toLocaleString('vi-VN') : "N/A"}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-content" style={{ overflowY: 'auto', padding: '0 40px', flex: 1 }}>
          {/* Main Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', margin: '40px 0' }}>
            
            <section>
              <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'rgba(255,255,255,0.3)', marginBottom: '20px', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={14}/> THÔNG TIN KHÁCH HÀNG</h4>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.1)', display: 'grid', placeItems: 'center', color: '#3b82f6' }}><Phone size={20} /></div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.4, marginBottom: '2px' }}>ĐIỆN THOẠI</label>
                    <strong style={{ fontSize: '1.1rem' }}>{detailBooking.customerPhone}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', display: 'grid', placeItems: 'center', color: '#3b82f6' }}><Mail size={20} /></div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.4, marginBottom: '2px' }}>EMAIL LIÊN HỆ</label>
                    <strong style={{ fontSize: '1.1rem' }}>{detailBooking.customerEmail || "N/A"}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', display: 'grid', placeItems: 'center', color: '#10b981', flexShrink: 0 }}><MapPin size={20} /></div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.4, marginBottom: '2px' }}>ĐỊA CHỈ PHỤC VỤ</label>
                    <strong style={{ fontSize: '1rem', lineHeight: '1.5', display: 'block' }}>{detailBooking.addressName}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'rgba(255,255,255,0.3)', marginBottom: '20px', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={14}/> CHI TIẾT LỊCH TRÌNH</h4>
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar size={18} color="#3b82f6" />
                    <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{detailBooking.bookingDate}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={18} color="#3b82f6" />
                    <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{detailBooking.bookingTime}</span>
                  </div>
                </div>
                <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.4, marginBottom: '8px' }}>BIỂN SỐ XE PHỤC VỤ</label>
                  <strong style={{ fontSize: '1.6rem', color: '#fff', letterSpacing: '1px' }}>{detailBooking.vehiclePlate || "N/A"}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <ShieldCheck size={14} color="#10b981" />
                    <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{detailBooking.vehicleType}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Service & Staff Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px', marginBottom: '10px' }}>
             <section>
                <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'rgba(255,255,255,0.3)', marginBottom: '20px', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}><Info size={14}/> DỊCH VỤ THI CÔNG</h4>
                <div style={{ padding: '25px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#fff', lineHeight: '1.6' }}>
                    {detailBooking.serviceType}
                  </p>
                </div>
             </section>

             <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'rgba(255,255,255,0.3)', margin: 0, letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}><Briefcase size={14}/> PHÂN CÔNG CHUÊN VIÊN</h4>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ position: 'relative', flex: 1 }} ref={dropdownRef}>
                    <div 
                      onClick={() => (!isLocked && !isAssigning) && setIsStaffOpen(!isStaffOpen)}
                      style={{ 
                        width: '100%', height: '56px', 
                        background: isLocked ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', 
                        color: isLocked ? 'rgba(255,255,255,0.2)' : (selectedStaffIds.length > 0 ? '#fff' : 'rgba(255,255,255,0.3)'), 
                        padding: '0 20px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: isLocked ? 'not-allowed' : 'pointer', 
                        fontSize: '0.95rem', fontWeight: selectedStaffIds.length > 0 ? '700' : '500'
                      }}
                    >
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
                        {selectedStaffIds.length > 0 ? `Đã chọn ${selectedStaffIds.length} chuyên viên` : "-- Chọn chuyên viên --"}
                      </span>
                      <ChevronDown size={18} style={{ transform: isStaffOpen ? 'rotate(180deg)' : 'none', transition: '0.3s', opacity: 0.5 }} />
                    </div>

                    {isStaffOpen && (
                      <div style={{ 
                        position: 'absolute', bottom: '65px', left: 0, right: 0, 
                        background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', 
                        borderRadius: '20px', padding: '8px', zIndex: 110,
                        boxShadow: '0 -20px 40px rgba(0,0,0,0.4)', maxHeight: '240px', overflowY: 'auto'
                      }}>
                        {staffList.map(s => {
                          const isAlreadyAssigned = detailBooking.assignedStaffs?.some(as => as.id === s.id);
                          const isBusy = busyStaffIds.has(s.id) && !isAlreadyAssigned;
                          const isSelected = selectedStaffIds.includes(s.id);
                          return (
                            <div 
                              key={s.id}
                              onClick={() => { if(!isBusy) toggleStaff(s.id); }}
                              style={{ 
                                padding: '12px 16px', borderRadius: '12px', 
                                cursor: isBusy ? 'not-allowed' : 'pointer',
                                background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                color: isBusy ? 'rgba(239, 68, 68, 0.6)' : isSelected ? '#3b82f6' : '#fff',
                                marginBottom: '4px',
                                transition: '0.2s',
                                fontWeight: '700',
                                opacity: isBusy ? 0.5 : 1,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {isSelected && <CheckCircle2 size={16} />}
                                <div>
                                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{s.name}</p>
                                  <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={8}/> {s.phone || "N/A"}</p>
                                </div>
                              </div>
                              {isBusy && <span style={{ fontSize: '0.7rem', fontWeight: '900', background: 'rgba(239, 68, 68, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>BẬN</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleAssignStaff}
                    disabled={selectedStaffIds.length === 0 || isLocked || isAssigning}
                    style={{ 
                      height: '56px', padding: '0 30px', 
                      background: isLocked || selectedStaffIds.length === 0 || isAssigning ? 'rgba(255,255,255,0.05)' : '#3b82f6', 
                      color: isLocked || selectedStaffIds.length === 0 || isAssigning ? 'rgba(255,255,255,0.2)' : '#fff', 
                      borderRadius: '18px', cursor: isLocked || selectedStaffIds.length === 0 || isAssigning ? 'not-allowed' : 'pointer', fontWeight: '900', border: 'none',
                      transition: '0.3s', boxShadow: isLocked || selectedStaffIds.length === 0 || isAssigning ? 'none' : '0 10px 20px rgba(59, 130, 246, 0.2)'
                    }}
                  >
                    {isAssigning ? "ĐANG LƯU..." : "XÁC NHẬN"}
                  </button>
                </div>
                {isLocked && (
                  <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                    <Info size={14}/> Vui lòng hoàn tất đặt cọc trước khi giao việc
                  </p>
                )}
             </section>
          </div>

          <div style={{ marginBottom: '40px' }}>
             {detailBooking.assignedStaffs && detailBooking.assignedStaffs.length > 0 && detailBooking.status !== 'PENDING' && (
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                 {detailBooking.assignedStaffs.map(as => (
                   <div key={as.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 20px', borderRadius: '18px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                     {as.avatar ? (
                       <img src={as.avatar} alt={as.name} style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} />
                     ) : (
                       <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#10b981', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '1rem', fontWeight: '900' }}>
                         {as.name.charAt(0)}
                       </div>
                     )}
                     <div>
                         <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>{as.name}</p>
                         <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={10}/> {as.phone || "N/A"}</p>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>

          {/* Payment Section */}
          <section style={{ marginBottom: '40px' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'rgba(255,255,255,0.3)', marginBottom: '20px', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={14}/> QUẢN LÝ TÀI CHÍNH</h4>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(2, 6, 23, 0) 100%)', 
              padding: '40px', borderRadius: '32px', border: '1px solid rgba(59, 130, 246, 0.2)',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.95rem', opacity: 0.5 }}>Chi phí dịch vụ gốc:</span>
                  <strong style={{ fontSize: '1.05rem' }}>{formatPrice((detailBooking.totalPrice || 0) + (detailBooking.discountAmount || 0) - (detailBooking.travelFee || 0))}</strong>
                </div>
                {detailBooking.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', color: '#4ade80' }}>
                    <span style={{ fontSize: '0.95rem', opacity: 1, display: 'flex', alignItems: 'center', gap: '8px' }}><Ticket size={14}/> Voucher ({detailBooking.voucherCode}):</span>
                    <strong style={{ fontSize: '1.05rem' }}>-{formatPrice(detailBooking.discountAmount)}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.95rem', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={14}/> Phí di chuyển ({detailBooking.distance || 0} km):</span>
                  <strong style={{ fontSize: '1.05rem' }}>{detailBooking.travelFee === 0 && (detailBooking.distance || 0) > 0 ? <span style={{ color: '#10b981', marginRight: '8px' }}>MIỄN PHÍ</span> : ""}{formatPrice(detailBooking.travelFee)}</strong>
                </div>
                <div style={{ margin: '20px 0', height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1rem', fontWeight: '800', opacity: 0.6, letterSpacing: '1px' }}>TỔNG CỘNG:</span>
                  <span style={{ fontSize: '2rem', fontWeight: '900', color: '#3b82f6', letterSpacing: '-1.5px' }}>{formatPrice(detailBooking.totalPrice)}</span>
                </div>
                {/* Loyalty points row */}
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(251, 191, 36, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Coins size={14} /> {detailBooking.status === "COMPLETED" ? "ĐIỂM ĐÃ NHẬN:" : "ĐIỂM DỰ KIẾN:"}
                  </span>
                  <strong style={{ fontSize: '1.2rem', color: '#fbbf24', fontWeight: '900' }}>
                    +{detailBooking.pointsEarned || Math.floor(((detailBooking.totalPrice || 0) - (detailBooking.travelFee || 0)) / 10000)} PTS
                  </strong>
                </div>
              </div>

              <div style={{ paddingLeft: '40px', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={16} color="#10b981"/> Số tiền khách đã cọc: </span>
                      <strong style={{ color: '#10b981', fontSize: '1.3rem', fontWeight: '900' }}>{formatPrice(detailBooking.depositAmount)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={16} color="#fbbf24"/> Khoản thu còn lại:</span>
                      <strong style={{ color: '#fbbf24', fontSize: '1.3rem', fontWeight: '900' }}>
                        {formatPrice(detailBooking.paymentStatus === 'PAID_FULL' ? 0 : (detailBooking.totalPrice || 0) - (detailBooking.depositAmount || 0))}
                      </strong>
                    </div>
                    <div style={{ marginTop: '5px', padding: '15px 20px', borderRadius: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '900', opacity: 0.3, letterSpacing: '1px' }}>TRẠNG THÁI</span>
                      <span className={`status ${detailBooking.paymentStatus === 'PAID_FULL' ? 'success' : 'pending'}`} style={{ padding: '6px 18px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '900' }}>
                        {detailBooking.paymentStatus === 'PAID_FULL' ? 'ĐÃ TẤT TOÁN' : detailBooking.paymentStatus === 'DEPOSITED' ? 'ĐÃ CỌC' : 'CHƯA HOÀN TẤT'}
                      </span>
                    </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '30px 40px', background: 'rgba(0,0,0,0.3)', textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button 
            onClick={onClose} 
            className="primary-button" 
            style={{ padding: '18px 65px', borderRadius: '20px', fontSize: '1rem', fontWeight: '900', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none', color: '#fff', cursor: 'pointer', transition: '0.3s', boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)' }}
          >
            ĐÓNG HỒ SƠ
          </button>
        </div>
      </article>
    </div>
  );
};

export default BookingDetailModal;
