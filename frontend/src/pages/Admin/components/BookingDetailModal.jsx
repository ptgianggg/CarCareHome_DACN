import React from 'react';

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function statusTone(status) {
  const val = String(status || "").toLowerCase();
  if (val.includes("pending") || val.includes("chờ")) return "pending";
  if (val.includes("done") || val.includes("complete") || val.includes("success") || val.includes("thành công")) return "success";
  if (val.includes("cancel") || val.includes("fail") || val.includes("reject") || val.includes("hủy")) return "warning";
  return "active";
}

const translateStatus = (st) => {
  const map = {
    "PENDING": "ĐANG CHỜ",
    "SUCCESS": "ĐÃ GIAO VIỆC",
    "IN_PROGRESS": "ĐANG THỰC HIỆN",
    "COMPLETED": "HOÀN TẤT",
    "CANCEL": "ĐÃ HỦY",
    "STAFF_REJECT": "NHÂN VIÊN TỪ CHỐI"
  };
  return map[st] || st;
};

const BookingDetailModal = ({ detailBooking, staffList, selectedStaffId, setSelectedStaffId, handleAssignStaff, onClose }) => {
  if (!detailBooking) return null;

  return (
    <div className="service-modal-backdrop" style={{ background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(15px)' }} onClick={onClose}>
      <article className="panel service-modal" style={{ maxWidth: '850px', width: '95%', padding: '0', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p className="eyebrow" style={{ color: '#3b82f6', fontWeight: '900' }}>HỒ SƠ LỊCH HẸN</p>
            <h3 style={{ fontSize: '2rem', fontWeight: '900', margin: '5px 0' }}>{detailBooking.customerName}</h3>
            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>ORD-ITEM-CODE: #{detailBooking.id}</span>
          </div>
          <button onClick={onClose} style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
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
              <p><strong>Trạng thái:</strong> <span className={`status ${statusTone(detailBooking.status)}`}>
                {translateStatus(detailBooking.status)}
              </span></p>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 40px 20px' }}>
          <p className="eyebrow">⚒️ PHÂN CÔNG NHÂN VIÊN</p>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '18px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <select 
              value={selectedStaffId || (detailBooking.assignedStaff?.id || "")} 
              onChange={(e) => setSelectedStaffId(e.target.value)}
              style={{ 
                flex: 1, height: '45px', background: 'rgba(0,0,0,0.4)', 
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', 
                color: '#fff', padding: '0 15px' 
              }}
            >
              <option value="">-- Chọn nhân viên --</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
              ))}
            </select>
            <button 
              onClick={handleAssignStaff}
              disabled={!selectedStaffId}
              className="staff-primary-btn" 
              style={{ height: '45px', padding: '0 20px', background: 'var(--admin-primary)', border: 'none', color: '#fff', borderRadius: '12px', cursor: 'pointer' }}
            >
              Gán việc
            </button>
          </div>
          {detailBooking.assignedStaff && (
            <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#4ade80' }}>
              ✓ Đã gán cho: <strong>{detailBooking.assignedStaff.name}</strong>
            </p>
          )}
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
          <button onClick={onClose} className="primary-button" style={{ padding: '15px 50px', borderRadius: '16px' }}>ĐÓNG HỒ SƠ</button>
        </div>
      </article>
    </div>
  );
};

export default BookingDetailModal;
