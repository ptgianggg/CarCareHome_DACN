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
import { getCategories, getServices, getFeaturedCategories, getReviews } from "@/services/api";
import "./Home.css";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:8089/api").replace(/\/api\/?$/, "");
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1607861716497-e65ab29fc7ac?auto=format&fit=crop&q=80&w=1200";

function Home() {
  const navigate = useNavigate();
  const { settings } = useSystem();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const [serviceData, categoryData, featuredData, reviewData] = await Promise.all([
          getServices(), 
          getCategories(),
          getFeaturedCategories(),
          getReviews()
        ]);
        if (ignore) {
          return;
        }
        
        setServices(Array.isArray(serviceData) ? serviceData.filter((item) => item.active !== false) : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
        setFeaturedCategories(Array.isArray(featuredData) ? featuredData : []);
        setReviews(Array.isArray(reviewData) ? reviewData : []);
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
    return services.slice(0, 4);
  }, [services]);

  const categoryHighlights = useMemo(() => {
    // Show top 3 booked categories
    return featuredCategories
      .map((category) => ({
        ...category,
        count: services.filter((service) => service.category === category.name).length
      }))
      .slice(0, 3);
  }, [featuredCategories, services]);

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
          <div className="hero-copy hero-glass-card">
            <span className="hero-badge">Dịch vụ 5 sao tận nơi</span>
            <h1>{settings?.bannerTitle || "Chăm sóc xe chuyên nghiệp tại nhà"}</h1>
            <p>
              {settings?.bannerSubtitle || "Tiết kiệm thời gian, tối ưu chất lượng. Trải nghiệm quy trình chăm sóc xe đẳng cấp ngay tại gara của bạn."}
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

              <button type="button" className="hero-secondary-btn" onClick={() => navigate("/services")}>Khám phá dịch vụ</button>
            </div>
          </div>


        </div>
      </section>

      <section className="page-shell home-section-grid">
        <div className="home-section-heading centered">
          <span className="hero-badge">Ưu điểm vượt trội</span>
          <h2 className="section-heading">Tối ưu hóa hành trình chăm sóc xe</h2>
          <p>
            Hệ thống thông minh giúp bạn tiết kiệm thời gian và trải nghiệm dịch vụ chuyên nghiệp nhất.
          </p>
        </div>

        <div className="home-highlight-grid">
          <article className="surface-card highlight-card">
            <div className="highlight-icon-wrap">
              <Sparkles size={24} />
            </div>
            <h3>Phân loại thông minh</h3>
            <p>Khám phá đúng nhu cầu chỉ trong vài giây với danh mục dịch vụ khoa học.</p>
          </article>
          <article className="surface-card highlight-card">
            <div className="highlight-icon-wrap">
              <CalendarClock size={24} />
            </div>
            <h3>Đặt lịch siêu tốc</h3>
            <p>Tự động hóa vị trí và thời gian, hoàn tất đặt lịch chỉ với vài cú chạm.</p>
          </article>
          <article className="surface-card highlight-card">
            <div className="highlight-icon-wrap">
              <Wrench size={24} />
            </div>
            <h3>Hành trình nhất quán</h3>
            <p>Đồng bộ tuyệt đối từ lúc đặt lịch đến khi thanh toán và theo dõi kết quả.</p>
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
                  {category.icon ? (
                    <img src={category.icon} alt={category.name} className="category-icon-img" />
                  ) : (
                    <Sparkles size={20} />
                  )}
                </div>
                <span className="category-service-count">{category.count} dịch vụ</span>
              </div>
              <h3>{category.name}</h3>
              <p>Khám phá các gói dịch vụ chuyên nghiệp nhất cho dòng xe của bạn.</p>
            </button>
          ))}

          {!loading && categoryHighlights.length === 0 && (
            <div className="surface-card empty-home-card">
              <h3>Danh mục nổi bật</h3>
              <p>Hiện chưa có đủ dữ liệu booking để hiển thị danh mục thịnh hành.</p>
            </div>
          )}
        </div>
      </section>

      <section className="page-shell home-section-grid home-services-grid-section">
        <div className="home-section-heading split">
          <div>
            <span className="hero-badge">Dành cho bạn</span>
            <h2 className="section-heading">Dịch vụ đang sẵn sàng</h2>
          </div>
          <button type="button" className="section-link-btn" onClick={() => navigate("/services")}>
            Tất cả dịch vụ <ArrowRight size={16} />
          </button>
        </div>

        <div className="home-service-grid-4">
          {featuredServices.map((service) => (
            <article 
              key={service.id} 
              className="surface-card service-v-card clickable-card"
              onClick={() => navigate(`/services/detail/${service.id}`)}
            >
              <div className="v-card-media">
                <img
                  src={getImageUrl(service.imageUrls?.[0] || service.imageUrl || FALLBACK_IMAGE)}
                  alt={service.name}
                />
                <div className="v-card-badge">{service.category || "Hot"}</div>
              </div>
              
              <div className="v-card-content">
                <div className="v-card-price">{Number(service.price).toLocaleString()}đ</div>
                <h3>{service.name}</h3>
                <p>{service.description?.substring(0, 60)}...</p>
                
                <div className="v-card-footer">
                  <button 
                    type="button" 
                    className="v-btn-primary" 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/booking?service_id=${service.id}`);
                    }}
                  >
                    <span>Đặt lịch ngay</span> <ArrowRight size={16} className="btn-icon" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page-shell home-section-grid home-reviews-section">
        <div className="home-section-heading centered">
          <span className="hero-badge">Trải nghiệm thực tế</span>
          <h2 className="section-heading">Khách hàng nói gì về chúng tôi</h2>
          <p>Sự hài lòng của khách hàng là động lực lớn nhất để CarCareHome không ngừng hoàn thiện.</p>
        </div>

        <div className="home-reviews-grid">
          {reviews.length > 0 ? (
            reviews.slice(0, 3).map((review) => (
              <article key={review.id} className="surface-card review-card">
                <div className="review-card-header">
                  <div className="review-user-info">
                    <div className="user-avatar-placeholder">
                      {review.customerName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3>{review.customerName}</h3>
                      <div className="review-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            fill={i < (review.rating || 5) ? "#fbbf24" : "none"} 
                            stroke={i < (review.rating || 5) ? "#fbbf24" : "rgba(255,255,255,0.2)"} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <Sparkles size={20} className="review-quote-icon" />
                </div>
                <p className="review-text">"{review.reviewComment || "Dịch vụ rất chuyên nghiệp, nhân viên nhiệt tình. Tôi rất hài lòng!"}"</p>
                <div className="review-footer">
                  <span className="review-service-tag">{review.serviceType}</span>
                  <span className="review-date">
                    {Array.isArray(review.bookingDate) 
                      ? `${review.bookingDate[2]}/${review.bookingDate[1]}/${review.bookingDate[0]}`
                      : review.bookingDate}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="surface-card empty-reviews-card">
              <p>Chưa có đánh giá nào. Hãy là người đầu tiên trải nghiệm dịch vụ của chúng tôi!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;