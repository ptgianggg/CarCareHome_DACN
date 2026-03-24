import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, ChevronRight, Mail, MapPin, PhoneCall, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import "./Footer.css";

function Footer() {
  const { user } = useAuth();

  const quickLinks = useMemo(() => {
    const links = [
      { to: "/", label: "Trang chủ" },
      { to: "/services", label: "Khám phá dịch vụ" },
      { to: "/booking", label: "Đặt lịch tại nhà" }
    ];

    if (user) {
      links.push({ to: "/my-bookings", label: "Theo dõi lịch hẹn" });
      links.push({ to: "/profile", label: "Hồ sơ cá nhân" });
    }

    return links;
  }, [user]);

  const serviceHighlights = [
    "Rửa xe cao cấp tại nhà",
    "Vệ sinh khoang nội thất",
    "Đánh bóng và phủ ceramic",
    "Kiểm tra tổng quát theo lịch"
  ];

  const trustPoints = [
    {
      icon: ShieldCheck,
      title: "Kỹ thuật viên rõ lịch",
      description: "Thông tin lịch hẹn, thời gian và trạng thái thanh toán được đồng bộ trong tài khoản của bạn."
    },
    {
      icon: Sparkles,
      title: "Dịch vụ theo nhu cầu",
      description: "Từ vệ sinh nhanh đến các gói chăm sóc chuyên sâu, bạn có thể chọn linh hoạt theo từng xe."
    },
    {
      icon: Wrench,
      title: "Trải nghiệm tại nhà",
      description: "Đặt lịch nhanh, theo dõi tiến độ rõ ràng và hạn chế tối đa thao tác rời rạc khi sử dụng dịch vụ."
    }
  ];

  return (
    <footer className="main-footer">
      <div className="footer-container footer-grid">
        <section className="footer-brand-panel surface-card">
          <div className="footer-brand-top">
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
              <div>
                <span className="footer-kicker">Car care at home</span>
                <h2>CarCareHome</h2>
              </div>
            </Link>

            <p className="brand-desc">
              Nền tảng đặt lịch chăm sóc xe tại nhà với hành trình rõ ràng từ chọn dịch vụ,
              thanh toán đến theo dõi lịch hẹn và đánh giá sau hoàn tất.
            </p>
          </div>

          <div className="footer-cta-row">
            <Link to="/booking" className="footer-cta primary">
              Đặt lịch ngay
              <ChevronRight size={16} />
            </Link>
            <Link to={user ? "/my-bookings" : "/services"} className="footer-cta secondary">
              {user ? "Xem lịch hẹn" : "Xem bảng dịch vụ"}
            </Link>
          </div>

          <div className="footer-trust-grid">
            {trustPoints.map(({ icon: Icon, title, description }) => (
              <article key={title} className="footer-trust-item">
                <span className="footer-trust-icon">
                  <Icon size={18} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="footer-column">
          <p className="footer-column-title">Điều hướng nhanh</p>
          <div className="footer-link-list">
            {quickLinks.map((item) => (
              <Link key={item.to} to={item.to} className="footer-link-item">
                <ChevronRight size={14} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="footer-column">
          <p className="footer-column-title">Dịch vụ nổi bật</p>
          <div className="footer-link-list compact">
            {serviceHighlights.map((label) => (
              <Link key={label} to="/services" className="footer-link-item muted">
                <Sparkles size={14} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="footer-column footer-contact-card surface-card">
          <p className="footer-column-title">Liên hệ & hỗ trợ</p>

          <div className="footer-contact-list">
            <a className="footer-contact-item" href="tel:+84123456789">
              <PhoneCall size={16} />
              <span>+84 123 456 789</span>
            </a>
            <a className="footer-contact-item" href="mailto:support@carcarehome.com">
              <Mail size={16} />
              <span>support@carcarehome.com</span>
            </a>
            <div className="footer-contact-item">
              <MapPin size={16} />
              <span>TP. Hồ Chí Minh, phục vụ linh hoạt theo khu vực</span>
            </div>
            <div className="footer-contact-item">
              <CalendarClock size={16} />
              <span>Hỗ trợ đặt lịch mỗi ngày từ 8:00 đến 21:00</span>
            </div>
          </div>

          <div className="footer-note">
            <strong>Gợi ý nhanh</strong>
            <p>
              Nếu bạn đã có tài khoản, hãy vào mục lịch hẹn để theo dõi thanh toán, trạng thái xử lý và nhân viên phụ trách.
            </p>
          </div>
        </section>
      </div>

      <div className="footer-bottom-bar">
        <div className="footer-container footer-bottom-content">
          <p>© {new Date().getFullYear()} CarCareHome. Trải nghiệm chăm sóc xe tại nhà được thiết kế gọn, rõ và đáng tin cậy.</p>
          <div className="footer-bottom-links">
            <Link to="/services">Bảng dịch vụ</Link>
            <Link to="/booking">Đặt lịch</Link>
            <Link to="/profile">Tài khoản</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;