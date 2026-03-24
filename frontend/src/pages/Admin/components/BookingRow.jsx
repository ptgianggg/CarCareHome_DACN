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

const BookingRow = ({ b, onDoubleClick }) => {
  return (
    <div 
      className="booking-item-row" 
      onDoubleClick={() => onDoubleClick(b)}
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
          {b.status === "SUCCESS" ? "THÀNH CÔNG" : b.status === "CANCEL" ? "ĐÃ HỦY" : b.status}
        </span>
      </div>
    </div>
  );
};

export default BookingRow;
