import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock3, RotateCcw, XCircle } from "lucide-react";
import "./PaymentCallback.css";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resultCode = searchParams.get("resultCode");
  const orderId = searchParams.get("orderId");
  const message = searchParams.get("message");

  const status = useMemo(() => {
    if (resultCode === "0") return "success";
    if (resultCode != null) return "error";
    return "processing";
  }, [resultCode]);

  return (
    <div className="payment-callback-container">
      <div className="callback-card-premium">
        {status === "processing" && (
          <div className="status-box">
            <div className="spinner-heavy" />
            <div className="callback-icon-wrap">
              <div className="callback-icon processing">
                <Clock3 size={42} />
              </div>
              <div className="icon-glow" style={{ background: '#3b82f6' }}></div>
            </div>
            <h2>Đang kiểm tra giao dịch</h2>
            <p>Vui lòng không đóng trình duyệt. Chúng tôi đang xác thực kết quả thanh toán từ cổng MOMO.</p>
            <div className="btn-group">
              <button className="callback-btn secondary" onClick={() => navigate("/my-bookings")}>Về lịch sử đặt lịch</button>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="status-box">
            <div className="callback-icon-wrap">
              <div className="callback-icon success">
                <CheckCircle2 size={46} />
              </div>
              <div className="icon-glow" style={{ background: '#22c55e' }}></div>
            </div>
            <h2>Thanh toán thành công</h2>
            <p>Hệ thống đã ghi nhận khoản thanh toán cho đơn hàng của bạn. Kỹ thuật viên sẽ sớm liên hệ xác nhận.</p>
            {orderId && <div className="order-token">Mã đơn: #{orderId}</div>}
            <div className="btn-group">
              <button className="callback-btn secondary" onClick={() => navigate("/services")}>Dịch vụ khác</button>
              <button className="callback-btn primary" onClick={() => navigate("/my-bookings")}>Xem lịch hẹn <ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="status-box">
            <div className="callback-icon-wrap">
              <div className="callback-icon error">
                <XCircle size={46} />
              </div>
              <div className="icon-glow" style={{ background: '#ef4444' }}></div>
            </div>
            <h2>Thanh toán chưa hoàn tất</h2>
            <p>{message || "Giao dịch đã bị hủy hoặc gặp sự cố kỹ thuật. Vui lòng thử lại hoặc chọn phương thức thanh toán khác."}</p>
            <div className="btn-group">
              <button className="callback-btn secondary" onClick={() => navigate("/my-bookings")}>Về lịch hẹn</button>
              <button className="callback-btn error-btn" onClick={() => navigate("/booking")}>Thử lại <RotateCcw size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;