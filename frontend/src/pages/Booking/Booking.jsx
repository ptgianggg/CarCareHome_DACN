import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createBooking, getServices, getCategories } from "../../services/api";
import "./style.css";
const initialForm = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  vehicleType: "",
  vehiclePlate: "",
  serviceType: "",
  bookingDate: "",
  bookingTime: "",
  addressName: "",
  note: "",
  status: "PENDING",
  totalPrice: "",
  depositAmount: "",
};
const Booking = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("service_id");
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [loadingService, setLoadingService] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [allServices, setAllServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState(new Set());
  const [currentCategoryView, setCurrentCategoryView] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoadingService(true);
      try {
        const [servs, cats] = await Promise.all([getServices(), getCategories()]);
        
        const activeServices = Array.isArray(servs) ? servs.filter(s => s.active !== false) : [];
        setAllServices(activeServices);
        setCategories(Array.isArray(cats) ? cats : []);

        // Auto-select the requested service from URL
        if (serviceId) {
          const initialSet = new Set();
          initialSet.add(Number(serviceId));
          setSelectedServiceIds(initialSet);

          // Find service's category and view it
          const svc = activeServices.find(s => s.id === Number(serviceId));
          if (svc && svc.category) {
            setCurrentCategoryView(svc.category);
          } else if (cats.length > 0) {
            setCurrentCategoryView(cats[0].name);
          }
        } else if (Array.isArray(cats) && cats.length > 0) {
          setCurrentCategoryView(cats[0].name);
        }
      } catch (error) {
        console.error("Load data for booking failed:", error);
      } finally {
        setLoadingService(false);
      }
    };
loadData();
  }, [serviceId]);

  const handleServiceToggle = (id) => {
    setSelectedServiceIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Derived state for selected services
  const selectedServices = useMemo(() => {
    return allServices.filter(s => selectedServiceIds.has(s.id));
  }, [allServices, selectedServiceIds]);

  // Update form totalPrice and serviceType when selection changes
  useEffect(() => {
    const total = selectedServices.reduce((sum, s) => sum + Number(s.price || 0), 0);
    const serviceNames = selectedServices.map(s => s.name).join(", ");
    
    setForm(prev => ({
      ...prev,
      serviceType: serviceNames,
      totalPrice: total > 0 ? String(total) : ""
    }));
  }, [selectedServices]);

  const hierarchicalServices = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      services: allServices.filter(s => s.category === cat.name)
    })).filter(cat => cat.services.length > 0);
  }, [allServices, categories]);

  const canSubmit = useMemo(() => {
    return (
      form.customerName.trim() &&
      form.customerPhone.trim() &&
      form.vehicleType.trim() &&
      form.vehiclePlate.trim() &&
      form.serviceType.trim() &&
      form.bookingDate &&
      form.bookingTime &&
      form.addressName.trim() &&
      form.totalPrice !== "" &&
      Number(form.totalPrice) >= 0 &&
      form.depositAmount !== "" &&
      Number(form.depositAmount) >= 0 &&
      Number(form.depositAmount) <= Number(form.totalPrice) * 0.5
    );
  }, [form]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) {
      alert("Vui lòng nh?p d?y d? thông tin b?t bu?c. Ti?n c?c t?i da 50% t?ng ti?n.");
      return;
    }
