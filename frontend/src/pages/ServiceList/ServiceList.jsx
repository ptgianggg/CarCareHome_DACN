import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronRight, Home as HomeIcon, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { getCategories, getServices } from "@/services/api";
import "./style.css";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:8089/api").replace(/\/api\/?$/, "");
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1520340356584-f9d60d106df9?auto=format&fit=crop&q=80&w=800";

const normalizeText = (value) => String(value || "").toLowerCase();

function ServiceList() {
  const navigate = useNavigate();
  const { categoryName } = useParams();
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localImageMap, setLocalImageMap] = useState({});
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");

  const selectedCategory = categoryName ? decodeURIComponent(categoryName) : "";

  useEffect(() => {
    setSearchInput(searchParams.get("q") || "");
  }, [searchParams]);

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

    const loadData = async () => {
      try {
        const [categoryData, serviceData] = await Promise.all([getCategories(), getServices()]);
        if (ignore) {
          return;
        }

        setCategories(Array.isArray(categoryData) ? categoryData : []);
        setServices(Array.isArray(serviceData) ? serviceData.filter((item) => item.active !== false) : []);
      } catch (error) {
        console.error("Load service list failed:", error);
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

  const resolveImage = (service) => {
    const candidates = [];

    if (Array.isArray(service.imageUrls) && service.imageUrls.length > 0) {
      candidates.push(service.imageUrls[0]);
    }

    if (service.imageUrl) {
      candidates.push(service.imageUrl);
    }

    const localAsset = localImageMap[String(service.id)];
    if (localAsset) {
      const normalized = Array.isArray(localAsset) ? localAsset[0] : localAsset;
      candidates.push(normalized);
    }

    const firstValid = candidates.find(Boolean);
    if (!firstValid) {
      return FALLBACK_IMAGE;
    }

    if (String(firstValid).startsWith("data:") || String(firstValid).startsWith("http")) {
      return firstValid;
    }

    return `${API_ORIGIN}${String(firstValid).startsWith("/") ? "" : "/"}${firstValid}`;
  };

  const categoryOptions = useMemo(() => {
    return categories
      .map((category) => ({
        ...category,
        count: services.filter((service) => service.category === category.name).length
      }))
      .filter((category) => category.count > 0);
  }, [categories, services]);

  const groupedServices = useMemo(() => {
    const query = normalizeText(searchInput.trim());
    const groups = categoryOptions
      .map((category) => ({
        ...category,
        items: services.filter((service) => service.category === category.name)
      }))
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (selectedCategory && item.category !== selectedCategory) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [item.name, item.description, item.category].some((value) => normalizeText(value).includes(query));
        })
      }))
      .filter((group) => group.items.length > 0);

    if (!selectedCategory) {
      return groups;
    }

    return groups.filter((group) => group.name === selectedCategory);
  }, [categoryOptions, searchInput, selectedCategory, services]);

  const totalVisibleServices = useMemo(() => {
    return groupedServices.reduce((total, group) => total + group.items.length, 0);
  }, [groupedServices]);

  const pageTitle = selectedCategory
    ? selectedCategory
    : searchInput.trim()
      ? `Kết quả cho “${searchInput.trim()}”`
      : "Dịch vụ chăm sóc xe";

  const pageSubtitle = selectedCategory
   

  const buildPath = (category) => {
    const params = new URLSearchParams();
    if (searchInput.trim()) {
      params.set("q", searchInput.trim());
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    return category ? `/services/${encodeURIComponent(category)}${suffix}` : `/services${suffix}`;
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    navigate(buildPath(selectedCategory || ""));
  };

  const handleClearFilters = () => {
    setSearchInput("");
    navigate("/services");
  };

  if (loading) {
    return (
      <div className="service-list-page">
          <div className="loading-refined">
            <div className="spinner-heavy" />
            <p>Đang chuẩn bị danh sách dịch vụ phù hợp cho bạn...</p>
          </div>
      </div>
    );
  }

  return (
    <main className="service-page-shell">
        <nav className="service-breadcrumb page-shell">
          <button type="button" onClick={() => navigate("/")}>
            <HomeIcon size={16} />
            <span>Trang chủ</span>
          </button>
          <ChevronRight size={16} className="separator" />
          <button
            type="button"
            className={!selectedCategory ? "active" : ""}
            onClick={() => navigate("/services")}
          >
            Dịch vụ
          </button>
          {selectedCategory && (
            <>
              <ChevronRight size={16} className="separator" />
              <span className="active">{selectedCategory}</span>
            </>
          )}
        </nav>

        <section className="page-shell service-hero">
          <div className="service-hero-copy">
           
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>

          <div className="service-hero-stats surface-card">
            <div className="stat-item">
              <strong>{totalVisibleServices}</strong>
              <span>Dịch vụ phù hợp</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <strong>{categoryOptions.length}</strong>
              <span>Biến thể danh mục</span>
            </div>
          </div>
        </section>

        <section className="page-shell service-toolbar">
          <form className="service-search-bar surface-card" onSubmit={handleSearchSubmit}>
            <Search size={18} />
            <input
              type="search"
              value={searchInput}
              placeholder="Tìm theo tên dịch vụ hoặc tính năng..."
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button type="submit">Tìm kiếm</button>
          </form>

          <div className="service-filter-scroller">
            <button
              type="button"
              className={!selectedCategory ? "category-pill active" : "category-pill"}
              onClick={() => navigate(buildPath(""))}
            >
              Tất cả
            </button>
            {categoryOptions.map((category) => (
              <button
                key={category.id}
                type="button"
                className={selectedCategory === category.name ? "category-pill active" : "category-pill"}
                onClick={() => navigate(buildPath(category.name))}
              >
                {category.name}
                <span className="count">{category.count}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="page-shell service-results-zone">
          {groupedServices.length === 0 ? (
            <div className="surface-card empty-service-state">
              <Sparkles size={22} />
              <h2>Chưa có kết quả phù hợp</h2>
              <p>Hãy thử bỏ bớt từ khóa, đổi danh mục hoặc quay lại bảng dịch vụ đầy đủ để khám phá thêm.</p>
              <button type="button" onClick={handleClearFilters}>Xóa bộ lọc</button>
            </div>
          ) : (
            groupedServices.map((group) => (
              <section key={group.id || group.name} className="service-group-block">
                <header className="service-group-head">
                  <div>
                    <span className="tag-eyebrow">{group.items.length} dịch vụ đang mở</span>
                    <h2>{group.name}</h2>
                  </div>
                </header>

                <div className="service-card-grid">
                  {group.items.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      className="service-card"
                      onClick={() => navigate(`/services/detail/${service.id}`)}
                    >
                      <div className="service-card-image-wrap">
                        <img src={resolveImage(service)} alt={service.name} />
                        <div className="service-card-price">{Number(service.price || 0).toLocaleString()} đ</div>
                      </div>

                      <div className="service-card-body">
                        <div className="service-card-topline">
                          <span>{service.category || "Chăm sóc xe"}</span>
                          <span>Đang nhận lịch</span>
                        </div>
                        <h3>{service.name}</h3>
                        <p>{service.description || "Dịch vụ được mô tả ngắn gọn để người dùng đánh giá nhanh trước khi xem chi tiết."}</p>
                        <div className="service-card-footer">
                          <div className="service-card-chip">Tư vấn và xem chi tiết</div>
                          <ArrowRight size={18} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </section>
      </main>
    );
  }

export default ServiceList;