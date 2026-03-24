import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
  MapPinHouse
} from "lucide-react";
import defaultBannerImg from "@/assets/banner.png";
import { useSystem } from "@/context/SystemContext";
import { getCategories, getServices } from "@/services/api";
import "./Home.css";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:8089/api").replace(/\/api\/?$/, "");
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1607861716497-e65ab29fc7ac?auto=format&fit=crop&q=80&w=1200";

function Home() {
  const navigate = useNavigate();
  const { settings } = useSystem();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const [serviceData, categoryData] = await Promise.all([getServices(), getCategories()]);
        if (ignore) {
          return;
        }

        setServices(Array.isArray(serviceData) ? serviceData.filter((item) => item.active !== false) : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      } catch (error) {
        console.error("Load home data failed:", error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const getImageUrl = (value) => {
    if (!value) {
      return defaultBannerImg;
    }

    if (value.startsWith("http")) {
      return value;
    }

    return `${API_ORIGIN}${value}`;
  };

  const bannerImg = getImageUrl(settings?.bannerUrl || FALLBACK_IMAGE);

  const featuredServices = useMemo(() => {
    return services.slice(0, 6);
  }, [services]);

  const categoryHighlights = useMemo(() => {
    return categories
      .map((category) => ({
        ...category,
        count: services.filter((service) => service.category === category.name).length
      }))
      .filter((category) => category.count > 0)
      .slice(0, 4);
  }, [categories, services]);

  const stats = useMemo(
    () => [
      { label: "Gói dịch vụ đang mở", value: services.length || "12+" },
      { label: "Nhóm danh mục nổi bật", value: categoryHighlights.length || "4" },
      { label: "Khung giờ hỗ trợ mỗi ngày", value: "8:00 - 21:00" }
    ],
    [categoryHighlights.length, services.length]
  );

  const journeySteps = [
    {
      title: "Chọn gói phù hợp",
      description: "Lọc theo nhu cầu chăm sóc, loại xe và ngân sách trước khi đặt lịch."
    },
    {
      title: "Xác nhận địa điểm",
      description: "Hệ thống gợi ý quãng đường, chi phí di chuyển và lịch trống minh bạch."
    },
    {
      title: "Theo dõi sau khi đặt",
      description: "Thanh toán, trạng thái xử lý và lịch sử dịch vụ được cập nhật trong cùng một nơi."
    }
  ];

  const promises = [
    "Thanh toán và lịch hẹn hiển thị rõ theo từng đơn.",
    "Thông tin dịch vụ được nhóm theo danh mục, giúp ra quyết định nhanh hơn.",
    "Thiết kế ưu tiên thao tác thực tế trên cả điện thoại lẫn màn hình lớn."
  ];

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-media">
          <img src={bannerImg} alt="Dịch vụ chăm sóc xe tại nhà" className="home-hero-image" />
        </div>
        <div className="home-hero-overlay" />

        <div className="page-shell home-hero-content">
          <div className="hero-copy surface-card">
            <span className="tag-eyebrow">Chăm sóc xe tại nhà, gọn và rõ</span>
            <h1>{settings?.bannerTitle || "Đặt lịch chăm sóc xe tại nhà với trải nghiệm mượt hơn ở từng bước"}</h1>
            <p>
              {settings?.bannerSubtitle ||
                "Từ khám phá dịch vụ, chọn thời gian đến theo dõi thanh toán và lịch sử xử lý, mọi điểm chạm đều được sắp xếp để bạn thao tác nhanh và ít bối rối hơn."}
            </p>

            <div className="hero-cta-row">
              <button
                type="button"
                className="hero-primary-btn"
                onClick={() => navigate(settings?.bannerButtonLink || "/booking")}
              >
                <span>{settings?.bannerButtonText || "Đặt lịch ngay"}</span>
                <ArrowRight size={18} />
              </button>

              <button type="button" className="hero-secondary-btn" onClick={() => navigate("/services")}>Xem bảng dịch vụ</button>
            </div>

            <div className="hero-proof-row">
              <div className="hero-proof-item">
                <ShieldCheck size={18} />
                <span>Luồng đặt lịch và thanh toán rõ ràng</span>
              </div>
              <div className="hero-proof-item">
                <Clock3 size={18} />
                <span>Thao tác nhanh trên di động</span>
              </div>
              <div className="hero-proof-item">
                <MapPinHouse size={18} />
                <span>Thiết kế cho dịch vụ tận nơi</span>
              </div>
            </div>
          </div>

          <div className="hero-summary-grid">
            {stats.map((item) => (
              <article key={item.label} className="hero-stat-card surface-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell home-section-grid">
        <div className="home-section-heading">
          <span className="tag-eyebrow">Điểm nổi bật</span>
          <h2 className="section-heading">Trang chủ giờ không chỉ để nhìn, mà dẫn người dùng đi đến đúng thao tác tiếp theo</h2>
          <p>
            Các khối dưới đây được tổ chức để người mới cũng hiểu nhanh: có gì để đặt, vì sao nên dùng, và bước tiếp theo là gì.
          </p>
        </div>

        <div className="home-highlight-grid">
          <article className="surface-card highlight-card">
            <Sparkles size={20} />
            <h3>Dịch vụ được gom theo mục đích</h3>
            <p>Rửa xe, nội thất, ceramic hay kiểm tra tổng quát đều có đường dẫn khám phá rõ ràng.</p>
          </article>
          <article className="surface-card highlight-card">
            <CalendarClock size={20} />
            <h3>Đi từ trang chủ đến đặt lịch nhanh hơn</h3>
            <p>CTA chính và các khối gợi ý đều đưa người dùng tới đúng màn tiếp theo thay vì chỉ xem cho đẹp.</p>
          </article>
          <article className="surface-card highlight-card">
            <Wrench size={20} />
            <h3>Ưu tiên hành trình thực tế</h3>
            <p>Từ xem dịch vụ đến theo dõi lịch hẹn, các điểm chạm được giữ nhất quán về tông chữ, khoảng cách và trạng thái.</p>
          </article>
        </div>
      </section>

      <section className="page-shell home-section-grid">
        <div className="home-section-heading split">
          <div>
            <span className="tag-eyebrow">Khám phá nhanh</span>
            <h2 className="section-heading">Danh mục nổi bật</h2>
          </div>
          <button type="button" className="section-link-btn" onClick={() => navigate("/services")}>Xem toàn bộ dịch vụ</button>
        </div>

        <div className="home-category-grid">
          {categoryHighlights.map((category) => (
            <button
              key={category.id}
              type="button"
              className="surface-card category-card"
              onClick={() => navigate(`/services/${encodeURIComponent(category.name)}`)}
            >
              <div className="category-card-top">
                <div className="category-icon-wrap">
                  {category.icon ? <img src={getImageUrl(category.icon)} alt={category.name} /> : <Sparkles size={20} />}
                </div>
                <span>{category.count} dịch vụ</span>
              </div>
              <h3>{category.name}</h3>
              <p>Một lối vào gọn để xem đúng nhóm dịch vụ bạn đang cần cho chiếc xe hiện tại.</p>
            </button>
          ))}

          {!loading && categoryHighlights.length === 0 && (
            <div className="surface-card empty-home-card">
              <h3>Danh mục sẽ hiển thị tại đây</h3>
              <p>Hệ thống chưa có đủ dữ liệu để gợi ý danh mục nổi bật, nhưng bạn vẫn có thể vào bảng dịch vụ để xem tất cả.</p>
            </div>
          )}
        </div>
      </section>

      <section className="page-shell home-section-grid">
        <div className="home-section-heading split">
          <div>
            <span className="tag-eyebrow">Dành cho quyết định nhanh</span>
            <h2 className="section-heading">Một vài dịch vụ đang sẵn sàng nhận lịch</h2>
          </div>
          <button type="button" className="section-link-btn" onClick={() => navigate("/booking")}>Bắt đầu đặt lịch</button>
        </div>

        <div className="home-service-grid">
          {featuredServices.map((service) => (
            <article key={service.id} className="surface-card home-service-card">
              <div className="service-card-media">
                <img
                  src={getImageUrl(service.imageUrls?.[0] || service.imageUrl || FALLBACK_IMAGE)}
                  alt={service.name}
                />
              </div>
              <div className="service-card-content">
                <div className="service-card-meta">
                  <span>{service.category || "Chăm sóc xe"}</span>
                  <span>{Number(service.price || 0).toLocaleString()} đ</span>
                </div>
                <h3>{service.name}</h3>
                <p>{service.description || "Gói dịch vụ được tối ưu cho trải nghiệm chăm sóc xe tại nhà, minh bạch về nội dung và chi phí."}</p>
                <div className="service-card-actions">
                  <button type="button" className="inline-btn" onClick={() => navigate(`/services/detail/${service.id}`)}>Xem chi tiết</button>
                  <button type="button" className="inline-btn secondary" onClick={() => navigate(`/booking?service_id=${service.id}`)}>Đặt lịch</button>
                </div>
              </div>
            </article>
          ))}

          {!loading && featuredServices.length === 0 && (
            <div className="surface-card empty-home-card">
              <h3>Chưa có dịch vụ nổi bật</h3>
              <p>Khi dữ liệu dịch vụ được thêm đầy đủ, khu vực này sẽ giúp người dùng bắt đầu nhanh hơn ngay từ trang đầu.</p>
            </div>
          )}
        </div>
      </section>

      <section className="page-shell home-process-grid">
        <article className="surface-card process-card">
          <span className="tag-eyebrow">Quy trình mới</span>
          <h2 className="section-heading">Ba bước để hoàn tất một lịch hẹn rõ ràng hơn</h2>
          <div className="process-list">
            {journeySteps.map((step, index) => (
              <div key={step.title} className="process-item">
                <div className="process-index">0{index + 1}</div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card promise-card">
          <span className="tag-eyebrow">Cam kết trải nghiệm</span>
          <h2 className="section-heading">Mỗi màn đều phải trả lời được câu hỏi “tiếp theo tôi làm gì?”</h2>
          <div className="promise-list">
            {promises.map((item) => (
              <div key={item} className="promise-item">
                <CheckCircle2 size={18} />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="promise-rating">
            <div>
              <strong>4.9/5</strong>
              <span>cảm giác mượt ở hành trình người dùng</span>
            </div>
            <div className="rating-stars">
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

export default Home;