import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createBooking, getServices, getCategories } from "../../services/api";
import { 
  Car, 
  Settings, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  MapPin, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  FileText
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import "./style.css";

const initialForm = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  bookingDate: "",
  bookingTime: "",
  addressName: "",
  note: "",
  status: "PENDING",
  depositAmount: "",
  distance: "",
};

const Booking = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("service_id");
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [loadingService, setLoadingService] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCalculatingDist, setIsCalculatingDist] = useState(false);
  
  const [allServices, setAllServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentCategoryView, setCurrentCategoryView] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  // Autofill if logged in
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        customerName: user.name || "",
        customerPhone: user.phone || "",
        customerEmail: user.email || ""
      }));
    }
  }, [user]);

  // Multiple Vehicles State
  const [vehicles, setVehicles] = useState([
    { id: 1, vehicleType: "", vehiclePlate: "", selectedServiceIds: new Set() }
  ]);
  const [activeVehicleIndex, setActiveVehicleIndex] = useState(0);

  // Vietnam Provinces API State
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [street, setStreet] = useState("");

  useEffect(() => {
    // Initial load: Categories, Services, and Provinces
    const loadProvinces = async () => {
      try {
        const res = await fetch("https://provinces.open-api.vn/api/p/");
        const data = await res.json();
        setProvinces(data);
      } catch (err) { console.error("Provinces fetch error:", err); }
    };

    const loadData = async () => {
      setLoadingService(true);
      try {
        const [servs, cats] = await Promise.all([getServices(), getCategories()]);
        
        const activeServices = Array.isArray(servs) ? servs.filter(s => s.active !== false) : [];
        setAllServices(activeServices);
        const filteredCats = Array.isArray(cats) ? cats : [];
        setCategories(filteredCats);

        if (serviceId) {
          // If coming from service detail, auto-select for the first vehicle
          setVehicles(prev => {
            const next = [...prev];
            const newSet = new Set();
            newSet.add(Number(serviceId));
            next[0] = { ...next[0], selectedServiceIds: newSet };
            return next;
          });

          const svc = activeServices.find(s => s.id === Number(serviceId));
          if (svc && svc.category) {
            setCurrentCategoryView(svc.category);
          } else if (filteredCats.length > 0) {
            setCurrentCategoryView(filteredCats[0].name);
          }
        } else if (filteredCats.length > 0) {
          setCurrentCategoryView(filteredCats[0].name);
        }
      } catch (error) {
        console.error("Load data for booking failed:", error);
      } finally {
        setLoadingService(false);
      }
    };
    loadData();
    loadProvinces();
  }, [serviceId]);

  // Fetch districts when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      return;
    }
    const loadDistricts = async () => {
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`);
        const data = await res.json();
        setDistricts(data.districts || []);
      } catch (err) { console.error("Districts fetch error:", err); }
    };
    loadDistricts();
  }, [selectedProvince]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      return;
    }
    const loadWards = async () => {
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`);
        const data = await res.json();
        setWards(data.wards || []);
      } catch (err) { console.error("Wards fetch error:", err); }
    };
    loadWards();
  }, [selectedDistrict]);

  // Sync addressName whenever any selection changes
  useEffect(() => {
    const p = provinces.find(x => String(x.code) === String(selectedProvince))?.name || "";
    const d = districts.find(x => String(x.code) === String(selectedDistrict))?.name || "";
    const w = wards.find(x => String(x.code) === String(selectedWard))?.name || "";
    
    const parts = [street, w, d, p].filter(Boolean);
    setForm(prev => ({ ...prev, addressName: parts.join(", ") }));
  }, [selectedProvince, selectedDistrict, selectedWard, street, provinces, districts, wards]);

  useEffect(() => {
    const calculateAuto = async () => {
      // Chỉ tính khi cả 3 trường Tỉnh, Huyện, Xã đều có dữ liệu
      if (!selectedProvince || !selectedDistrict || !selectedWard) {
        return;
      }
      
      setIsCalculatingDist(true);
      try {
        const origin = { lat: 10.8443, lon: 106.7845 }; // Quang Trung, Hiệp Phú, Thủ Đức
        
        const p = provinces.find(x => String(x.code) === String(selectedProvince))?.name || "";
        const d = districts.find(x => String(x.code) === String(selectedDistrict))?.name || "";
        const w = wards.find(x => String(x.code) === String(selectedWard))?.name || "";
        
        // Hàm xóa từ khóa hành chính Việt Nam để Nominatim dễ quét hơn
        const cleanName = (name) => {
          if (!name) return "";
          return name.replace(/^(Xã|Phường|Thị trấn|Huyện|Quận|Thành phố|Tỉnh)\s+/gi, '').trim();
        };

        const addressToSearchFull = [w, d, p].filter(Boolean).join(", ");
        const addressToSearchClean = [cleanName(w), cleanName(d), cleanName(p)].filter(Boolean).join(", ");
        const addressToSearchDistrict = [cleanName(d), cleanName(p)].filter(Boolean).join(", ");
        
        const geocodeAddress = async (address) => {
          try {
            // Đổi sang hệ thống vệ tinh ArcGIS: siêu mạnh, bao phủ 100% tiếng Việt, không bị giới hạn requests
            const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(address + ", Việt Nam")}&maxLocations=1`;
            const res = await fetch(url);
            const data = await res.json();
            if (data && data.candidates && data.candidates.length > 0) {
              const loc = data.candidates[0].location;
              return { lat: loc.y, lon: loc.x };
            }
            return null;
          } catch (e) {
             return null;
          }
        };

        // Thử tìm địa chỉ chính xác với tiền tố
        let dest = await geocodeAddress(addressToSearchFull);
        
        // Thử tìm địa chỉ đã loại bỏ "Xã, Huyện, Tỉnh" vì dữ liệu nước ngoài ưu tiên tên đường gọn hơn
        if (!dest) {
          dest = await geocodeAddress(addressToSearchClean);
        }
        
        // Thử chỉ tìm Huyện và Tỉnh làm trung tâm dự phòng
        if (!dest) {
          dest = await geocodeAddress(addressToSearchDistrict);
        }

        if (!dest) {
          setIsCalculatingDist(false);
          alert("Hệ thống bản đồ không thể nhận diện chính xác " + addressToSearchFull + ". Sẽ tạm áp dụng mốc 10km, nhân viên sẽ liên hệ lại xác nhận sau.");
          setForm(prev => ({ ...prev, distance: "10.0" }));
          return;
        }

        let finalDistance = null;

        try {
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${dest.lon},${dest.lat}?overview=false`;
          const osrmRes = await fetch(osrmUrl);
          const osrmData = await osrmRes.json();
          if (osrmData.code === "Ok" && osrmData.routes && osrmData.routes.length > 0) {
            finalDistance = (osrmData.routes[0].distance / 1000).toFixed(1);
          }
        } catch (err) {
          console.warn("OSRM error, falling back to Haversine:", err);
        }

        if (finalDistance === null) {
          const R = 6371;
          const dLat = (dest.lat - origin.lat) * (Math.PI / 180);
          const dLon = (dest.lon - origin.lon) * (Math.PI / 180);
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(origin.lat * (Math.PI / 180)) * Math.cos(dest.lat * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
          finalDistance = (R * c * 1.25).toFixed(1);
        }
        
        setForm(prev => ({ ...prev, distance: finalDistance }));
      } catch (error) {
        console.error("Auto calculation error:", error);
      } finally {
        setIsCalculatingDist(false);
      }
    };

    // Chạy khi người dùng dừng tương tác 1 giây để tránh gọi API liên tục
    const timeoutId = setTimeout(() => {
        calculateAuto();
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [selectedProvince, selectedDistrict, selectedWard, provinces, districts, wards]);

  const addVehicle = () => {
    setVehicles(prev => [
      ...prev,
      { id: Date.now(), vehicleType: "", vehiclePlate: "", selectedServiceIds: new Set() }
    ]);
    setActiveVehicleIndex(vehicles.length);
  };

  const removeVehicle = (idx) => {
    if (vehicles.length === 1) return;
    setVehicles(prev => prev.filter((_, i) => i !== idx));
    setActiveVehicleIndex(0);
  };

  const updateVehicleInfo = (idx, field, value) => {
    setVehicles(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleServiceToggle = (serviceId) => {
    setVehicles(prev => {
      const next = [...prev];
      const newSet = new Set(next[activeVehicleIndex].selectedServiceIds);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      next[activeVehicleIndex] = { ...next[activeVehicleIndex], selectedServiceIds: newSet };
      return next;
    });
  };

  const calculateTotalPrice = () => {
    return vehicles.reduce((total, v) => {
      const vTotal = Array.from(v.selectedServiceIds).reduce((sum, sId) => {
        const svc = allServices.find(s => s.id === sId);
        return sum + (svc ? Number(svc.price) : 0);
      }, 0);
      return total + vTotal;
    }, 0);
  };

  const serviceTotal = calculateTotalPrice();

  const calculateTravelFee = (price, distance) => {
    const dist = Number(distance) || 0;
    if (dist <= 0) return 0;
    
    // Free conditions
    if (price >= 10000000 && dist <= 50) return 0;
    if (price >= 5000000 && dist <= 30) return 0;
    if (price >= 500000 && dist <= 20) return 0;
    
    // Standard fee
    return dist * 5000;
  };

  const travelFee = calculateTravelFee(serviceTotal, form.distance);
  const totalPrice = serviceTotal + travelFee;

  const hierarchicalServices = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      services: allServices.filter(s => s.category === cat.name)
    })).filter(cat => cat.services.length > 0);
  }, [allServices, categories]);

  const isStep1Valid = vehicles.every(v => v.vehicleType.trim() && v.vehiclePlate.trim() && v.selectedServiceIds.size > 0);
  const isStep2Valid = form.customerName.trim() && form.customerPhone.trim();
  const isStep3Valid = form.bookingDate && form.bookingTime && form.addressName.trim() && form.depositAmount !== "" && Number(form.depositAmount) <= (totalPrice * 0.5) && form.distance !== "";

  const canSubmit = isStep1Valid && isStep2Valid && isStep3Valid;

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const onSubmit = async (event) => {
    if (event) event.preventDefault();

    if (!canSubmit) {
      alert("Vui lòng hoàn thành tất cả thông tin bắt buộc.");
      return;
    }

    // Format items for backend
    const items = vehicles.map(v => {
      const svcNames = Array.from(v.selectedServiceIds)
        .map(sId => allServices.find(s => s.id === sId)?.name)
        .join(", ");
      
      const vPrice = Array.from(v.selectedServiceIds)
        .reduce((sum, sId) => sum + Number(allServices.find(s => s.id === sId)?.price || 0), 0);
        
      return {
        vehicleType: v.vehicleType,
        vehiclePlate: v.vehiclePlate,
        serviceType: svcNames,
        price: vPrice
      };
    });

    const payload = {
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      customerEmail: form.customerEmail.trim() || null,
      bookingDate: form.bookingDate,
      bookingTime: form.bookingTime,
      addressName: form.addressName.trim(),
      note: form.note.trim() || null,
      status: "PENDING",
      totalPrice: totalPrice,
      depositAmount: Number(form.depositAmount),
      distance: Number(form.distance),
      travelFee: travelFee,
      items: items // New structure
    };

    setSaving(true);
    try {
      const result = await createBooking(payload);
      if (result?.error) {
        alert(result.message || "Không thể khởi tạo lịch hẹn");
        return;
      }
      alert("Chúc mừng! Đặt lịch cho " + vehicles.length + " xe đã được tiếp nhận thành công.");
      navigate("/admin/booking");
    } catch (error) {
      console.error("Create booking failed:", error);
      alert("Có lỗi kỹ thuật khi tạo lịch hẹn");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="booking-premium-container">
      <div className="booking-bg-glow"></div>
      
      <div className="booking-wrapper">
        <header className="booking-header">
          <div className="header-badge">LUXURY CARE SERVICE</div>
          <h1>Booking Experience</h1>
          <p>Dịch vụ chuyên biệt cho một hoặc nhiều xe của quý khách</p>
        </header>

        <div className="stepper-modern">
          <div className={`step ${currentStep >= 1 ? "active" : ""}`}>
            <div className="step-circle"><Settings size={18} /></div>
            <span>Dịch vụ & Xe</span>
          </div>
          <div className={`step-line ${currentStep >= 2 ? 'filled' : ''}`}></div>
          <div className={`step ${currentStep >= 2 ? "active" : ""}`}>
            <div className="step-circle"><User size={18} /></div>
            <span>Thông tin</span>
          </div>
          <div className={`step-line ${currentStep >= 3 ? 'filled' : ''}`}></div>
          <div className={currentStep >= 3 ? "step active" : "step"}>
            <div className="step-circle"><Calendar size={18} /></div>
            <span>Hoàn tất</span>
          </div>
        </div>

        <div className="booking-main-layout">
          <div className="booking-glass-card">
            <form>
              {currentStep === 1 && (
                <div className="step-content animate-fade-in">
                  <div className="vehicle-tabs-header">
                    <div className="vehicle-tabs">
                      {vehicles.map((v, i) => (
                        <button 
                          key={v.id} 
                          type="button" 
                          className={`v-tab ${activeVehicleIndex === i ? 'active' : ''}`}
                          onClick={() => setActiveVehicleIndex(i)}
                        >
                          <Car size={14} /> Xe {i + 1}
                          {vehicles.length > 1 && (
                            <span className="v-remove" onClick={(e) => { e.stopPropagation(); removeVehicle(i); }}>×</span>
                          )}
                        </button>
                      ))}
                      <button type="button" className="v-add-tab" onClick={addVehicle}>+ Thêm xe</button>
                    </div>
                  </div>

                  <h2 className="step-title">Gói dịch vụ cho Xe {activeVehicleIndex + 1}</h2>
                  
                  <div className="premium-form-grid">
                    <div className="input-group-premium">
                      <label><Car size={14} /> Loại xe</label>
                      <input 
                        value={vehicles[activeVehicleIndex].vehicleType} 
                        onChange={(e) => updateVehicleInfo(activeVehicleIndex, 'vehicleType', e.target.value)} 
                        placeholder="Ví dụ: Porsche / Sedan 4 chỗ" 
                        required 
                      />
                    </div>
                    <div className="input-group-premium">
                      <label><FileText size={14} /> Biển số</label>
                      <input 
                        value={vehicles[activeVehicleIndex].vehiclePlate} 
                        onChange={(e) => updateVehicleInfo(activeVehicleIndex, 'vehiclePlate', e.target.value)} 
                        placeholder="Ví dụ: 51G-123.45" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="service-selection-box">
                    <div className="service-category-tabs">
                      {categories.map(cat => (
                        <button 
                          key={cat.id} 
                          type="button"
                          className={currentCategoryView === cat.name ? "cat-tab active" : "cat-tab"}
                          onClick={() => setCurrentCategoryView(cat.name)}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>

                    <div className="service-grid-premium">
                      {hierarchicalServices.find(g => g.name === currentCategoryView)?.services.map(service => (
                        <div 
                          key={service.id} 
                          className={`service-card-premium ${vehicles[activeVehicleIndex].selectedServiceIds.has(service.id) ? 'selected' : ''}`}
                          onClick={() => handleServiceToggle(service.id)}
                        >
                          <div className="card-check">
                            {vehicles[activeVehicleIndex].selectedServiceIds.has(service.id) && <CheckCircle size={16} color="currentColor" />}
                          </div>
                          <div className="card-body">
                            <h4>{service.name}</h4>
                            <p className="price-tag">{Number(service.price).toLocaleString()} ₫</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="step-content animate-fade-in">
                  <h2 className="step-title">Thông tin Người đặt</h2>
                  <div className="premium-form-grid">
                    <div className="input-group-premium full">
                      <label><User size={14} /> Tên khách hàng</label>
                      <input name="customerName" value={form.customerName} onChange={onChange} placeholder="Họ và tên quý khách" required />
                    </div>
                    <div className="input-group-premium">
                      <label><Phone size={14} /> Số điện thoại</label>
                      <input name="customerPhone" value={form.customerPhone} onChange={onChange} placeholder="Liên lạc khi kỹ thuật viên đến" required />
                    </div>
                    <div className="input-group-premium">
                      <label><Mail size={14} /> Email</label>
                      <input name="customerEmail" type="email" value={form.customerEmail} onChange={onChange} placeholder="Nhận thông tin xác nhận" />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="step-content animate-fade-in">
                  <h2 className="step-title">Thời gian & Địa điểm</h2>
                  
                  <div className="premium-form-grid">
                    <div className="input-group-premium">
                      <label><Calendar size={14} /> Ngày thực hiện</label>
                      <input 
                        name="bookingDate" 
                        type="date" 
                        value={form.bookingDate} 
                        onChange={onChange} 
                        min={new Date().toLocaleDateString('en-CA')}
                        required 
                      />
                    </div>
                    <div className="input-group-premium">
                      <label><Clock size={14} /> Giờ bắt đầu</label>
                      <input name="bookingTime" type="time" value={form.bookingTime} onChange={onChange} required />
                    </div>
                    
                    <div className="input-group-premium full address-selection-grid">
                      <label>
                        <MapPin size={14} /> Địa chỉ nhận xe/phục vụ
                        {isCalculatingDist && <span style={{ color: "var(--p-accent)", marginLeft: 10, fontSize: "0.85em", fontWeight: "normal" }}>Đang quét quãng đường...</span>}
                        {form.distance && !isCalculatingDist && <span style={{ color: "#4ade80", marginLeft: 10, fontSize: "0.85em", fontWeight: "normal" }}>Khoảng cách: {form.distance} km</span>}
                      </label>
                      <div className="address-cascading">
                        <select 
                          value={selectedProvince} 
                          onChange={(e) => {
                            setSelectedProvince(e.target.value);
                            setSelectedDistrict("");
                            setSelectedWard("");
                            setForm((prev) => ({ ...prev, distance: "" }));
                          }}
                        >
                          <option value="">Chọn Tỉnh/Thành phố</option>
                          {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                        </select>

                        <select 
                          value={selectedDistrict} 
                          onChange={(e) => {
                            setSelectedDistrict(e.target.value);
                            setSelectedWard("");
                            setForm((prev) => ({ ...prev, distance: "" }));
                          }}
                          disabled={!selectedProvince}
                        >
                          <option value="">Chọn Quận/Huyện</option>
                          {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                        </select>

                        <select 
                          value={selectedWard} 
                          onChange={(e) => setSelectedWard(e.target.value)}
                          disabled={!selectedDistrict}
                        >
                          <option value="">Chọn Phường/Xã</option>
                          {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                        </select>
                        
                        <input 
                          className="street-input"
                          placeholder="Số nhà, tên đường..." 
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          disabled={!selectedWard}
                        />
                      </div>
                    </div>



                    <div className="input-group-premium full">
                      <label><FileText size={14} /> Ghi chú quan trọng</label>
                      <textarea name="note" value={form.note} onChange={onChange} placeholder="Mô tả cụ thể vị trí hoặc yêu cầu khác..." rows={2} />
                    </div>
                  </div>

                  <div className="payment-matrix-glass">
                    <div className="matrix-row highlight">
                      <div className="deposit-control">
                        <label><CreditCard size={14} /> Tiền cọc giữ chỗ (VNĐ)</label>
                        <input 
                          type="number" 
                          name="depositAmount"
                          value={form.depositAmount}
                          onChange={onChange}
                          placeholder="Số tiền cọc tối thiểu"
                        />
                      </div>
                      <div className="deposit-limit">
                        Giới hạn 50%: {Math.floor(totalPrice * 0.5).toLocaleString()} ₫
                      </div>
                    </div>
                    {Number(form.depositAmount) > (totalPrice * 0.5) && (
                      <p className="error-text">Tiền cọc vượt giới hạn quy định.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="booking-nav-buttons">
                {currentStep > 1 && (
                  <button type="button" onClick={prevStep} className="btn-secondary-premium">
                    <ChevronLeft size={18} /> Quay lại
                  </button>
                )}
                
                <div style={{ flex: 1 }}></div>

                {currentStep < 3 ? (
                  <button 
                    type="button" 
                    onClick={nextStep} 
                    disabled={(currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid)}
                    className="btn-primary-premium"
                  >
                    Kế tiếp <ChevronRight size={18} />
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={onSubmit} 
                    disabled={saving || !canSubmit}
                    className="btn-primary-premium glow"
                  >
                    {saving ? "ĐANG GỬI..." : "XÁC NHẬN ĐẶT LỊCH"}
                  </button>
                )}
              </div>
            </form>
          </div>

          <aside className="booking-summary-sidebar">
            <h3 className="sidebar-title">Chi tiết lịch hẹn</h3>
            
            <div className="summary-section">
              <p className="section-eyebrow">Dịch vụ & Phương tiện</p>
              {vehicles.map((v, i) => (
                <div key={v.id} className="vehicle-summary-item">
                  <div className="v-header">
                    <span><Car size={14} /> Xe {i + 1}</span>
                    <span className="v-badge">{v.vehiclePlate || '...'}</span>
                  </div>
                  <div className="v-services">
                    {Array.from(v.selectedServiceIds).map(sId => {
                      const s = allServices.find(x => x.id === sId);
                      return (
                        <div key={sId} className="v-service-row">
                          <span className="name">{s?.name}</span>
                          <span className="price">{Number(s?.price || 0).toLocaleString()} ₫</span>
                        </div>
                      );
                    })}
                    {v.selectedServiceIds.size === 0 && <p className="empty">Chưa chọn dịch vụ</p>}
                  </div>
                </div>
              ))}
            </div>

            {(form.customerName || form.customerPhone) && (
              <div className="summary-section">
                <p className="section-eyebrow">Người đặt</p>
                <div className="contact-summary">
                  {form.customerName && <p><User size={12} /> {form.customerName}</p>}
                  {form.customerPhone && <p><Phone size={12} /> {form.customerPhone}</p>}
                </div>
              </div>
            )}

            {(form.bookingDate || form.bookingTime || form.addressName) && (
              <div className="summary-section">
                <p className="section-eyebrow">Thời gian & Địa điểm</p>
                <div className="location-summary">
                  {form.bookingDate && <p><Calendar size={12} /> {form.bookingDate} {form.bookingTime}</p>}
                  {form.addressName && <p className="addr"><MapPin size={12} /> {form.addressName}</p>}
                </div>
              </div>
            )}

            <div className="total-calculation-footer">
              <div className="calc-row">
                <span>Phí dịch vụ:</span>
                <span>{serviceTotal.toLocaleString()} ₫</span>
              </div>
              <div className="calc-row">
                <span>
                  Phí di chuyển {form.distance && !isCalculatingDist ? `(${form.distance} km)` : ''}: 
                  {travelFee === 0 && Number(form.distance) > 0 ? <span className="free-badge" style={{ marginLeft: 8 }}>FREE</span> : ""}
                </span>
                <span>{form.distance === "" && !isCalculatingDist ? "-- ₫" : isCalculatingDist ? "Đang tính..." : travelFee > 0 ? `${travelFee.toLocaleString()} ₫` : "0 ₫"}</span>
              </div>
              <div className="calc-row result">
                <span>Tổng cộng:</span>
                <strong>{totalPrice.toLocaleString()} ₫</strong>
              </div>
              {form.depositAmount && (
                <>
                  <div className="calc-row">
                    <span>Đã đặt cọc:</span>
                    <span className="accent">-{Number(form.depositAmount).toLocaleString()} ₫</span>
                  </div>
                  <div className="calc-row result">
                    <span>Còn lại:</span>
                    <strong>{(totalPrice - Number(form.depositAmount)).toLocaleString()} ₫</strong>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>

        <div className="booking-footer-minimal">
          <button onClick={() => navigate("/")}>Hủy bỏ & Trở về</button>
        </div>
      </div>
    </div>
  );
};

export default Booking;




