import React from 'react';

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
    "PENDING": "CHỜ THANH TOÁN CỌC",
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

const BookingRow = ({ b, onClick }) => {
  return (
    <div 
      className="booking-item-row" 
      onClick={() => onClick(b)}
      style={{ 
        display: 'grid', 
        gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr 1fr 1fr 0.8fr', 
        padding: '20px 30px', 
        cursor: 'pointer', 
        alignItems: 'center' 
      }}
    >
      <div>
        <p style={{ fontWeight: '900', margin: 0, fontSize: '1.05rem', color: '#fff' }}>{b.customerName}</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', opacity: 0.35 }}>
          <small style={{ fontSize: '0.65rem', fontWeight: '800' }}>#{b.id}</small>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor' }}></span>
          <small style={{ fontSize: '0.65rem' }}>{b.createdAt ? new Date(b.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : "N/A"}</small>
        </div>
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
      <span style={{ 
        fontWeight: '900', 
        color: '#3b82f6', 
        fontSize: '1.2rem', 
        textAlign: 'right',
        paddingRight: '20px'
      }}>{formatPrice(b.totalPrice)}</span>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span className={`status ${statusTone(b.status)}`} style={{ padding: '8px 16px', borderRadius: '12px', fontWeight: '900', fontSize: '0.7rem' }}>
          {translateStatus(b.status)}
        </span>
      </div>
    </div>
  );
};

export default BookingRow;
