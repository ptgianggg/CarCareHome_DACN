import { useNavigate } from "react-router-dom";

import defaultBannerImg from "@/assets/banner.png";
import { useSystem } from "@/context/SystemContext";

import "./Home.css";

function Home() {
  const { settings } = useSystem();
  const navigate = useNavigate();

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:8080";

  const getImageUrl = (url) => {
    if (!url) return defaultBannerImg;
    if (url.startsWith("http")) return url;
    return `${apiBaseUrl}${url}`;
  };

  const bannerImg = getImageUrl(settings?.bannerUrl);

  return (
    <div className="home-wrapper">
      <section className="hero-section">
        <div className="hero-container">
          <img src={bannerImg} alt="Car Care Banner" className="hero-banner-img" />
          <div className="hero-overlay">
            <div className="hero-text-content">
              {settings?.bannerTitle && <h1>{settings.bannerTitle}</h1>}
              {settings?.bannerSubtitle && <p>{settings.bannerSubtitle}</p>}

              <button
                className="banner-cta-btn"
                onClick={() => navigate(settings?.bannerButtonLink || "/booking")}
              >
                <span>{settings?.bannerButtonText || "Đặt lịch ngay"}</span>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14m-7-7 7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
