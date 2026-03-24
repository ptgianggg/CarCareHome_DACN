import { useEffect, useMemo, useState } from "react";
import { Camera, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getProfile, updateProfile, uploadAvatar } from "@/services/api";
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
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        if (data) {
          setFormData({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            avatar: data.avatar || ""
          });
        }
      } catch {
        if (user) {
          setFormData((prev) => ({
            ...prev,
            name: user.name || "",
            email: user.email || ""
          }));
        }
      }
    };

    loadProfile();
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
          <h1>Giữ thông tin hồ sơ rõ ràng để các bước đặt lịch và xác nhận diễn ra mượt hơn.</h1>
          <p>Cập nhật tên, số điện thoại và ảnh đại diện để đội ngũ hỗ trợ nhận đúng người, đúng lịch và đúng ngữ cảnh.</p>
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

            <div className="profile-meta-list">
              <div className="profile-meta-item">
                <UserRound size={16} />
                <span>Hồ sơ được dùng để đồng bộ lịch hẹn và xác nhận thanh toán.</span>
              </div>
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
                <h2>Chỉnh sửa hồ sơ</h2>
                <p>Thay đổi ở đây sẽ được dùng cho các màn booking, lịch hẹn và khu vực tài khoản.</p>
              </div>
              <div className="profile-assurance">
                <ShieldCheck size={18} />
                <span>Dữ liệu được dùng để hiển thị trải nghiệm cá nhân hóa trong ứng dụng.</span>
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