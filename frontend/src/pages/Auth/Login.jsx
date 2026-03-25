import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as apiLogin, googleLogin } from "@/services/api";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/layouts/AuthLayout/AuthLayout";
import FormInput from "@/components/common/FormInput/FormInput";
import "./Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const { login: contextLogin } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
      title: "Sửa chữa chuyên nghiệp"
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
      title: "Phục vụ nhanh chóng"
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      title: "Bảo hành dài hạn"
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setTouched({ email: true, password: true });

    if (!email || !password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiLogin({ email, password });
      if (data.token) {
        contextLogin({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role
        }, data.token);

        // Role-based redirection
        if (data.role === "ADMIN" || data.role === "ROLE_ADMIN") {
          navigate("/admin/booking");
        } else if (data.role === "STAFF" || data.role === "ROLE_STAFF") {
          navigate("/staff/tasks");
        } else {
          navigate("/");
        }
      } else {
        setError(data.message || "Email hoặc mật khẩu không đúng.");
      }
    } catch (err) {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const data = await googleLogin(credentialResponse.credential);
      if (data.token) {
        contextLogin({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role
        }, data.token);

        // Role-based redirection
        if (data.role === "ADMIN" || data.role === "ROLE_ADMIN") {
          navigate("/admin/booking");
        } else if (data.role === "STAFF" || data.role === "ROLE_STAFF") {
          navigate("/staff/tasks");
        } else {
          navigate("/");
        }
      } else {
        setError(data.message || "Đăng nhập Google thất bại.");
      }
    } catch (err) {
      setError("Đã có lỗi xảy ra khi đăng nhập Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Chào mừng trở lại!" features={features}>
      <div className="auth-header">
        <h2>Đăng nhập</h2>
      </div>

      {error && (
        <div className="auth-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <FormInput 
          label="Địa chỉ email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched({ ...touched, email: true })}
          placeholder="name@example.com"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
          error={!email && touched.email ? "Email không được để trống" : ""}
          touched={touched.email}
          required
        />

        <div className="form-group">
          <FormInput 
            label="Mật khẩu"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched({ ...touched, password: true })}
            placeholder="••••••••"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
            error={!password && touched.password ? "Mật khẩu không được để trống" : ""}
            touched={touched.password}
            required
          />
          <div className="form-options">
            <Link to="/forgot-password" title="Quên mật khẩu?" className="forgot-link">Quên mật khẩu?</Link>
          </div>
        </div>

        <button type="submit" className="auth-btn" disabled={loading} id="login-submit-btn">
          {loading ? (
             <span className="btn-loader"></span>
          ) : (
            <>
              Đăng nhập ngay
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </>
          )}
        </button>

        <div className="auth-divider">
          <span>Hoặc đăng nhập bằng</span>
        </div>

        <div className="social-login">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Đăng nhập Google thất bại.")}
            useOneTap
            theme="filled_blue"
            shape="pill"
            locale="vi"
            width="100%"
          />
        </div>
      </form>

      <div className="auth-footer">
        <p>Chưa có tài khoản? <Link to="/register" className="auth-link">Đăng ký ngay</Link></p>
      </div>
    </AuthLayout>
  );
}

export default Login;
