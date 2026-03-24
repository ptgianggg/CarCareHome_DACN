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
  paymentMethod: "CASH", // Default
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8089/api";

const stepDescriptions = {
  1: "Chọn xe và các gói dịch vụ cần thực hiện cho từng xe.",
  2: "Điền thông tin liên hệ để kỹ thuật viên xác nhận đúng người và đúng lịch.",
  3: "Chốt thời gian, địa điểm và phương thức thanh toán trước khi tạo lịch hẹn."
};

const Booking = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("service_id");
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [, setLoadingService] = useState(false);
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
      // Chá»‰ tÃ­nh khi cáº£ 3 trÆ°á»ng Tá»‰nh, Huyá»‡n, XÃ£ Ä‘á»u cÃ³ dá»¯ liá»‡u
      if (!selectedProvince || !selectedDistrict || !selectedWard) {
        return;
      }
      
      setIsCalculatingDist(true);
      try {
        const origin = { lat: 10.8443, lon: 106.7845 }; // Quang Trung, Hiá»‡p PhÃº, Thá»§ Äá»©c
        
        const p = provinces.find(x => String(x.code) === String(selectedProvince))?.name || "";
        const d = districts.find(x => String(x.code) === String(selectedDistrict))?.name || "";
        const w = wards.find(x => String(x.code) === String(selectedWard))?.name || "";
        
        // HÃ m xÃ³a tá»« khÃ³a hÃ nh chÃ­nh Viá»‡t Nam Ä‘á»ƒ Nominatim dá»… quÃ©t hÆ¡n
        const cleanName = (name) => {
          if (!name) return "";
          return name.replace(/^(XÃ£|PhÆ°á»ng|Thá»‹ tráº¥n|Huyá»‡n|Quáº­n|ThÃ nh phá»‘|Tá»‰nh)\s+/gi, '').trim();
        };

        const addressToSearchFull = [w, d, p].filter(Boolean).join(", ");
        const addressToSearchClean = [cleanName(w), cleanName(d), cleanName(p)].filter(Boolean).join(", ");
        const addressToSearchDistrict = [cleanName(d), cleanName(p)].filter(Boolean).join(", ");
        
        const geocodeAddress = async (address) => {
          try {
            // Äá»•i sang há»‡ thá»‘ng vá»‡ tinh ArcGIS: siÃªu máº¡nh, bao phá»§ 100% tiáº¿ng Viá»‡t, khÃ´ng bá»‹ giá»›i háº¡n requests
            const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(address + ", Viá»‡t Nam")}&maxLocations=1`;
            const res = await fetch(url);
            const data = await res.json();
            if (data && data.candidates && data.candidates.length > 0) {
              const loc = data.candidates[0].location;
              return { lat: loc.y, lon: loc.x };
            }
            return null;
          } catch {
             return null;
          }
        };

        // Thá»­ tÃ¬m Ä‘á»‹a chá»‰ chÃ­nh xÃ¡c vá»›i tiá»n tá»‘
        let dest = await geocodeAddress(addressToSearchFull);
        
        // Thá»­ tÃ¬m Ä‘á»‹a chá»‰ Ä‘Ã£ loáº¡i bá» "XÃ£, Huyá»‡n, Tá»‰nh" vÃ¬ dá»¯ liá»‡u nÆ°á»›c ngoÃ i Æ°u tiÃªn tÃªn Ä‘Æ°á»ng gá»n hÆ¡n
        if (!dest) {
          dest = await geocodeAddress(addressToSearchClean);
        }
        
        // Thá»­ chá»‰ tÃ¬m Huyá»‡n vÃ  Tá»‰nh lÃ m trung tÃ¢m dá»± phÃ²ng
        if (!dest) {
          dest = await geocodeAddress(addressToSearchDistrict);
        }

        if (!dest) {
          setIsCalculatingDist(false);
          alert("Há»‡ thá»‘ng báº£n Ä‘á»“ khÃ´ng thá»ƒ nháº­n diá»‡n chÃ­nh xÃ¡c " + addressToSearchFull + ". Sáº½ táº¡m Ã¡p dá»¥ng má»‘c 10km, nhÃ¢n viÃªn sáº½ liÃªn há»‡ láº¡i xÃ¡c nháº­n sau.");
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

    // Cháº¡y khi ngÆ°á»i dÃ¹ng dá»«ng tÆ°Æ¡ng tÃ¡c 1 giÃ¢y Ä‘á»ƒ trÃ¡nh gá»i API liÃªn tá»¥c
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
  const isStep3Valid = form.bookingDate && form.bookingTime && form.addressName.trim() && form.distance !== "";

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
      alert("Vui lÃ²ng hoÃ n thÃ nh táº¥t cáº£ thÃ´ng tin báº¯t buá»™c.");
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
      depositAmount: form.paymentMethod === "MOMO" ? totalPrice : (totalPrice > 500000 ? totalPrice * 0.1 : 0),
      distance: Number(form.distance),
      travelFee: travelFee,
      items: items,
      paymentMethod: form.paymentMethod
    };

    setSaving(true);
    try {
      const result = await createBooking(payload);
      if (result?.error) {
        alert(result.message || "KhÃ´ng thá»ƒ khá»Ÿi táº¡o lá»‹ch háº¹n");
        return;
      }

      // Check if MoMo payment is needed
      if (payload.paymentMethod === "MOMO" || payload.depositAmount > 0) {
        try {
          // Call MoMo create payment API
          const response = await fetch(`${API_URL}/momo/create-payment/${result.id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          
          const moMoData = await response.json();
          if (response.ok && moMoData.payUrl) {
            window.location.href = moMoData.payUrl;
            return; // EXIT HERE on success
          } else {
            console.error("MoMo API Error:", moMoData);
            alert(moMoData.message || "KhÃ´ng thá»ƒ khá»Ÿi táº¡o thanh toÃ¡n MoMo. Vui lÃ²ng thá»­ láº¡i trong lá»‹ch sá»­ Ä‘Æ¡n hÃ ng.");
            navigate("/my-bookings");
            return;
          }
        } catch (momoErr) {
          console.error("MoMo redirect failed:", momoErr);
          alert("Lá»—i káº¿t ná»‘i khi táº¡o thanh toÃ¡n MoMo. Vui lÃ²ng thá»­ láº¡i sau.");
          navigate("/my-bookings");
          return;
        }
      }

      alert("ChÃºc má»«ng! Äáº·t lá»‹ch Ä‘Ã£ Ä‘Æ°á»£c tiáº¿p nháº­n thÃ nh cÃ´ng.");
      navigate("/my-bookings");
    } catch (error) {
      console.error("Create booking failed:", error);
      alert("CÃ³ lá»—i ká»¹ thuáº­t khi táº¡o lá»‹ch háº¹n");
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
          <p>Dá»‹ch vá»¥ chuyÃªn biá»‡t cho má»™t hoáº·c nhiá»u xe cá»§a quÃ½ khÃ¡ch</p>
        </header>

        <div className="stepper-modern">
          <div className={`step ${currentStep >= 1 ? "active" : ""}`}>
            <div className="step-circle"><Settings size={18} /></div>
            <span>Dá»‹ch vá»¥ & Xe</span>
          </div>
          <div className={`step-line ${currentStep >= 2 ? 'filled' : ''}`}></div>
          <div className={`step ${currentStep >= 2 ? "active" : ""}`}>
            <div className="step-circle"><User size={18} /></div>
            <span>ThÃ´ng tin</span>
          </div>
          <div className={`step-line ${currentStep >= 3 ? 'filled' : ''}`}></div>
          <div className={currentStep >= 3 ? "step active" : "step"}>
            <div className="step-circle"><Calendar size={18} /></div>
            <span>HoÃ n táº¥t</span>
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
                            <span className="v-remove" onClick={(e) => { e.stopPropagation(); removeVehicle(i); }}>Ã—</span>
                          )}
                        </button>
                      ))}
                      <button type="button" className="v-add-tab" onClick={addVehicle}>+ ThÃªm xe</button>
                    </div>
                  </div>

                  <h2 className="step-title">GÃ³i dá»‹ch vá»¥ cho Xe {activeVehicleIndex + 1}</h2>
                  
                  <div className="premium-form-grid">
                    <div className="input-group-premium">
                      <label><Car size={14} /> Loáº¡i xe</label>
                      <input 
                        value={vehicles[activeVehicleIndex].vehicleType} 
                        onChange={(e) => updateVehicleInfo(activeVehicleIndex, 'vehicleType', e.target.value)} 
                        placeholder="VÃ­ dá»¥: Porsche / Sedan 4 chá»—" 
                        required 
                      />
                    </div>
                    <div className="input-group-premium">
                      <label><FileText size={14} /> Biá»ƒn sá»‘</label>
                      <input 
                        value={vehicles[activeVehicleIndex].vehiclePlate} 
                        onChange={(e) => updateVehicleInfo(activeVehicleIndex, 'vehiclePlate', e.target.value)} 
                        placeholder="VÃ­ dá»¥: 51G-123.45" 
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
                            <p className="price-tag">{Number(service.price).toLocaleString()} â‚«</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="step-content animate-fade-in">
                  <h2 className="step-title">ThÃ´ng tin NgÆ°á»i Ä‘áº·t</h2>
                  <div className="premium-form-grid">
                    <div className="input-group-premium full">
                      <label><User size={14} /> TÃªn khÃ¡ch hÃ ng</label>
                      <input name="customerName" value={form.customerName} onChange={onChange} placeholder="Há» vÃ  tÃªn quÃ½ khÃ¡ch" required />
                    </div>
                    <div className="input-group-premium">
                      <label><Phone size={14} /> Sá»‘ Ä‘iá»‡n thoáº¡i</label>
                      <input name="customerPhone" value={form.customerPhone} onChange={onChange} placeholder="LiÃªn láº¡c khi ká»¹ thuáº­t viÃªn Ä‘áº¿n" required />
                    </div>
                    <div className="input-group-premium">
                      <label><Mail size={14} /> Email</label>
                      <input name="customerEmail" type="email" value={form.customerEmail} onChange={onChange} placeholder="Nháº­n thÃ´ng tin xÃ¡c nháº­n" />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="step-content animate-fade-in">
                  <h2 className="step-title">Thá»i gian & Äá»‹a Ä‘iá»ƒm</h2>
                  
                  <div className="premium-form-grid">
                    <div className="input-group-premium">
                      <label><Calendar size={14} /> NgÃ y thá»±c hiá»‡n</label>
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
                      <label><Clock size={14} /> Giá» báº¯t Ä‘áº§u</label>
                      <input name="bookingTime" type="time" value={form.bookingTime} onChange={onChange} required />
                    </div>
                    
                    <div className="input-group-premium full address-selection-grid">
                      <label>
                        <MapPin size={14} /> Äá»‹a chá»‰ nháº­n xe/phá»¥c vá»¥
                        {isCalculatingDist && <span style={{ color: "var(--p-accent)", marginLeft: 10, fontSize: "0.85em", fontWeight: "normal" }}>Äang quÃ©t quÃ£ng Ä‘Æ°á»ng...</span>}
                        {form.distance && !isCalculatingDist && <span style={{ color: "#4ade80", marginLeft: 10, fontSize: "0.85em", fontWeight: "normal" }}>Khoáº£ng cÃ¡ch: {form.distance} km</span>}
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
                          <option value="">Chá»n Tá»‰nh/ThÃ nh phá»‘</option>
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
                          <option value="">Chá»n Quáº­n/Huyá»‡n</option>
                          {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                        </select>

                        <select 
                          value={selectedWard} 
                          onChange={(e) => setSelectedWard(e.target.value)}
                          disabled={!selectedDistrict}
                        >
                          <option value="">Chá»n PhÆ°á»ng/XÃ£</option>
                          {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                        </select>
                        
                        <input 
                          className="street-input"
                          placeholder="Sá»‘ nhÃ , tÃªn Ä‘Æ°á»ng..." 
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          disabled={!selectedWard}
                        />
                      </div>
                    </div>

                    <div className="input-group-premium full">
                      <label><FileText size={14} /> Ghi chÃº quan trá»ng</label>
                      <textarea name="note" value={form.note} onChange={onChange} placeholder="MÃ´ táº£ cá»¥ thá»ƒ vá»‹ trÃ­ hoáº·c yÃªu cáº§u khÃ¡c..." rows={2} />
                    </div>
                  </div>

                  <div className="payment-matrix-glass">
                    <div className="payment-method-selection">
                      <label className="section-label">PhÆ°Æ¡ng thá»©c thanh toÃ¡n</label>
                      <div className="payment-options">
                        <div 
                          className={`payment-option ${form.paymentMethod === "CASH" ? "active" : ""}`}
                          onClick={() => setForm(prev => ({ ...prev, paymentMethod: "CASH" }))}
                        >
                          <CreditCard size={18} />
                          <div className="opt-text">
                            <strong>Tiá»n máº·t</strong>
                            <span>Thu sau khi hoÃ n táº¥t</span>
                          </div>
                          {form.paymentMethod === "CASH" && <CheckCircle className="check" size={16} />}
                        </div>
                        <div 
                          className={`payment-option ${form.paymentMethod === "MOMO" ? "active" : ""}`}
                          onClick={() => setForm(prev => ({ ...prev, paymentMethod: "MOMO" }))}
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MoMo" width={24} height={24} />
                          <div className="opt-text">
                            <strong>MoMo</strong>
                            <span>Chuyá»ƒn khoáº£n / VÃ­ MoMo</span>
                          </div>
                          {form.paymentMethod === "MOMO" && <CheckCircle className="check" size={16} />}
                        </div>
                      </div>
                    </div>

                    {form.paymentMethod === "CASH" && totalPrice > 500000 && (
                      <div className="deposit-notice animate-fade-in">
                        <p>
                          <strong>LÆ°u Ã½:</strong> ÄÆ¡n hÃ ng trÃªn 500,000â‚«. QuÃ½ khÃ¡ch vui lÃ²ng Ä‘áº·t cá»c 
                          <span className="highlight"> 10% ({(totalPrice * 0.1).toLocaleString()}â‚«)</span> qua MoMo Ä‘á»ƒ xÃ¡c nháº­n lá»‹ch háº¹n.
                        </p>
                      </div>
                    )}

                    {form.paymentMethod === "MOMO" && (
                      <div className="deposit-notice full-pay animate-fade-in">
                        <p>QuÃ½ khÃ¡ch Ä‘Ã£ chá»n thanh toÃ¡n 100% qua MoMo: <span className="highlight"> {totalPrice.toLocaleString()}â‚«</span></p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="booking-nav-buttons">
                {currentStep > 1 && (
                  <button type="button" onClick={prevStep} className="btn-secondary-premium">
                    <ChevronLeft size={18} /> Quay láº¡i
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
                    Káº¿ tiáº¿p <ChevronRight size={18} />
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={onSubmit} 
                    disabled={saving || !canSubmit}
                    className="btn-primary-premium glow"
                  >
                    {saving ? "ÄANG Gá»¬I..." : "XÃC NHáº¬N Äáº¶T Lá»ŠCH"}
                  </button>
                )}
              </div>
            </form>
          </div>

          <aside className="booking-summary-sidebar">
            <h3 className="sidebar-title">Chi tiáº¿t lá»‹ch háº¹n</h3>
            
            <div className="summary-section">
              <p className="section-eyebrow">Dá»‹ch vá»¥ & PhÆ°Æ¡ng tiá»‡n</p>
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
                          <span className="price">{Number(s?.price || 0).toLocaleString()} â‚«</span>
                        </div>
                      );
                    })}
                    {v.selectedServiceIds.size === 0 && <p className="empty">ChÆ°a chá»n dá»‹ch vá»¥</p>}
                  </div>
                </div>
              ))}
            </div>

            {(form.customerName || form.customerPhone) && (
              <div className="summary-section">
                <p className="section-eyebrow">NgÆ°á»i Ä‘áº·t</p>
                <div className="contact-summary">
                  {form.customerName && <p><User size={12} /> {form.customerName}</p>}
                  {form.customerPhone && <p><Phone size={12} /> {form.customerPhone}</p>}
                </div>
              </div>
            )}

            {(form.bookingDate || form.bookingTime || form.addressName) && (
              <div className="summary-section">
                <p className="section-eyebrow">Thá»i gian & Äá»‹a Ä‘iá»ƒm</p>
                <div className="location-summary">
                  {form.bookingDate && <p><Calendar size={12} /> {form.bookingDate} {form.bookingTime}</p>}
                  {form.addressName && <p className="addr"><MapPin size={12} /> {form.addressName}</p>}
                </div>
              </div>
            )}

            <div className="total-calculation-footer">
              <div className="calc-row">
                <span>PhÃ­ dá»‹ch vá»¥:</span>
                <span>{serviceTotal.toLocaleString()} â‚«</span>
              </div>
              <div className="calc-row">
                <span>
                  PhÃ­ di chuyá»ƒn {form.distance && !isCalculatingDist ? `(${form.distance} km)` : ''}: 
                  {travelFee === 0 && Number(form.distance) > 0 ? <span className="free-badge" style={{ marginLeft: 8 }}>FREE</span> : ""}
                </span>
                <span>{form.distance === "" && !isCalculatingDist ? "-- â‚«" : isCalculatingDist ? "Äang tÃ­nh..." : travelFee > 0 ? `${travelFee.toLocaleString()} â‚«` : "0 â‚«"}</span>
              </div>
              <div className="calc-row result">
                <span>Tá»•ng cá»™ng:</span>
                <strong>{totalPrice.toLocaleString()} â‚«</strong>
              </div>
              {form.paymentMethod === "CASH" && totalPrice > 500000 && (
                <>
                  <div className="calc-row">
                    <span>Tiá»n cá»c (10%):</span>
                    <span className="accent">{(totalPrice * 0.1).toLocaleString()} â‚«</span>
                  </div>
                  <div className="calc-row result">
                    <span>Thu há»™ táº¡i chá»—:</span>
                    <strong>{(totalPrice - (totalPrice * 0.1)).toLocaleString()} â‚«</strong>
                  </div>
                </>
              )}
              {form.paymentMethod === "MOMO" && (
                <div className="calc-row result">
                  <span>Thanh toÃ¡n MoMo:</span>
                  <strong>{totalPrice.toLocaleString()} â‚«</strong>
                </div>
              )}
              {form.paymentMethod === "CASH" && totalPrice <= 500000 && (
                <div className="calc-row result">
                  <span>Thanh toÃ¡n tiá»n máº·t:</span>
                  <strong>{totalPrice.toLocaleString()} â‚«</strong>
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="booking-footer-minimal">
          <button onClick={() => navigate("/")}>Há»§y bá» & Trá»Ÿ vá»</button>
        </div>
      </div>
    </div>
  );
};

export default Booking;




