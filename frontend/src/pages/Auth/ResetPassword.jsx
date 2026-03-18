import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "@/services/api";
import AuthLayout from "@/layouts/AuthLayout/AuthLayout";
import FormInput from "@/components/common/FormInput/FormInput";
import "./Auth.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });

  const features = [
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
      title: "Bảo mật tài khoản",
      desc: "Thay đổi mật khẩu định kỳ để bảo vệ thông tin cá nhân của bạn."
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Token không hợp lệ. Vui lòng kiểm tra lại link trong email.");
      return;
    }

    setError("");
    setTouched({ password: true, confirmPassword: true });

    if (!password || !confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword(token, password);
      if (data.message === "Đổi mật khẩu thành công!") {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(data.message || "Không thể đặt lại mật khẩu.");
      }
    } catch (err) {
      setError("Token đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Đặt lại mật khẩu" features={features}>
      {success ? (
        <div className="success-state">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
          </div>
          <h3>Thành công!</h3>
          <p>Mật khẩu của bạn đã được cập nhật.</p>
          <p>Đang chuyển hướng về trang đăng nhập...</p>
        </div>
      ) : (
        <>
          <div className="auth-header">
            <h2>Mật khẩu mới</h2>
            {!token && <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '10px' }}>⚠️ Thiếu Reset Token</div>}
          </div>

          {error && (
            <div className="auth-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <FormInput 
              label="Mật khẩu mới"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched({ ...touched, password: true })}
              placeholder="Tối thiểu 6 ký tự"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              error={!password && touched.password ? "Mật khẩu không được để trống" : ""}
              touched={touched.password}
              required
            />

            <FormInput 
              label="Xác nhận mật khẩu"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setTouched({ ...touched, confirmPassword: true })}
              placeholder="Nhập lại mật khẩu"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              error={confirmPassword && password !== confirmPassword ? "Mật khẩu không khớp" : ""}
              touched={touched.confirmPassword}
              required
            />

            <button type="submit" className="auth-btn" disabled={loading || !token}>
              {loading ? (
                <span className="btn-loader"></span>
              ) : (
                <>
                  Cập nhật mật khẩu ngay
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777V13.5L15.5 10l-3 3 3 3 2-2"/></svg>
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>Xảy ra lỗi? <Link to="/forgot-password" title="Quên mật khẩu?" className="auth-link">Yêu cầu lại link</Link></p>
          </div>
        </>
      )}
    </AuthLayout>
  );
}

export default ResetPassword;
