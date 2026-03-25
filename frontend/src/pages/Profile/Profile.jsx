import { useEffect, useMemo, useState } from "react";
import { Camera, Mail, Phone, ShieldCheck, UserRound, Star, Trophy, Target, Coins } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getProfile, updateProfile, uploadAvatar, getProfilePerformance } from "@/services/api";
import FormInput from "@/components/common/FormInput/FormInput";
import "./Profile.css";

const Profile = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: ""
  });
  const [performance, setPerformance] = useState(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, perfData] = await Promise.all([
          getProfile(),
          (user?.role === "STAFF" || user?.role === "ROLE_STAFF") ? getProfilePerformance() : Promise.resolve(null)
        ]);
        
        if (profileData) {
          setFormData({
            name: profileData.name || "",
            email: profileData.email || "",
            phone: profileData.phone || "",
            avatar: profileData.avatar || ""
          });
          setPoints(profileData.points || 0);
        }
        
        if (perfData) {
          setPerformance(perfData);
        }
      } catch (err) {
        console.error("Load profile data failed:", err);
      }
    };

    loadData();
  }, [user]);

  const roleLabel = useMemo(() => {
    if (user?.role === "ROLE_ADMIN" || user?.role === "ADMIN") return "Quản trị viên";
    if (user?.role === "ROLE_STAFF" || user?.role === "STAFF") return "Kỹ thuật viên";
    return "Khách hàng";
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const result = await uploadAvatar(file);
      if (result?.avatar) {
        setFormData((prev) => ({ ...prev, avatar: result.avatar }));
        login({ ...user, avatar: result.avatar }, localStorage.getItem("token"));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch {
      setError("Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await updateProfile(formData);
      if (result) {
        login({ ...user, ...result }, localStorage.getItem("token"));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("Cập nhật thông tin thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8089/api";
  const serverBase = apiBaseUrl.endsWith("/api") ? apiBaseUrl.replace("/api", "") : apiBaseUrl.replace("/api/", "");
  const avatarUrl = formData.avatar ? (formData.avatar.startsWith("http") ? formData.avatar : `${serverBase}${formData.avatar}`) : null;
  const userInitial = formData.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || "C";

  return (
    <div className="profile-page-shell">
      <section className="profile-hero page-shell">
        <div className="profile-hero-copy">
          <span className="tag-eyebrow">Tài khoản cá nhân</span>
          
          
        </div>
      </section>

      <section className="profile-wrapper page-shell">
        <div className="profile-container">
          <aside className="profile-sidebar surface-card">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-big">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="avatar-img"
                    onError={(event) => {
                      event.target.style.display = "none";
                      event.target.parentElement.textContent = userInitial;
                    }}
                  />
                ) : (
                  userInitial
                )}
              </div>
              {uploading && <div className="avatar-loading"><span className="spinner-small" /></div>}
              <label className="avatar-edit-btn" htmlFor="avatar-upload">
                <Camera size={18} />
              </label>
              <input type="file" id="avatar-upload" hidden accept="image/*" onChange={handleAvatarChange} disabled={uploading} />
            </div>

            <h2>{formData.name || "Người dùng CarCareHome"}</h2>
            <p className="user-email">{formData.email || "Chưa có email"}</p>
            <span className="profile-badge">{roleLabel}</span>

            {performance && (
              <div className="staff-performance-card surface-card">
                  <div className="perf-item">
                    <div className="perf-icon gold"><Trophy size={16} /></div>
                    <div className="perf-body">
                      <span>Điểm đánh giá</span>
                      <div className="perf-val-row">
                        <strong>{performance.averageRating?.toFixed(1) || "0.0"}</strong>
                        <div className="perf-stars">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              fill={i < Math.round(performance.averageRating || 0) ? "#fbbf24" : "none"} 
                              stroke={i < Math.round(performance.averageRating || 0) ? "#fbbf24" : "rgba(255,255,255,0.2)"} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="perf-item">
                    <div className="perf-icon blue"><Target size={16} /></div>
                    <div className="perf-body">
                      <span>Tổng lượt phục vụ</span>
                      <strong>{performance.totalJobs || 0} đơn</strong>
                    </div>
                  </div>
              </div>
            )}

            {/* Loyalty Points for Customers */}
            {(!performance && (user?.role === "USER" || user?.role === "ROLE_USER" || user?.role === "ADMIN" || user?.role === "ROLE_ADMIN")) && (
              <div className="staff-performance-card surface-card loyalty-card">
                  <div className="perf-item">
                    <div className="perf-icon yellow"><Coins size={16} /></div>
                    <div className="perf-body">
                      <span>Điểm tích lũy</span>
                      <strong>{points} điểm</strong>
                    </div>
                  </div>
              </div>
            )}

            <div className="profile-meta-list">
              
              <div className="profile-meta-item">
                <Phone size={16} />
                <span>{formData.phone || "Thêm số điện thoại để đội ngũ hỗ trợ liên hệ dễ hơn."}</span>
              </div>
              <div className="profile-meta-item">
                <Mail size={16} />
                <span>{formData.email || "Email chưa sẵn sàng"}</span>
              </div>
            </div>
          </aside>

          <div className="profile-main surface-card">
            <div className="profile-main-head">
              <div>
                <span className="tag-eyebrow">Thông tin cơ bản</span>
                
              </div>
             
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form className="profile-form" onSubmit={handleSubmit}>
              <FormInput
                label="Họ và tên"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ví dụ: Nguyễn Văn A"
                icon={<UserRound size={18} />}
                required
              />

              <FormInput
                label="Số điện thoại"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ví dụ: 0912 345 678"
                icon={<Phone size={18} />}
              />

              <div className="form-full-width">
                <FormInput
                  label="Email đăng nhập"
                  name="email"
                  value={formData.email}
                  disabled
                  placeholder="email@example.com"
                  icon={<Mail size={18} />}
                />
              </div>

              <div className="profile-actions form-full-width">
                <button type="button" className="btn-profile-cancel" onClick={() => window.history.back()}>
                  Quay lại
                </button>
                <button type="submit" className="btn-profile-save" disabled={loading}>
                  {loading ? <span className="spinner" /> : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {success && (
        <div className="toast">
          <ShieldCheck size={18} />
          Cập nhật hồ sơ thành công.
        </div>
      )}
    </div>
  );
};

export default Profile;