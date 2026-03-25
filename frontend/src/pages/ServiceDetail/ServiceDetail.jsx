import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronRight, Home as HomeIcon, MapPin, Share2, ShieldCheck, Sparkles, Timer } from "lucide-react";
import toast from "react-hot-toast";
import { getServiceById } from "@/services/api";
import "./style.css";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:8089/api").replace(/\/api\/?$/, "");
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=1400";

function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [localImageMap, setLocalImageMap] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("service_local_images");
      setLocalImageMap(raw ? JSON.parse(raw) : {});
    } catch {
      setLocalImageMap({});
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadDetail = async () => {
      setLoading(true);
      setImgIdx(0);

      try {
        const data = await getServiceById(id);
        if (!ignore) {
          setService(data || null);
        }
      } catch (error) {
        console.error("Load service detail failed:", error);
        if (!ignore) {
          setService(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadDetail();
    return () => {
      ignore = false;
    };
  }, [id]);

  const galleryImages = useMemo(() => {
    if (!service) {
      return [FALLBACK_IMAGE];
    }

    const rawImages = [];

    if (Array.isArray(service.imageUrls)) {
      rawImages.push(...service.imageUrls);
    }

    if (service.imageUrl) {
      rawImages.push(service.imageUrl);
    }

    const localImages = localImageMap[String(service.id)];
    if (localImages) {
      rawImages.push(...(Array.isArray(localImages) ? localImages : [localImages]));
    }

    const normalized = rawImages
      .filter(Boolean)
      .map((item) => {
        if (String(item).startsWith("data:") || String(item).startsWith("http")) {
          return item;
        }

        return `${API_ORIGIN}${String(item).startsWith("/") ? "" : "/"}${item}`;
      });

    const uniqueImages = [...new Set(normalized)];
    return uniqueImages.length > 0 ? uniqueImages : [FALLBACK_IMAGE];
  }, [localImageMap, service]);

  const summaryFacts = useMemo(() => {
    if (!service) {
      return [];
    }

    return [
      {
        icon: Sparkles,
        label: "Danh mục",
        value: service.category || "Chăm sóc xe"
      },
      {
        icon: Timer,
        label: "Thời lượng gợi ý",
        value: service.durationMinutes ? `${service.durationMinutes} phút` : "60 - 90 phút"
      }
      
    ];
  }, [service]);

  const handleShare = async () => {
    const shareData = {
      title: service?.name || "CarCareHome",
      text: `Xem dịch vụ ${service?.name || "chăm sóc xe"} trên CarCareHome`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết dịch vụ");
    } catch {
      toast.error("Không thể chia sẻ ngay lúc này");
    }
  };

  if (loading) {
    return (
        <main className="detail-state-shell">
          <div className="detail-state-card surface-card">
            <div className="spinner-heavy" />
            <p>Đang tải chi tiết dịch vụ...</p>
          </div>
        </main>
    );
  }

  if (!service) {
    return (
        <main className="detail-state-shell">
          <div className="detail-state-card surface-card">
            <h2>Không tìm thấy dịch vụ này</h2>
            <p>Dịch vụ có thể đã bị ẩn hoặc đường dẫn không còn hợp lệ.</p>
            <button type="button" className="detail-primary-btn" onClick={() => navigate("/services")}>Quay lại bảng dịch vụ</button>
          </div>
        </main>
    );
  }

  return (
      <main className="detail-page-shell">
        <nav className="service-breadcrumb page-shell">
          <button type="button" onClick={() => navigate("/")}>
            <HomeIcon size={16} />
            <span>Trang chủ</span>
          </button>
          <ChevronRight size={16} className="separator" />
          <button type="button" onClick={() => navigate("/services")}>
            Dịch vụ
          </button>
          <ChevronRight size={16} className="separator" />
          <span className="active">{service.category || "Chi tiết"}</span>
          <ChevronRight size={16} className="separator" />
          <span className="active">{service.name}</span>
        </nav>

        <section className="page-shell detail-container">
          <div className="detail-media-panel">
            <div className="detail-main-stage surface-card">
              <img
                src={galleryImages[Math.min(imgIdx, galleryImages.length - 1)]}
                alt={service.name}
                onError={() => setImgIdx((prev) => Math.min(prev + 1, galleryImages.length - 1))}
              />
            </div>

            {galleryImages.length > 1 && (
              <div className="detail-gallery-track">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={imgIdx === index ? "track-thumb active" : "track-thumb"}
                    onClick={() => setImgIdx(index)}
                  >
                    <img src={image} alt={`${service.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="detail-content-panel">
            <header className="detail-header">
              <div className="detail-badge-row">
                <span className="status-badge">
                  <span className="dot" />
                  Sẵn sàng phục vụ
                </span>
                <span className="premium-badge">
                  <Sparkles size={14} />
                  Premium Service
                </span>
              </div>
              <h1>{service.name}</h1>
            </header>

            <div className="detail-pricing-box surface-card">
              <div className="pricing-content">
                <span className="pricing-label">Chi phí trọn gói</span>
                <div className="price-display">
                  <strong>{Number(service.price || 0).toLocaleString()} <span>đ</span></strong>
                </div>
                <p>Giá đã bao gồm tư vấn kỹ thuật và kiểm tra tổng quát xe.</p>
              </div>
              <button
                type="button"
                className="action-prime"
                onClick={() => navigate(`/booking?service_id=${service.id}`)}
              >
                <span>Đặt lịch ngay</span>
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="detail-meta-grid">
              {summaryFacts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="meta-card surface-card">
                  <Icon size={18} className="meta-icon" />
                  <div className="meta-body">
                    <span className="meta-label">{label}</span>
                    <strong className="meta-value">{value}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="detail-secondary-actions">
              <button type="button" className="btn-ghost" onClick={handleShare}>
                <Share2 size={18} />
                <span>Chia sẻ</span>
              </button>
              <button type="button" className="btn-ghost" onClick={() => navigate("/services")}>
                <ArrowLeft size={18} />
                <span>Xem dịch vụ khác</span>
              </button>
            </div>
          </div>
        </section>

        <section className="page-shell detail-extended-info">
          <div className="detail-grid-layout">
            <article className="info-block surface-card">
              <h3>Toàn bộ quy trình</h3>
              <div className="description-rich-text">
                <p>
                  {service.description || "Dịch vụ được thực hiện bởi đội ngũ kỹ thuật viên giàu kinh nghiệm, sử dụng các thiết bị định vị và hóa chất chăm sóc xe đạt tiêu chuẩn quốc tế."}
                </p>
              </div>
            </article>

            <article className="info-block info-dark surface-card">
              <h3>Cam kết từ CarCareHome</h3>
              <div className="commitment-list">
                <div className="commitment-item">
                  <ShieldCheck size={20} />
                  <div>
                    <strong>Minh bạch chi phí</strong>
                    <p>Mọi khoản thanh toán đều được hiển thị rõ ràng trong tài khoản của bạn.</p>
                  </div>
                </div>
                <div className="commitment-item">
                  <Sparkles size={20} />
                  <div>
                    <strong>Chất lượng 5 sao</strong>
                    <p>Quy trình đạt chuẩn, đảm bảo tính thẩm mỹ và độ bền cho chiếc xe.</p>
                  </div>
                </div>
                <div className="commitment-item">
                  <Timer size={20} />
                  <div>
                    <strong>Phục vụ nhanh chóng</strong>
                    <p>Luôn đúng giờ và hoàn thiện công việc theo đúng cam kết thời gian.</p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
  );
}

export default ServiceDetail;