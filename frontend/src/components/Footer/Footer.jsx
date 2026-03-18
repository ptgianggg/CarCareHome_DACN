import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-top">
        <div className="footer-container">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L3 15V18H21V15L19 13H5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M5 13L7 7H17L19 13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <circle cx="8" cy="18" r="2" fill="currentColor" />
                  <circle cx="16" cy="18" r="2" fill="currentColor" />
                  <path d="M9 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h2>CarCare<span>Home</span></h2>
            </Link>
            <p className="brand-desc">
              Hệ thống chăm sóc xe hơi thông minh, tận tâm và uy tín hàng đầu. Trải nghiệm dịch vụ chuyên nghiệp ngay tại ngôi nhà của bạn.
            </p>
            <div className="social-links">
              <a href="#" className="social-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
              <a href="#" className="social-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
              <a href="#" className="social-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg></a>
            </div>
          </div>

          <div className="footer-links">
            <h3>Dịch vụ</h3>
            <ul>
              <li><Link to="/services">Rửa xe cao cấp</Link></li>
              <li><Link to="/services">Đánh bóng & Ceramic</Link></li>
              <li><Link to="/services">Vệ sinh nội thất</Link></li>
              <li><Link to="/services">Kiểm tra tổng quát</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h3>Hỗ trợ</h3>
            <ul>
              <li><Link to="/contact">Liên hệ</Link></li>
              <li><Link to="/faq">Câu hỏi thường gặp</Link></li>
              <li><Link to="/terms">Điều khoản sử dụng</Link></li>
              <li><Link to="/privacy">Chính sách bảo mật</Link></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h3>Liên hệ</h3>
            <div className="contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>Tp. Hồ Chí Minh, Việt Nam</span>
            </div>
            <div className="contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span>+84 123 456 789</span>
            </div>
            <div className="contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span>support@carcarehome.com</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container">
          <p>&copy; 2024 CarCareHome. Tất cả quyền được bảo lưu.</p>
          <div className="footer-legal">
            <span>Thiết kế bởi CarCare Team</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
