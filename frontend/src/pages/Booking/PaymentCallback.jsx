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
      <div className="callback-card surface-card">
        {status === "processing" && (
          <div className="status-box">
            <div className="spinner" />
            <div className="callback-icon neutral">
              <Clock3 size={42} />
            </div>
            <h2>Đang kiểm tra kết quả thanh toán</h2>
            <p>Hệ thống đang đồng bộ lại trạng thái đơn hàng. Bạn có thể chờ trong giây lát hoặc quay về trang lịch hẹn.</p>
            <div className="btn-group single">
              <button className="callback-btn secondary" onClick={() => navigate("/my-bookings")}>Về lịch hẹn của tôi</button>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="status-box success">
            <div className="callback-icon success">
              <CheckCircle2 size={46} />
            </div>
            <h2>Thanh toán thành công</h2>
            <p>Đơn hàng {orderId ? `#${orderId}` : "của bạn"} đã được ghi nhận. Bạn có thể tiếp tục theo dõi trạng thái xử lý trong phần lịch hẹn.</p>
            <div className="btn-group">
              <button className="callback-btn secondary" onClick={() => navigate("/services")}>Xem thêm dịch vụ</button>
              <button className="callback-btn primary" onClick={() => navigate("/my-bookings")}>Xem lịch hẹn <ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="status-box error">
            <div className="callback-icon error">
              <XCircle size={46} />
            </div>
            <h2>Thanh toán chưa hoàn tất</h2>
            <p>{message || "Có lỗi xảy ra trong quá trình thanh toán. Bạn có thể thử lại hoặc quay về lịch hẹn để tiếp tục xử lý."}</p>
            <div className="btn-group">
              <button className="callback-btn secondary" onClick={() => navigate("/my-bookings")}>Về lịch hẹn</button>
              <button className="callback-btn primary" onClick={() => navigate("/booking")}>Thử lại <RotateCcw size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;