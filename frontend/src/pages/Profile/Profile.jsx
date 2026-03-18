import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateProfile, getProfile } from "@/services/api";
import FormInput from "@/components/common/FormInput/FormInput";
import "./Profile.css";

const Profile = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    birthday: ""
  });
  const [loading, setLoading] = useState(false);
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
            address: data.address || "",
            birthday: data.birthday || ""
          });
        }
      } catch (err) {
        // If API fails, fall back to Context data
        if (user) {
          setFormData(prev => ({
            ...prev,
            name: user.name || "",
            email: user.email || ""
          }));
        }
      }
    };
    loadProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await updateProfile(formData);
      if (result) {
        // Update local context
        login({ ...user, ...result }, localStorage.getItem("token"));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError("Cập nhật thông tin thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-container">
        
        {/* Sidebar */}
        <div className="profile-sidebar">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-big">
              {formData.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase()}
            </div>
            <label className="avatar-edit-btn" htmlFor="avatar-upload">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </label>
            <input type="file" id="avatar-upload" hidden accept="image/*" />
          </div>
          
          <h2>{formData.name || "Người dùng"}</h2>
          <p className="user-email">{formData.email}</p>
          <span className="profile-badge">{user?.role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Khách hàng Tin cậy'}</span>
        </div>

        {/* Main Content */}
        <div className="profile-main">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
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
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              required
            />

            <FormInput 
              label="Số điện thoại"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="VD: 0912 345 678"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
            />

            <div className="form-full-width">
              <FormInput 
                label="Địa chỉ email (Không thể thay đổi)"
                name="email"
                value={formData.email}
                disabled
                placeholder="email@example.com"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
              />
            </div>

            <div className="form-full-width">
              <FormInput 
                label="Địa chỉ hiện tại"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="VD: 123 Đường ABC, Quận X, TP. Y"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
              />
            </div>

            <FormInput 
              label="Ngày sinh"
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            />

            <div className="profile-actions form-full-width">
              <button type="button" className="btn-profile-cancel" onClick={() => window.history.back()}>
                Hủy bỏ
              </button>
              <button type="submit" className="btn-profile-save" disabled={loading}>
                {loading ? <span className="spinner"></span> : (
                  <>
                    Lưu thông tin
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {success && (
        <div className="toast">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          Cập nhật hồ sơ thành công!
        </div>
      )}
    </div>
  );
};

export default Profile;
