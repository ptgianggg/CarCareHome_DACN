import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Footer from "../../components/Footer/Footer";
import Header from "../../components/Header/Header";
import { getServiceById } from "../../services/api";

import "./style.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:8080";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1520340356584-f9d60d106df9?auto=format&fit=crop&q=80&w=1200";

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localImageMap, setLocalImageMap] = useState({});
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setImgIdx(0);
      try {
        const data = await getServiceById(id);
        setService(data);
      } catch (error) {
        console.error("Fetch service detail failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("service_local_images");
      setLocalImageMap(raw ? JSON.parse(raw) : {});
    } catch {
      setLocalImageMap({});
    }
  }, []);

  const imageCandidates = useMemo(() => {
    if (!service) return [FALLBACK_IMAGE];

    const rawImage = (localImageMap[String(service.id)] || service.imageUrl || "").trim();
    const paths = [];

    if (rawImage) {
      if (rawImage.startsWith("data:") || rawImage.startsWith("http")) {
        paths.push(rawImage);
      } else {
        const clean = rawImage.startsWith("/") ? rawImage : `/${rawImage}`;
        paths.push(`${API_BASE_URL}/uploads${clean}`);
        paths.push(`${API_BASE_URL}${clean}`);
        paths.push(`${API_BASE_URL}/images${clean}`);

        try {
          const filename = rawImage.split("/").pop();
          paths.push(new URL(`../../assets/images/${filename}`, import.meta.url).href);
        } catch (error) {
          console.debug("Local asset resolve failed", error);
        }
      }
    }

    paths.push(FALLBACK_IMAGE);
    return paths;
  }, [service, localImageMap]);

  if (loading) {
    return (
      <div className="service-detail-loading">
        <Header />
        <div className="loading-content">Đang tải chi tiết dịch vụ...</div>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="service-detail-error">
        <Header />
        <div className="error-content">
          <h2>Xin lỗi, không tìm thấy dịch vụ này!</h2>
          <button onClick={() => navigate("/services")}>Quay lại danh sách</button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="service-detail-page">
      <Header />

      <main className="detail-container">
        <div className="detail-grid">
          <div className="detail-visuals">
            <div className="main-image-wrap">
              <img
                src={imageCandidates[Math.min(imgIdx, imageCandidates.length - 1)]}
                alt={service.name}
                className="main-image"
                onError={() => setImgIdx((prev) => prev + 1)}
              />
              {service.discountPercentage > 0 && (
                <div className="discount-badge">-{service.discountPercentage}%</div>
              )}
            </div>
          </div>

          <div className="detail-info">
            <nav className="breadcrumb">
              <span onClick={() => navigate("/")}>Trang chủ</span>
              <span className="sep">/</span>
              <span onClick={() => navigate("/services")}>Dịch vụ</span>
              <span className="sep">/</span>
              <span className="active">{service.category}</span>
            </nav>

            <h1 className="service-title">{service.name}</h1>

            <div className="price-box">
              <div className="current-price">
                {Number(service.price || 0).toLocaleString()} <span className="currency">VNĐ</span>
              </div>
              {service.originalPrice > service.price && (
                <div className="original-price">
                  {Number(service.originalPrice).toLocaleString()} VNĐ
                </div>
              )}
            </div>

            <div className="store-info-box">
              <div className="info-item">
                <span className="label">Cửa hàng:</span>
                <span className="value">{service.storeName || "CarCareHome Center"}</span>
              </div>
              <div className="info-item">
                <span className="label">Địa chỉ:</span>
                <span className="value">
                  {service.storeAddress || "Liên hệ để biết thêm chi tiết"}
                </span>
              </div>
            </div>

            <div className="description-section">
              <h3>Mô tả dịch vụ</h3>
              <div className="desc-content">
                {service.description ||
                  "Dịch vụ chăm sóc xe chất lượng cao, sử dụng các thiết bị hiện đại và đội ngũ kỹ thuật viên giàu kinh nghiệm. Đảm bảo mang lại sự hài lòng và an tâm tuyệt đối cho xế cưng của bạn."}
              </div>
            </div>

            <div className="detail-actions">
              <button className="primary-book-btn" onClick={() => navigate(`/booking?service_id=${service.id}`)}>
                Đặt lịch ngay
              </button>
              <button className="secondary-share-btn">Chia sẻ dịch vụ</button>
            </div>

            <div className="guarantees">
              <div className="g-item">🛡️ Bảo hành chính hãng</div>
              <div className="g-item">⚡ Thi công nhanh chóng</div>
              <div className="g-item">💎 Uy tín và tận tâm</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ServiceDetail;
