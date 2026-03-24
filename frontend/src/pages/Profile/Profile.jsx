import { useEffect, useState } from "react";

import FormInput from "@/components/common/FormInput/FormInput";
import { useAuth } from "@/context/AuthContext";
import { getProfile, updateProfile, uploadAvatar } from "@/services/api";

import "./Profile.css";

const Profile = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        if (data && !data.error) {
          setFormData({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            avatar: data.avatar || "",
          });
        }
      } catch {
        if (user) {
          setFormData((prev) => ({
            ...prev,
            name: user.name || "",
            email: user.email || "",
          }));
        }
      }
    };

    loadProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const result = await uploadAvatar(file);
      if (result?.error) {
        throw new Error(result.message);
      }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await updateProfile(formData);
      if (result?.error) {
        throw new Error(result.message);
      }

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

  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  const serverBase = apiBaseUrl.endsWith("/api")
    ? apiBaseUrl.replace("/api", "")
    : apiBaseUrl.replace("/api/", "");

  const avatarUrl = formData.avatar
    ? formData.avatar.startsWith("http")
      ? formData.avatar
      : `${serverBase}${formData.avatar}`
    : null;

  const roleLabel =
    user?.role === "ROLE_ADMIN" || user?.role === "ADMIN"
      ? "Quản trị viên"
      : user?.role === "ROLE_STAFF" || user?.role === "STAFF"
        ? "Nhân viên kỹ thuật"
        : "Khách hàng tin cậy";

  return (
    <div className="profile-wrapper">
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-big">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="avatar-img"
                  onError={(e) => {
                    e.target.style.display = "none";
                    const initial =
                      formData.name?.charAt(0).toUpperCase() ||
                      user?.name?.charAt(0).toUpperCase();
                    e.target.parentElement.textContent = initial;
                  }}
                />
              ) : (
                formData.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            {uploading && (
              <div className="avatar-loading">
                <span className="spinner-small" />
              </div>
            )}
            <label className="avatar-edit-btn" htmlFor="avatar-upload">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </label>
            <input
              type="file"
              id="avatar-upload"
              hidden
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={uploading}
            />
          </div>

          <h2>{formData.name || "Người dùng"}</h2>
          <p className="user-email">{formData.email}</p>
          <span className="profile-badge">{roleLabel}</span>
        </div>

        <div className="profile-main">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Thông tin cá nhân
          </h3>

          {error && <div className="auth-error">{error}</div>}

          <form className="profile-form" onSubmit={handleSubmit}>
            <FormInput
              label="Họ và tên"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Nguyễn Văn A"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
              required
            />

            <FormInput
              label="Số điện thoại"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="VD: 0912 345 678"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              }
            />

            <div className="form-full-width">
              <FormInput
                label="Địa chỉ email (Không thể thay đổi)"
                name="email"
                value={formData.email}
                disabled
                placeholder="email@example.com"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                }
              />
            </div>

            <div className="profile-actions form-full-width">
              <button type="button" className="btn-profile-cancel" onClick={() => window.history.back()}>
                Hủy bỏ
              </button>
              <button type="submit" className="btn-profile-save" disabled={loading}>
                {loading ? (
                  <span className="spinner" />
                ) : (
                  <>
                    Lưu thông tin
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {success && (
        <div className="toast">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Cập nhật hồ sơ thành công!
        </div>
      )}
    </div>
  );
};

export default Profile;
