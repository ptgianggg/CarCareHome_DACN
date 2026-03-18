import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "@/services/api";
import AuthLayout from "@/layouts/AuthLayout/AuthLayout";
import FormInput from "@/components/common/FormInput/FormInput";
import "./Auth.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState(false);

  const features = [
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
      title: "Khôi phục an toàn",
      desc: "Chúng tôi bảo mật thông tin tài khoản của bạn tuyệt đối."
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setTouched(true);

    if (!email) {
      setError("Vui lòng nhập email.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Quên mật khẩu?" features={features}>
      {success ? (
        <div className="success-state">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
          </div>
          <h3>Kiểm tra email!</h3>
          <p>Chúng tôi đã gửi link đặt lại mật khẩu đến <strong>{email}</strong>.</p>
          <Link to="/login" className="auth-btn" style={{ marginTop: "30px", textDecoration: "none" }}>
            Quay lại đăng nhập
          </Link>
        </div>
      ) : (
        <>
          <div className="auth-header">
            <h2>Khôi phục mật khẩu</h2>
          </div>

          {error && (
            <div className="auth-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <FormInput 
              label="Email tài khoản"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="name@example.com"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
              error={touched && !email ? "Email không được để trống" : ""}
              touched={touched}
              required
            />

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <span className="btn-loader"></span>
              ) : (
                <>
                  Gửi hướng dẫn ngay
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>Nhớ ra mật khẩu? <Link to="/login" className="auth-link">Quay lại đăng nhập</Link></p>
          </div>
        </>
      )}
    </AuthLayout>
  );
}

export default ForgotPassword;
