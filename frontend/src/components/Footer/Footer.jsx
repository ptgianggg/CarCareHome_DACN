import { useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  Twitter, 
  Mail, 
  MapPin, 
  Phone, 
  ChevronRight,
  MessageSquare,
  Clock
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import logo from "@/assets/logo.png";
import "./Footer.css";

function Footer() {
  const { user } = useAuth();

  const quickLinks = useMemo(() => [
    { to: "/", label: "Trang chủ" },
    { to: "/services", label: "Dịch vụ" },
    { to: "/booking", label: "Đặt lịch" },
    { to: "/my-bookings", label: "Lịch hẹn" },
  ], []);

  const serviceCategories = [
    "Vệ sinh nội thất",
    "Rửa xe chi tiết",
    "Đánh bóng hiệu chỉnh",
    "Phủ Ceramic bảo vệ",
    "Vệ sinh khoang máy",
    "Dịch vụ lưu động"
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "Youtube" },
    { icon: MessageSquare, href: "#", label: "Zalo" },
  ];

  return (
    <footer className="main-footer">
      <div className="footer-top-wave"></div>
      
      <div className="footer-content footer-container">
        {/* Brand Section */}
        <div className="footer-section brand-column">
          <Link to="/" className="footer-brand">
            <div className="footer-logo-container">
              <img src={logo} alt="CarCareHome Logo" className="footer-logo-img" />
            </div>
            <div className="footer-brand-text">
              <strong>CarCareHome</strong>
              <span className="footer-tagline">Professional Car Care At Home</span>
            </div>
          </Link>
          <p className="footer-description">
            Chúng tôi mang đến giải pháp chăm sóc xe hơi chuyên nghiệp ngay tại nhà của bạn. 
            Tiết kiệm thời gian, tối ưu quy trình và đảm bảo chất lượng hàng đầu.
          </p>
          <div className="footer-socials">
            {socialLinks.map((social, index) => (
              <a key={index} href={social.href} className="social-btn" aria-label={social.label}>
                <social.icon size={20} />
              </a>
            ))}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="footer-section">
          <h4 className="footer-heading">Khám phá</h4>
          <ul className="footer-links">
            {quickLinks.map((link, index) => (
              <li key={index}>
                <Link to={link.to}>
                  <ChevronRight size={14} className="link-icon" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services Links */}
        <div className="footer-section">
          <h4 className="footer-heading">Dịch vụ chính</h4>
          <ul className="footer-links">
            {serviceCategories.map((service, index) => (
              <li key={index}>
                <Link to="/services">
                  <ChevronRight size={14} className="link-icon" />
                  {service}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact info */}
        <div className="footer-section contact-column">
          <h4 className="footer-heading">Thông tin liên hệ</h4>
          <div className="contact-info-list">
            <div className="contact-info-item">
              <div className="info-icon-wrapper">
                <Phone size={18} />
              </div>
              <div className="info-text">
                <span>Hotline 24/7</span>
                <a href="tel:0123456789">0123 456 789</a>
              </div>
            </div>
            
            <div className="contact-info-item">
              <div className="info-icon-wrapper">
                <Mail size={18} />
              </div>
              <div className="info-text">
                <span>Email hỗ trợ</span>
                <a href="mailto:contact@carcarehome.vn">contact@carcarehome.vn</a>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="info-icon-wrapper">
                <MapPin size={18} />
              </div>
              <div className="info-text">
                <span>Văn phòng chính</span>
                <p>Quận 1, TP. Hồ Chí Minh</p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="info-icon-wrapper">
                <Clock size={18} />
              </div>
              <div className="info-text">
                <span>Giờ làm việc</span>
                <p>08:00 - 21:00 (Hàng ngày)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container bottom-inner">
          <p className="copyright">
            © {new Date().getFullYear()} <strong>CarCareHome</strong>. All rights reserved.
          </p>
          <div className="bottom-links">
            <Link to="/privacy">Chính sách bảo mật</Link>
            <Link to="/terms">Điều khoản sử dụng</Link>
            <Link to="/faq">Câu hỏi thường gặp</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;