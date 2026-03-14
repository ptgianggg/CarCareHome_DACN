import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, googleLogin } from "../../services/api";
import { GoogleLogin } from "@react-oauth/google";
import "./Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login({ email, password });
      if (data.token) {
        // Lưu JWT token vào localStorage
        localStorage.setItem("token", data.token);
        // Lưu thông tin user vào localStorage
        localStorage.setItem("user", JSON.stringify({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role
        }));
        navigate("/");
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

  const handleGoogleError = () => {
    setError("Không thể kết nối với Google.");
  };

  return (
    <div className="auth-wrapper">
      {/* Animated background blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <div className="auth-container">
        {/* Left panel - Branding */}
        <div className="auth-left">
          <div className="brand">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L3 15V18H21V15L19 13H5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M5 13L7 7H17L19 13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="8" cy="18" r="2" fill="currentColor" />
                <circle cx="16" cy="18" r="2" fill="currentColor" />
                <path d="M9 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="brand-name">CarCare<span>Home</span></h1>
          </div>

          <div className="brand-content">
            <h2>Chào mừng trở lại!</h2>
            <p>Dịch vụ chăm sóc xe hơi chuyên nghiệp, tận tâm và uy tín hàng đầu.</p>

            <div className="features">
              <div className="feature-item">
                <div className="feature-icon">🔧</div>
                <span>Sửa chữa chuyên nghiệp</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <span>Phục vụ nhanh chóng</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🛡️</div>
                <span>Bảo hành dài hạn</span>
              </div>
            </div>
          </div>

          <div className="brand-decoration">
            <div className="deco-circle deco-circle-1"></div>
            <div className="deco-circle deco-circle-2"></div>
          </div>
        </div>

        {/* Right panel - Form */}
        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-header">
              <h2>Đăng nhập</h2>
              <p>Nhập thông tin tài khoản của bạn</p>
            </div>

            {error && (
              <div className="auth-error">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Mật khẩu
                  <a href="#" className="forgot-link">Quên mật khẩu?</a>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`auth-btn ${loading ? "loading" : ""}`}
                disabled={loading}
                id="login-submit-btn"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>Hoặc</span>
            </div>

            <div className="social-login">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="filled_blue"
                shape="pill"
                locale="vi"
                width="100%"
              />
            </div>

            <div className="auth-footer">
              <p>
                Chưa có tài khoản?{" "}
                <Link to="/register" className="auth-link">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
