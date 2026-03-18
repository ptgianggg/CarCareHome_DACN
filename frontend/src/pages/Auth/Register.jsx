import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, googleLogin } from "@/services/api";
import { GoogleLogin } from "@react-oauth/google";
import AuthLayout from "@/layouts/AuthLayout/AuthLayout";
import FormInput from "@/components/common/FormInput/FormInput";
import "./Auth.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const navigate = useNavigate();

  const features = [
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
      title: "Đặt lịch dễ dàng"
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
      title: "Theo dõi tiến độ"
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
      title: "Đặc quyền VIP"
    }
  ];

  const getPasswordStrength = (pwd) => {
    if (pwd.length === 0) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const levels = [
      { score: 1, label: "Yếu", color: "#ef4444" },
      { score: 2, label: "Trung bình", color: "#f97316" },
      { score: 3, label: "Khá", color: "#eab308" },
      { score: 4, label: "Mạnh", color: "#22c55e" },
    ];
    return levels[score - 1] || { score: 0, label: "", color: "" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const data = await register({ name, email, password });
      if (data.id) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.message || "Đăng ký thất bại. Vui lòng thử lại.");
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
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role
        }));
        navigate("/");
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
    <AuthLayout title="Tham gia cùng chúng tôi!" features={features}>
      {success ? (
        <div className="success-state">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
          </div>
          <h3>Đăng ký thành công!</h3>
          <p>Đang chuyển hướng đến trang đăng nhập...</p>
        </div>
      ) : (
        <>
          <div className="auth-header">
            <h2>Tạo tài khoản</h2>
          </div>

          {error && (
            <div className="auth-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <FormInput 
              label="Họ và tên"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched({ ...touched, name: true })}
              placeholder="Nguyễn Văn A"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
              error={!name.trim() && touched.name ? "Họ tên không được để trống" : ""}
              touched={touched.name}
              required
            />

            <FormInput 
              label="Địa chỉ email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched({ ...touched, email: true })}
              placeholder="name@example.com"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
              error={!email.trim() && touched.email ? "Email không được để trống" : ""}
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
                placeholder="Tối thiểu 6 ký tự"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                error={!password && touched.password ? "Mật khẩu không được để trống" : ""}
                touched={touched.password}
                required
              />
              {password && (
                <div className="password-strength">
                  <div className="strength-bars">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="strength-bar" style={{ backgroundColor: i <= strength.score ? strength.color : "rgba(255,255,255,0.1)" }}></div>
                    ))}
                  </div>
                  <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>

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

            <button type="submit" className="auth-btn" disabled={loading} id="register-submit-btn">
              {loading ? (
                <span className="btn-loader"></span>
              ) : (
                <>
                  Tạo tài khoản ngay
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </>
              )}
            </button>

            <div className="auth-divider">
              <span>Hoặc đăng ký bằng</span>
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
            <p>Đã có tài khoản? <Link to="/login" className="auth-link">Đăng nhập ngay</Link></p>
          </div>
        </>
      )}
    </AuthLayout>
  );
}

export default Register;
