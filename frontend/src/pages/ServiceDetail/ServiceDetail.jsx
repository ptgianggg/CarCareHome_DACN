import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin, Share2, ShieldCheck, Sparkles, Timer } from "lucide-react";
import toast from "react-hot-toast";
import { getServiceById } from "@/services/api";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
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
      ignore = true;
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
      },
      {
        icon: MapPin,
        label: "Khu vực phục vụ",
        value: service.storeAddress || "Theo địa chỉ bạn đặt lịch"
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
      <div className="service-detail-page">
        <Header />
        <main className="detail-state-shell">
          <div className="detail-state-card surface-card">
            <div className="spinner-heavy" />
            <p>Đang tải chi tiết dịch vụ...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="service-detail-page">
        <Header />
        <main className="detail-state-shell">
          <div className="detail-state-card surface-card">
            <h2>Không tìm thấy dịch vụ này</h2>
            <p>Dịch vụ có thể đã bị ẩn hoặc đường dẫn không còn hợp lệ.</p>
            <button type="button" className="detail-primary-btn" onClick={() => navigate("/services")}>Quay lại bảng dịch vụ</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="service-detail-page">
      <Header />

      <main className="detail-page-shell">
        <section className="detail-page-container">
          <div className="detail-gallery-panel surface-card">
            <div className="detail-gallery-main">
              <img
                src={galleryImages[Math.min(imgIdx, galleryImages.length - 1)]}
                alt={service.name}
                onError={() => setImgIdx((prev) => Math.min(prev + 1, galleryImages.length - 1))}
              />
            </div>

            {galleryImages.length > 1 && (
              <div className="detail-thumbnail-row">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={imgIdx === index ? "detail-thumb active" : "detail-thumb"}
                    onClick={() => setImgIdx(index)}
                  >
                    <img src={image} alt={`${service.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="detail-info-panel">
            <nav className="detail-breadcrumb">
              <button type="button" onClick={() => navigate("/")}>Trang chủ</button>
              <span>/</span>
              <button type="button" onClick={() => navigate("/services")}>Dịch vụ</button>
              <span>/</span>
              <strong>{service.category || "Chi tiết"}</strong>
            </nav>

            <div className="detail-heading-block">
              <span className="tag-eyebrow">Đang nhận lịch</span>
              <h1>{service.name}</h1>
              <p>
                {service.description ||
                  "Mô tả dịch vụ đã được làm gọn để khách hàng nắm nhanh giá trị chính trước khi đi đến bước đặt lịch hoặc chia sẻ cho người khác."}
              </p>
            </div>

            <div className="detail-price-line">
              <strong>{Number(service.price || 0).toLocaleString()} đ</strong>
              <span>Giá hiển thị trước phí di chuyển và các lựa chọn mở rộng nếu có.</span>
            </div>

            <div className="detail-action-row">
              <button type="button" className="detail-primary-btn" onClick={() => navigate(`/booking?service_id=${service.id}`)}>
                Đặt lịch ngay
                <ArrowRight size={18} />
              </button>
              <button type="button" className="detail-secondary-btn" onClick={handleShare}>
                <Share2 size={18} />
                Chia sẻ dịch vụ
              </button>
              <button type="button" className="detail-tertiary-btn" onClick={() => navigate("/services")}>
                <ArrowLeft size={18} />
                Quay lại danh sách
              </button>
            </div>

            <div className="detail-fact-grid">
              {summaryFacts.map(({ icon: Icon, label, value }) => (
                <article key={label} className="surface-card detail-fact-card">
                  <span className="detail-fact-icon">
                    <Icon size={18} />
                  </span>
                  <div>
                    <p>{label}</p>
                    <strong>{value}</strong>
                  </div>
                </article>
              ))}
            </div>

            <div className="detail-content-grid">
              <article className="surface-card detail-description-card">
                <h2>Mô tả dịch vụ</h2>
                <p>{service.description || "Dịch vụ hiện chưa có mô tả chi tiết, nhưng bạn vẫn có thể đặt lịch để được tư vấn thêm theo nhu cầu thực tế của xe."}</p>
              </article>

              <article className="surface-card detail-support-card">
                <h2>Cam kết trải nghiệm</h2>
                <div className="support-list">
                  <div className="support-item">
                    <ShieldCheck size={18} />
                    <span>Luồng đặt lịch, cọc và theo dõi trạng thái được hiển thị trong cùng tài khoản.</span>
                  </div>
                  <div className="support-item">
                    <Sparkles size={18} />
                    <span>Thiết kế ưu tiên quyết định nhanh: xem chi tiết, chia sẻ và đặt lịch đều nằm ở vùng dễ thấy.</span>
                  </div>
                  <div className="support-item">
                    <Timer size={18} />
                    <span>Bố cục tối ưu cho mobile nên khách hàng quay lại từ MoMo hay link chia sẻ vẫn dễ tiếp tục thao tác.</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default ServiceDetail;