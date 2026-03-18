import { useEffect, useState } from "react";
import { getBookings } from "../../services/api";
import "./style.css";

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} d`;
}

function formatDateTime(dateValue, timeValue) {
  if (!dateValue && !timeValue) return "-";
  const date = dateValue || "";
  const time = timeValue || "";
  return `${date} ${time}`.trim();
}

function statusTone(status) {
  const val = String(status || "").toLowerCase();
  if (val.includes("pending") || val.includes("cho")) return "pending";
  if (val.includes("done") || val.includes("complete") || val.includes("success")) return "success";
  if (val.includes("cancel") || val.includes("fail") || val.includes("reject")) return "warning";
  return "active";
}

function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailBooking, setDetailBooking] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await getBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch bookings error:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Booking</p>
          <h2>Quan ly lich hen</h2>
          <p className="topbar-copy">Danh sach lich hen tu khach hang. Double click de xem chi tiet.</p>
        </div>
      </header>

      <section className="service-layout">
        <article className="panel service-table-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Danh sach</p>
              <h3>Lich hen hien co ({bookings.length})</h3>
            </div>
          </div>

          <div className="booking-index-table">
            <div className="booking-index-head">
              <span>Khach hang</span>
              <span>Dien thoai</span>
              <span>Xe</span>
              <span>Dich vu</span>
              <span>Lich hen</span>
              <span>Dia chi</span>
              <span>Tong tien</span>
              <span>Trang thai</span>
            </div>

            {loading ? <p>Dang tai du lieu...</p> : null}

            {!loading &&
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="booking-index-row"
                  onDoubleClick={() => setDetailBooking(booking)}
                >
                  <span>{booking.customerName || "-"}</span>
                  <span>{booking.customerPhone || "-"}</span>
                  <span>{`${booking.vehicleType || "-"} / ${booking.vehiclePlate || "-"}`}</span>
                  <span>{booking.serviceType || "-"}</span>
                  <span>{formatDateTime(booking.bookingDate, booking.bookingTime)}</span>
                  <span>{booking.addressName || "-"}</span>
                  <span>{formatPrice(booking.totalPrice)}</span>
                  <span>
                    <span className={`status ${statusTone(booking.status)}`}>
                      {booking.status || "PENDING"}
                    </span>
                  </span>
                </div>
              ))}

            {!loading && !bookings.length ? (
              <div className="empty-state">
                <p>Chua co lich hen nao.</p>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      {detailBooking ? (
        <div className="service-modal-backdrop" onClick={() => setDetailBooking(null)}>
          <article className="panel service-modal" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Chi tiet booking</p>
                <h3>#{detailBooking.id} - {detailBooking.customerName || "Khach"}</h3>
              </div>
            </div>

            <div className="service-detail-grid">
              <p><strong>Dien thoai:</strong> {detailBooking.customerPhone || "-"}</p>
              <p><strong>Email:</strong> {detailBooking.customerEmail || "-"}</p>
              <p><strong>Loai xe:</strong> {detailBooking.vehicleType || "-"}</p>
              <p><strong>Bien so:</strong> {detailBooking.vehiclePlate || "-"}</p>
              <p><strong>Dich vu:</strong> {detailBooking.serviceType || "-"}</p>
              <p><strong>Lich hen:</strong> {formatDateTime(detailBooking.bookingDate, detailBooking.bookingTime)}</p>
              <p><strong>Dia chi:</strong> {detailBooking.addressName || "-"}</p>
              <p><strong>Tong tien:</strong> {formatPrice(detailBooking.totalPrice)}</p>
              <p><strong>Trang thai:</strong> {detailBooking.status || "PENDING"}</p>
              <p><strong>Ghi chu:</strong> {detailBooking.note || "-"}</p>
            </div>

            <div className="service-form-actions">
              <button type="button" className="ghost-button" onClick={() => setDetailBooking(null)}>
                Dong
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </>
  );
}

export default BookingManagement;
