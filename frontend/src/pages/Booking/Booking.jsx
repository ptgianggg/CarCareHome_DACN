import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createBooking, getServices, getCategories, getMyVouchers, getActiveVouchers, redeemVoucher } from "../../services/api";
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
  FileText,
  Coins,
  Ticket,
  ChevronDown
} from "lucide-react";
import ConfirmModal from "@/components/common/ConfirmModal/ConfirmModal";
import momoLogo from "@/assets/momo.png";
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

  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem("carcare_booking_form");
    const expiry = localStorage.getItem("carcare_booking_expiry");
    const now = new Date().getTime();
    
    // Hết hạn sau 60 phút (3600000 ms)
    if (expiry && now - Number(expiry) > 3600000) {
      return initialForm;
    }
    return saved ? JSON.parse(saved) : initialForm;
  });
  const [, setLoadingService] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCalculatingDist, setIsCalculatingDist] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const [allServices, setAllServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentCategoryView, setCurrentCategoryView] = useState("");
  const [myVouchers, setMyVouchers] = useState([]);
  const [activeVouchers, setActiveVouchers] = useState([]);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(() => {
    const expiry = localStorage.getItem("carcare_booking_expiry");
    const now = new Date().getTime();
    if (expiry && now - Number(expiry) > 3600000) return 1;

    const saved = localStorage.getItem("carcare_booking_step");
    return saved ? Number(saved) : 1;
  });
  const [shopCoords, setShopCoords] = useState({ lat: 10.84641, lon: 106.77393 });

  // Initial load: Categories, Services, Provinces AND Shop Coords
  useEffect(() => {
    const fetchShopSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/system-settings`);
        const data = await res.json();
        if (data && data.shopLat && data.shopLng) {
          setShopCoords({ lat: data.shopLat, lon: data.shopLng });
        }
      } catch (err) { console.warn("Could not fetch shop settings:", err); }
    };
    fetchShopSettings();
  }, []);

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

  const [vehicles, setVehicles] = useState(() => {
    const expiry = localStorage.getItem("carcare_booking_expiry");
    const now = new Date().getTime();
    if (expiry && now - Number(expiry) > 3600000) return [{ id: 1, vehicleType: "", vehiclePlate: "", selectedServiceIds: new Set() }];

    const saved = localStorage.getItem("carcare_booking_vehicles");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(v => ({ ...v, selectedServiceIds: new Set(v.selectedServiceIds || []) }));
      } catch (e) {
        console.error("Failed to parse saved vehicles:", e);
      }
    }
    return [{ id: 1, vehicleType: "", vehiclePlate: "", selectedServiceIds: new Set() }];
  });
  const [activeVehicleIndex, setActiveVehicleIndex] = useState(0);

  // Vietnam Provinces API State
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(localStorage.getItem("carcare_booking_p") || "");
  const [selectedDistrict, setSelectedDistrict] = useState(localStorage.getItem("carcare_booking_d") || "");
  const [selectedWard, setSelectedWard] = useState(localStorage.getItem("carcare_booking_w") || "");
  const [street, setStreet] = useState(localStorage.getItem("carcare_booking_s") || "");

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

        // Load user's unused vouchers if logged in
        if (user) {
          try {
            const [vouchers, pubVouchers] = await Promise.all([
              getMyVouchers(),
              getActiveVouchers()
            ]);
            if (Array.isArray(vouchers)) {
              setMyVouchers(vouchers.filter(v => !v.used));
            }
            if (Array.isArray(pubVouchers)) {
              setActiveVouchers(pubVouchers);
            }
          } catch (err) {
            console.error("Failed to load vouchers:", err);
          }
        }

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

  // --- PERSISTENCE: Save to localStorage ---
  useEffect(() => {
    const now = new Date().getTime();
    localStorage.setItem("carcare_booking_expiry", now);
    localStorage.setItem("carcare_booking_form", JSON.stringify(form));
    localStorage.setItem("carcare_booking_vehicles", JSON.stringify(vehicles.map(v => ({ 
      ...v, 
      selectedServiceIds: Array.from(v.selectedServiceIds) 
    }))));
    localStorage.setItem("carcare_booking_step", currentStep);
    localStorage.setItem("carcare_booking_p", selectedProvince);
    localStorage.setItem("carcare_booking_d", selectedDistrict);
    localStorage.setItem("carcare_booking_w", selectedWard);
    localStorage.setItem("carcare_booking_s", street);
  }, [form, vehicles, currentStep, selectedProvince, selectedDistrict, selectedWard, street]);

  // --- PERSISTENCE: Clear on success ---
  const clearBookingCache = () => {
    localStorage.removeItem("carcare_booking_expiry");
    localStorage.removeItem("carcare_booking_form");
    localStorage.removeItem("carcare_booking_vehicles");
    localStorage.removeItem("carcare_booking_step");
    localStorage.removeItem("carcare_booking_p");
    localStorage.removeItem("carcare_booking_d");
    localStorage.removeItem("carcare_booking_w");
    localStorage.removeItem("carcare_booking_s");
  };

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


  useEffect(() => {
    const p = provinces.find(x => String(x.code) === String(selectedProvince))?.name || "";
    const d = districts.find(x => String(x.code) === String(selectedDistrict))?.name || "";
    const w = wards.find(x => String(x.code) === String(selectedWard))?.name || "";
    
    const parts = [street, w, d, p].filter(Boolean);
    setForm(prev => ({ ...prev, addressName: parts.join(", ") }));
  }, [selectedProvince, selectedDistrict, selectedWard, street, provinces, districts, wards]);

  useEffect(() => {
    const calculateAuto = async () => {
    
      if (!selectedProvince || !selectedDistrict || !selectedWard) {
        return;
      }
      
      setIsCalculatingDist(true);
      try {
        const origin = shopCoords; 
        
        const p = provinces.find(x => String(x.code) === String(selectedProvince))?.name || "";
        const d = districts.find(x => String(x.code) === String(selectedDistrict))?.name || "";
        const w = wards.find(x => String(x.code) === String(selectedWard))?.name || "";
        
        
        const cleanName = (name) => {
          if (!name) return "";
          return name.replace(/^(Xã|Phường|Thị trấn|Huyện|Quận|Thành phố|Tỉnh)\s+/gi, '').trim();
        };

        const addressToSearchFull = [w, d, p].filter(Boolean).join(", ");
        const addressToSearchClean = [cleanName(w), cleanName(d), cleanName(p)].filter(Boolean).join(", ");
        const addressToSearchDistrict = [cleanName(d), cleanName(p)].filter(Boolean).join(", ");
        
        const geocodeAddress = async (address) => {
          try {
            // Giới hạn tìm kiếm trong Việt Nam và ưu tiên gần vị trí Shop
            const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(address)}&sourceCountry=VNM&location=${origin.lon},${origin.lat}&distance=50000&maxLocations=1`;
            const res = await fetch(url);
            const data = await res.json();
            if (data && data.candidates && data.candidates.length > 0) {
              const loc = data.candidates[0].location;
              return { lat: loc.y, lon: loc.x };
            }
            return null;
          } catch (err) {
             console.error("Geocode error:", err);
             return null;
          }
        };

       
        let dest = await geocodeAddress(addressToSearchFull);
        
        
        if (!dest) {
          dest = await geocodeAddress(addressToSearchClean);
        }
        
        
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
    let finalValue = value;
    if (field === "vehiclePlate") {
      // Tự động viết hoa và lọc bỏ các kí tự đặc biệt không hợp lệ
      finalValue = value.toUpperCase().replace(/[^A-Z0-9-. ]/g, "");
    }
    setVehicles(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: finalValue };
      return next;
    });
  };

  const validatePlate = (plate) => {
    if (!plate) return false;
    // Format biển số VN: 2 số đầu (tỉnh), sau đó là chữ/số (sê-ri), cuối cùng là dãy số
    // Cho phép dấu gạch ngang, dấu chấm và khoảng trắng
    const cleanPlate = plate.replace(/[-. ]/g, "");
    // Regex: Bắt đầu bằng 2 chữ số, theo sau là ít nhất 2 ký tự alphanumeric, tổng độ dài từ 4-10 ký tự
    const plateRegex = /^[0-9]{2}[A-Z0-9]{2,8}$/;
    return plateRegex.test(cleanPlate);
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

  const validateTime = (time) => {
    if (!time) return false;
    const [hours] = time.split(":").map(Number);
    return hours >= 8 && hours <= 21;
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

  const calculateTotalDuration = () => {
    return vehicles.reduce((total, v) => {
      const vDuration = Array.from(v.selectedServiceIds).reduce((sum, sId) => {
        const svc = allServices.find(s => s.id === sId);
        return sum + (svc ? Number(svc.duration || 0) : 0);
      }, 0);
      return total + vDuration;
    }, 0);
  };

  const serviceTotal = calculateTotalPrice();
  const totalDuration = calculateTotalDuration();

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

  const selectedVoucher = useMemo(() => {
    return myVouchers.find(v => v.id === selectedVoucherId);
  }, [myVouchers, selectedVoucherId]);

  const discountAmount = useMemo(() => {
    if (!selectedVoucher) return 0;
    const baseTotal = serviceTotal + travelFee;
    const v = selectedVoucher.voucher;
    
    if (v.minOrderValue && baseTotal < v.minOrderValue) return 0;
    
    if (v.discountType === 'CASH') return Number(v.discountValue);
    if (v.discountType === 'PERCENT') return baseTotal * (Number(v.discountValue) / 100);
    if (v.discountType === 'SERVICE') return serviceTotal;
    return 0;
  }, [selectedVoucher, serviceTotal, travelFee]);

  const totalPrice = Math.max(0, serviceTotal + travelFee - discountAmount);

  const hierarchicalServices = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      services: allServices.filter(s => s.category === cat.name)
    })).filter(cat => cat.services.length > 0);
  }, [allServices, categories]);

  const isStep1Valid = vehicles.every(v => 
    v.vehicleType.trim() && 
    v.vehiclePlate.trim() && 
    validatePlate(v.vehiclePlate) && 
    v.selectedServiceIds.size > 0
  );
  const isStep2Valid = form.customerName.trim() && form.customerPhone.trim();
  const isStep3Valid = form.bookingDate && form.bookingTime && validateTime(form.bookingTime) && form.addressName.trim() && form.distance !== "";

  const canSubmit = isStep1Valid && isStep2Valid && isStep3Valid;

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSaveVoucher = async (e, voucherId) => {
    e.stopPropagation();
    try {
      setSaving(true);
      await redeemVoucher(voucherId);
      const [vouchers, pubVouchers] = await Promise.all([
        getMyVouchers(),
        getActiveVouchers()
      ]);
      if (Array.isArray(vouchers)) setMyVouchers(vouchers.filter(v => !v.used));
      if (Array.isArray(pubVouchers)) setActiveVouchers(pubVouchers);
      alert("Đã lưu mã giảm giá thành công! Bạn có thể chọn để áp dụng.");
    } catch (err) {
      console.error(err);
      alert("Kho lưu mã đã đầy hoặc mã không hợp lệ.");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyVoucherCode = async () => {
    if (!voucherCodeInput.trim()) return;
    const code = voucherCodeInput.trim().toUpperCase();
    
    // Check if already saved
    const existing = myVouchers.find(uv => uv.voucher.code.toUpperCase() === code);
    if (existing) {
      setSelectedVoucherId(existing.id);
      setVoucherCodeInput("");
      alert("Đã áp dụng mã giảm giá thành công.");
      return;
    }

    // Check if valid active voucher
    const active = activeVouchers.find(v => v.code.toUpperCase() === code);
    if (active) {
      try {
        setSaving(true);
        await redeemVoucher(active.id);
        const vouchers = await getMyVouchers();
        if (Array.isArray(vouchers)) {
           const activeList = vouchers.filter(v => !v.used);
           setMyVouchers(activeList);
           const newlySaved = activeList.find(uv => uv.voucher.code.toUpperCase() === code);
           if (newlySaved) {
             setSelectedVoucherId(newlySaved.id);
             setVoucherCodeInput("");
             alert("Đã lưu và áp dụng mã giảm giá thành công!");
           }
        }
      } catch (err) {
        console.error(err);
        alert("Không thể áp dụng mã này (hoặc điểm không đủ).");
      } finally {
        setSaving(false);
      }
      return;
    }
    alert("Mã giảm giá không hợp lệ, hoặc không tồn tại.");
  };

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
        price: vPrice,
        serviceIds: Array.from(v.selectedServiceIds)
      };
    });

    // Prepare root fields from the first vehicle (for compatibility/simple views)
    const primaryVehicle = items[0] || {};

    const payload = {
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      customerEmail: form.customerEmail.trim() || "", // Send as empty string rather than null to be safe
      bookingDate: form.bookingDate,
      bookingTime: form.bookingTime,
      vehicleType: primaryVehicle.vehicleType || "",
      vehiclePlate: primaryVehicle.vehiclePlate || "",
      serviceType: primaryVehicle.serviceType || "",
      bookingEndTime: (() => {
        const [h, m] = form.bookingTime.split(":").map(Number);
        const date = new Date();
        date.setHours(h, m, 0, 0);
        // Nếu không có duration, default 45 phút
        const duration = totalDuration > 0 ? totalDuration : 45;
        const endDate = new Date(date.getTime() + duration * 60000);
        return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;
      })(),
      addressName: form.addressName.trim(),
      note: form.note.trim() || "",
      status: "PENDING",
      totalPrice: totalPrice,
      depositAmount: (user?.tier === "GOLD" || user?.tier === "VIP") ? 0 : (form.paymentMethod === "MOMO" ? totalPrice : (totalPrice > 500000 ? totalPrice * 0.1 : 0)),
      distance: Number(form.distance),
      travelFee: travelFee,
      items: items,
      paymentMethod: form.paymentMethod,
      userVoucherId: selectedVoucherId
    };

    setSaving(true);
    try {
      const result = await createBooking(payload);
      if (result?.error) {
        alert(result.message || "Không thể khởi tạo lịch hẹn");
        return;
      }

      // Lưu trữ thành công -> Xóa bộ nhớ tạm
      clearBookingCache();

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
            alert(moMoData.message || "Không thể khởi tạo thanh toán MoMo. Vui lòng thử lại trong lịch sử đơn hàng.");
            navigate("/my-bookings");
            return;
          }
        } catch (momoErr) {
          console.error("MoMo redirect failed:", momoErr);
          alert("Lỗi kết nối khi tạo thanh toán MoMo. Vui lòng thử lại sau.");
          navigate("/my-bookings");
          return;
        }
      }

      setShowSuccess(true);
      // Wait a bit before navigating if they don't click the button? 
      // Or just let them click the button in the modal.
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
                      {vehicles[activeVehicleIndex].vehiclePlate && !validatePlate(vehicles[activeVehicleIndex].vehiclePlate) && (
                        <span className="input-error-msg">Biển số không đúng định dạng (VD: 51G12345)</span>
                      )}
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
                            <p className="price-tag">{Number(service.price).toLocaleString()} VNĐ</p>
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
                      <label><Clock size={14} /> Giờ bắt đầu (Định dạng 24h)</label>
                      <input name="bookingTime" type="time" value={form.bookingTime} onChange={onChange} required />
                      {form.bookingTime && !validateTime(form.bookingTime) && (
                        <span className="input-error-msg">Ngoài giờ làm việc (08:00 - 21:00)</span>
                      )}
                      <p className="input-hint-msg">Vui lòng chọn khung giờ từ 08:00 AM đến 09:00 PM.</p>
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
                    {/* ===== VOUCHER - CHỈ HIỂN THỊ MÃ ĐÃ LƯU ===== */}
                    {user && myVouchers.length > 0 && (
                      <div className="voucher-selection-booking">
                        <label className="section-label"><Ticket size={16} /> Ưu đãi của bạn</label>
                        <div
                          className={`voucher-dropdown-trigger ${isVoucherOpen ? 'open' : ''} ${selectedVoucher ? 'has-selected' : ''}`}
                          onClick={() => setIsVoucherOpen(!isVoucherOpen)}
                        >
                          <div className="v-selected-info">
                            {selectedVoucher ? (
                              <>
                                <span className="v-tag-glow">{selectedVoucher.voucher.code}</span>
                                <span className="v-applied-name">{selectedVoucher.voucher.title}</span>
                              </>
                            ) : (
                              <span className="v-placeholder">Chọn voucher để nhận ưu đãi ({myVouchers.length})</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {selectedVoucher && (
                              <span
                                className="v-clear-btn"
                                onClick={e => { e.stopPropagation(); setSelectedVoucherId(null); }}
                                title="Bỏ áp dụng"
                              >×</span>
                            )}
                            <ChevronDown size={18} className={isVoucherOpen ? 'rotate' : ''} />
                          </div>
                        </div>

                        {isVoucherOpen && (
                          <div className="voucher-list-dropdown animate-fade-in">
                            {myVouchers.map(uv => {
                              const v = uv.voucher;
                              const meetMin = v.minOrderValue ? (serviceTotal + travelFee) >= v.minOrderValue : true;
                              return (
                                <div
                                  key={uv.id}
                                  className={`v-item ${selectedVoucherId === uv.id ? 'active' : ''} ${!meetMin ? 'disabled' : ''}`}
                                  onClick={() => {
                                    if (meetMin) {
                                      setSelectedVoucherId(selectedVoucherId === uv.id ? null : uv.id);
                                      setIsVoucherOpen(false);
                                    }
                                  }}
                                >
                                  <div className="v-check">
                                    {selectedVoucherId === uv.id && <CheckCircle size={14} />}
                                  </div>
                                  <div className="v-details">
                                    <div className="v-row-1">
                                      <strong>{v.title}</strong>
                                      <span className="v-code-mini">{v.code}</span>
                                    </div>
                                    <div className="v-row-2">
                                      {v.minOrderValue > 0 ? (
                                        <span>Đơn từ {v.minOrderValue.toLocaleString()}đ</span>
                                      ) : (
                                        <span>Mọi đơn hàng</span>
                                      )}
                                      {!meetMin && (
                                        <span className="v-error">Cần thêm {(v.minOrderValue - (serviceTotal + travelFee)).toLocaleString()}đ</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="payment-method-selection">
                      <label className="section-label">Phương thức thanh toán</label>
                      <div className="payment-options">
                        <div 
                          className={`payment-option ${form.paymentMethod === "CASH" ? "active" : ""}`}
                          onClick={() => setForm(prev => ({ ...prev, paymentMethod: "CASH" }))}
                        >
                          <CreditCard size={18} />
                          <div className="opt-text">
                            <strong>Tiền mặt</strong>
                            <span>Thu sau khi hoàn tất</span>
                          </div>
                          {form.paymentMethod === "CASH" && <CheckCircle className="check" size={16} />}
                        </div>
                        <div 
                          className={`payment-option ${form.paymentMethod === "MOMO" ? "active" : ""}`}
                          onClick={() => setForm(prev => ({ ...prev, paymentMethod: "MOMO" }))}
                        >
                          <img src={momoLogo} alt="MoMo" width={24} height={24} />
                          <div className="opt-text">
                            <strong>MoMo</strong>
                            <span>Chuyển khoản / Ví MoMo</span>
                          </div>
                          {form.paymentMethod === "MOMO" && <CheckCircle className="check" size={16} />}
                        </div>
                      </div>
                    </div>

                    {form.paymentMethod === "CASH" && totalPrice > 500000 && (
                      <div className="deposit-notice animate-fade-in">
                        {(user?.tier === "GOLD" || user?.tier === "VIP") ? (
                          <p>
                            <Sparkles size={16} color="#fbbf24" style={{marginRight: 6}} />
                            <strong>Đặc quyền {user.tier}:</strong> Quý khách được miễn phí đặt cọc. Lịch hẹn sẽ được xác nhận tự động.
                          </p>
                        ) : (
                          <p>
                            <strong>Lưu ý:</strong> Đơn hàng trên 500,000đ. Quý khách vui lòng đặt cọc 
                            <span className="highlight"> 10% ({(totalPrice * 0.1).toLocaleString()}đ)</span> qua MoMo để xác nhận lịch hẹn.
                          </p>
                        )}
                      </div>
                    )}

                    {form.paymentMethod === "MOMO" && (
                      <div className="deposit-notice full-pay animate-fade-in">
                         {(user?.tier === "GOLD" || user?.tier === "VIP") ? (
                          <p>
                            <Sparkles size={16} color="#fbbf24" style={{marginRight: 6}} />
                            <strong>Đặc quyền {user.tier}:</strong> Được phép thanh toán sau dịch vụ (0đ trước). Tuy nhiên bạn vẫn có thể chọn MoMo để thanh toán trước {totalPrice.toLocaleString()} VNĐ nếu muốn.
                          </p>
                         ) : (
                          <p>Quý khách đã chọn thanh toán 100% qua MoMo: <span className="highlight"> {totalPrice.toLocaleString()} VNĐ</span></p>
                         )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="booking-nav-buttons">
                {currentStep === 1 ? (
                  <button 
                    type="button" 
                    onClick={() => setIsConfirmOpen(true)} 
                    className="btn-cancel-premium"
                  >
                    Hủy bỏ
                  </button>
                ) : (
                  <button type="button" onClick={prevStep} className="btn-secondary-premium">
                    <ChevronLeft size={18} /> Trở về
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
                    Tiếp theo <ChevronRight size={18} />
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
                          <span className="name">
                            {s?.name} 
                            <span style={{ fontSize: '0.7rem', opacity: 0.5, marginLeft: '6px' }}>({s?.duration || 0}p)</span>
                          </span>
                          <span className="price">{Number(s?.price || 0).toLocaleString()}VNĐ</span>
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
              <div className="calc-row" style={{ background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', padding: '10px 15px', color: '#3b82f6', marginBottom: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                  <Clock size={16} /> Thời gian dự kiến:
                </span>
                <strong style={{ fontSize: '1.2rem' }}>{totalDuration} phút</strong>
              </div>

              <div className="calc-row loyalty-calc" style={{ background: 'rgba(251, 191, 36, 0.08)', borderRadius: '12px', padding: '12px 15px', border: '1px dashed rgba(251, 191, 36, 0.3)', margin: '15px 0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: '#fbbf24' }}>
                  <Coins size={16} className="points-icon" /> Tích lũy dự kiến:
                </span>
                <strong style={{ fontSize: '1.2rem', color: '#fbbf24' }}>+{Math.floor((serviceTotal - (selectedVoucher?.voucher.discountType === 'SERVICE' ? 0 : (discountAmount || 0))) / 10000)} điểm</strong>
              </div>
              
              <div className="calc-row">
                <span>Phí dịch vụ:</span>
                <span>{serviceTotal.toLocaleString()}VNĐ</span>
              </div>
              <div className="calc-row">
                <span>
                  Phí di chuyển {form.distance && !isCalculatingDist ? `(${form.distance} km)` : ''}: 
                  {travelFee === 0 && Number(form.distance) > 0 ? <span className="free-badge" style={{ marginLeft: 8 }}>FREE</span> : ""}
                </span>
                <span>{form.distance === "" && !isCalculatingDist ? "--VNĐ" : isCalculatingDist ? "Đang tính..." : travelFee > 0 ? `${travelFee.toLocaleString()}VNĐ` : "0VNĐ"}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="calc-row discount-row" style={{ color: '#10b981', fontWeight: '600' }}>
                  <span>Voucher giảm giá:</span>
                  <span>-{discountAmount.toLocaleString()}VNĐ</span>
                </div>
              )}

              <div className="calc-row result">
                <span>Tổng cộng:</span>
                <strong>{totalPrice.toLocaleString()}VNĐ</strong>
              </div>

              {(user?.tier === "GOLD" || user?.tier === "VIP") ? (
                <div className="calc-row result" style={{ color: '#fbbf24', borderTop: '1px solid rgba(251, 191, 36, 0.2)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.85rem' }}>Đặc quyền {user.tier}:</span>
                  <strong style={{ fontSize: '0.9rem' }}>MIỄN CỌC 100%</strong>
                </div>
              ) : (
                <>
                  {form.paymentMethod === "CASH" && totalPrice > 500000 && (
                    <>
                      <div className="calc-row">
                        <span>Tiền cọc (10%):</span>
                        <span className="accent">{(totalPrice * 0.1).toLocaleString()}VNĐ</span>
                      </div>
                      <div className="calc-row result">
                        <span>Thu hộ tại chỗ:</span>
                        <strong>{(totalPrice - (totalPrice * 0.1)).toLocaleString()}VNĐ</strong>
                      </div>
                    </>
                  )}
                  {form.paymentMethod === "MOMO" && (
                    <div className="calc-row result">
                      <span>Thanh toán MoMo:</span>
                      <strong>{totalPrice.toLocaleString()}VNĐ</strong>
                    </div>
                  )}
                  {form.paymentMethod === "CASH" && totalPrice <= 500000 && (
                    <div className="calc-row result">
                      <span>Thanh toán tiền mặt:</span>
                      <strong>{totalPrice.toLocaleString()}VNĐ</strong>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
      {showSuccess && (
        <div className="booking-modal-backdrop success-overlay" style={{ 
          background: 'rgba(2, 6, 23, 0.97)', 
          backdropFilter: 'blur(40px)', 
          position: 'fixed', 
          inset: 0, 
          zIndex: 9999, 
          display: 'grid', 
          placeItems: 'center',
          overflow: 'hidden'
        }}>
          {/* Decorative background lights */}
          <div style={{ position: 'absolute', top: '10%', left: '10%', width: '30vw', height: '30vh', background: 'rgba(34, 197, 94, 0.1)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '40vw', height: '40vh', background: 'rgba(59, 130, 246, 0.1)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }}></div>

          <div className="success-glass-card" style={{ 
            maxWidth: '540px', 
            width: '92%', 
            padding: '60px 50px', 
            background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)', 
            border: '1px solid rgba(255,255,255,0.12)', 
            borderRadius: '48px', 
            textAlign: 'center', 
            boxShadow: '0 50px 100px rgba(0,0,0,0.6)', 
            position: 'relative',
            animation: 'cardScaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden'
          }}>
            {/* Glossy shine effect */}
            <div style={{ 
              position: 'absolute', 
              top: '-100%', left: '-100%', width: '300%', height: '300%', 
              background: 'linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.05) 50%, transparent 55%)',
              animation: 'shineRotation 6s linear infinite',
              pointerEvents: 'none'
            }}></div>

            <div className="success-icon-container" style={{ position: 'relative', marginBottom: '40px' }}>
              <div className="success-icon-pulse" style={{ 
                position: 'absolute', 
                top: '50%', left: '50%', 
                width: '120px', height: '120px', 
                margin: '-60px 0 0 -60px',
                background: 'rgba(34, 197, 94, 0.2)',
                borderRadius: '50%',
                animation: 'pulseRing 2s infinite'
              }}></div>
              
              <div className="success-icon-wrapper" style={{ 
                width: '110px', height: '110px', 
                borderRadius: '35%', 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                display: 'grid', 
                placeItems: 'center', 
                margin: '0 auto', 
                position: 'relative',
                boxShadow: '0 20px 40px rgba(16, 185, 129, 0.35)', 
                color: '#fff',
                transform: 'rotate(-5deg)',
                animation: 'iconEntrance 0.6s cubic-bezier(0.17, 0.67, 0.83, 1.2) both 0.3s'
              }}>
                <CheckCircle size={56} strokeWidth={2.5} />
              </div>
            </div>
            
            <h2 className="display-font" style={{ 
              fontSize: '2.8rem', 
              fontWeight: '950', 
              color: '#fff', 
              margin: '0 0 20px', 
              letterSpacing: '-0.04em',
              lineHeight: 1,
              background: 'linear-gradient(to bottom, #fff, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Đặt lịch thành công!
            </h2>
            
            <div style={{ width: '60px', height: '4px', background: '#10b981', margin: '0 auto 30px', borderRadius: '10px' }}></div>

            <p style={{ 
              fontSize: '1.2rem', 
              color: 'rgba(255,255,255,0.7)', 
              lineHeight: '1.7', 
              marginBottom: '50px',
              fontWeight: '500' 
            }}>
              Cảm ơn quý khách đã tin tưởng. Chuyên viên của <span style={{ color: '#fff', fontWeight: '800' }}>CarCareHome</span> sẽ liên hệ xác nhận trong giây lát để đảm bảo lịch trình tốt nhất.
            </p>

            <div style={{ display: 'grid', gap: '18px' }}>
              <button 
                onClick={() => navigate("/my-bookings")} 
                className="btn-primary-premium glow"
                style={{ 
                  width: '100%', 
                  padding: '22px', 
                  borderRadius: '24px', 
                  fontSize: '1.05rem', 
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  background: '#10b981',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 15px 35px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.3s'
                 }}
                 onMouseEnter={e => {
                   e.target.style.transform = 'translateY(-4px)';
                   e.target.style.boxShadow = '0 20px 45px rgba(16, 185, 129, 0.5)';
                 }}
                 onMouseLeave={e => {
                   e.target.style.transform = 'translateY(0)';
                   e.target.style.boxShadow = '0 15px 35px rgba(16, 185, 129, 0.4)';
                 }}
              >
                XEM LỊCH HẸN TRÊN HỆ THỐNG
              </button>
              
              <button 
                onClick={() => navigate("/")} 
                style={{ 
                  width: '100%', 
                  padding: '18px', 
                  borderRadius: '24px', 
                  border: '1px solid rgba(255,255,255,0.15)', 
                  background: 'rgba(255,255,255,0.03)', 
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: '0.3s'
                }}
                onMouseEnter={e => {
                  e.target.style.background = 'rgba(255,255,255,0.08)';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'rgba(255,255,255,0.03)';
                  e.target.style.color = 'rgba(255,255,255,0.5)';
                }}
              >
                QUAY LẠI TRANG CHỦ
              </button>
            </div>
          </div>
          
          <style>{`
            @keyframes cardScaleIn {
              from { transform: scale(0.85); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            @keyframes pulseRing {
              0% { transform: scale(0.8); opacity: 0.8; }
              100% { transform: scale(1.6); opacity: 0; }
            }
            @keyframes iconEntrance {
              from { transform: scale(0) rotate(-45deg); opacity: 0; }
              to { transform: scale(1) rotate(-5deg); opacity: 1; }
            }
            @keyframes shineRotation {
              from { opacity: 0.3; transform: rotate(0deg) translateX(-50%); }
              to { opacity: 0.3; transform: rotate(360deg) translateX(-50%); }
            }
            .success-overlay {
              animation: fadeInOverlay 0.5s ease forwards;
            }
            @keyframes fadeInOverlay {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .display-font {
              font-family: var(--font-display, 'Inter', sans-serif);
            }
          `}</style>
        </div>
      )}

      <ConfirmModal 
        isOpen={isConfirmOpen}
        title="Hủy đặt lịch?"
        message="Bạn có chắc chắn muốn hủy quá trình đặt lịch này? Các thông tin bạn đã nhập sẽ được lưu tạm trong 60 phút."
        onConfirm={() => navigate("/")}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText="Đồng ý hủy"
        cancelText="Tiếp tục đặt"
        type="danger"
      />
    </div>
  );
};

export default Booking;