const payload = {
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      customerEmail: form.customerEmail.trim() || null,
      vehicleType: form.vehicleType.trim(),
      vehiclePlate: form.vehiclePlate.trim(),
      serviceType: form.serviceType.trim(),
      bookingDate: form.bookingDate,
      bookingTime: form.bookingTime,
      addressName: form.addressName.trim(),
      note: form.note.trim() || null,
      status: form.status || "PENDING",
      totalPrice: Number(form.totalPrice),
      depositAmount: Number(form.depositAmount),
    };

    setSaving(true);
    try {
      const result = await createBooking(payload);
      if (result?.error) {
        alert(result.message || "Không th? t?o l?ch h?n");
        return;
      }
      alert("Ð?t l?ch thành công");
      navigate("/admin/booking");
    } catch (error) {
      console.error("Create booking failed:", error);
      alert("Có l?i x?y ra khi t?o l?ch h?n");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="booking-page-container">

      <div className="container" style={{ minHeight: "70vh", padding: "40px 20px" }}>
        <div className="booking-card">
          <h1>Ð?t l?ch d?ch v?</h1>
          {loadingService && <p>Đang tải danh sách dịch vụ...</p>}

          <form className="booking-form-modern" onSubmit={onSubmit}>
            {/* Section 1: Thông tin khách hàng */}
            <div className="booking-section">
              <h3 className="section-title">1. Thông tin khách hàng</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input name="customerName" value={form.customerName} onChange={onChange} placeholder="Nhập họ và tên" required />
                </div>
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input name="customerPhone" value={form.customerPhone} onChange={onChange} placeholder="Nhập số điện thoại" required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input name="customerEmail" type="email" value={form.customerEmail} onChange={onChange} placeholder="Nhập email (không bắt buộc)" />
                </div>
              </div>
            </div>

            {/* Section 2: Thông tin xe */}
            <div className="booking-section">
              <h3 className="section-title">2. Thông tin xe</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Loại xe *</label>
                  <input name="vehicleType" value={form.vehicleType} onChange={onChange} placeholder="Ví dụ: Sedan 4 chỗ" required />
                </div>
                <div className="form-group">
                  <label>Biển số xe *</label>
                  <input name="vehiclePlate" value={form.vehiclePlate} onChange={onChange} placeholder="Ví dụ: 51G-12345" required />
                </div>
              </div>
            </div>

            {/* Section 3: Chọn dịch vụ */}
            <div className="booking-section">
              <h3 className="section-title">3. Dịch vụ chăm sóc xe</h3>
              <p className="section-desc">Chọn nhóm dịch vụ và tích chọn các dịch vụ bạn cần.</p>
              
              <div className="category-selection-wrapper">
                <label className="filter-label">Chọn nhóm dịch vụ:</label>
                <div className="category-dropdown-custom">
                  <select 
                    value={currentCategoryView} 
                    onChange={(e) => setCurrentCategoryView(e.target.value)}
                    className="cat-select-box"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="multi-service-container compact">
                {hierarchicalServices.filter(group => group.name === currentCategoryView).map(group => (
                  <div key={group.id} className="svc-category-block-simple">
                    <div className="svc-items-grid visible">
                      {group.services.map(service => (
                        <div 
                          key={service.id} 
                          className={`svc-item-card ${selectedServiceIds.has(service.id) ? 'selected' : ''}`}
                          onClick={() => handleServiceToggle(service.id)}
                        >
                          <div className="svc-check">
                            <input 
                              type="checkbox" 
                              checked={selectedServiceIds.has(service.id)}
                              readOnly 
                            />
                          </div>
                          <div className="svc-info">
                            <span className="svc-title">{service.name}</span>
                            <span className="svc-price">{Number(service.price || 0).toLocaleString()} đ</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedServices.length > 0 && (
                <div className="selected-services-summary">
                  <span className="summary-label">Dịch vụ đã chọn ({selectedServices.length}):</span>
                  <div className="summary-tags">
                    {selectedServices.map(s => (
                      <span key={s.id} className="svc-tag">
                        {s.name} 
                        <button type="button" onClick={() => handleServiceToggle(s.id)} className="remove-tag">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Thời gian & Địa điểm */}
            <div className="booking-section">
              <h3 className="section-title">4. Thời gian & Địa điểm</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Ngày hẹn *</label>
                  <input name="bookingDate" type="date" value={form.bookingDate} onChange={onChange} required />
                </div>
                <div className="form-group">
                  <label>Giờ hẹn *</label>
                  <input name="bookingTime" type="time" value={form.bookingTime} onChange={onChange} required />
                </div>
                <div className="form-group full-width">
                  <label>Địa điểm làm việc *</label>
                  <input name="addressName" value={form.addressName} onChange={onChange} placeholder="Nhập địa chỉ của bạn" required />
                </div>
                <div className="form-group full-width">
                  <label>Ghi chú thêm</label>
                  <textarea name="note" value={form.note} onChange={onChange} placeholder="Yêu cầu đặc biệt cho kỹ thuật viên..." rows={2} />
                </div>
              </div>
            </div>

            {/* Section 5: Thanh toán */}
            <div className="booking-section payment-section">
              <h3 className="section-title">5. Tạm tính & Đặt cọc</h3>
              <div className="payment-summary">
                <div className="summary-row">
                  <span>Tổng tiền dịch vụ:</span>
                  <span className="amount">{Number(form.totalPrice || 0).toLocaleString()} đ</span>
                </div>
                <div className="summary-row deposit-row">
                  <div className="deposit-input-wrap">
                    <label>Số tiền đặt cọc (VNĐ):</label>
                    <input
                      name="depositAmount"
                      type="number"
                      min="0"
                      step="1000"
                      max={form.totalPrice ? Math.floor(Number(form.totalPrice) * 0.5) : undefined}
                      value={form.depositAmount}
                      onChange={onChange}
                      placeholder="Tối đa 50%"
                      required
                    />
                  </div>
                  <div className="deposit-hint">
                    Tối đa: {Math.floor(Number(form.totalPrice || 0) * 0.5).toLocaleString()} đ
                  </div>
                </div>
                
                {form.depositAmount !== "" && form.totalPrice !== "" && Number(form.depositAmount) > Number(form.totalPrice) * 0.5 && (
                  <div className="error-msg">Tiền cọc không được vượt quá 50% tổng tiền.</div>
                )}
              </div>
            </div>

            <div className="booking-actions">
              <button
                className="booking-submit-btn"
                type="submit"
                disabled={saving || loadingService || !canSubmit}
              >
                {saving ? (
                  <><span className="spinner"></span> Đang xử lý...</>
                ) : (
                  "Xác nhận đặt lịch ngay"
                )}
              </button>
              <p className="submit-note">Bằng cách nhấn xác nhận, bạn đồng ý với các điều khoản dịch vụ của chúng tôi.</p>
            </div>
          </form>

          <div className="booking-footer-links">
            <button onClick={() => navigate("/services")} className="back-link">
              ← Quay lại danh sách dịch vụ
            </button>
          </div>
        </div>
      </div>
      </div>
  );
};

export default Booking;

