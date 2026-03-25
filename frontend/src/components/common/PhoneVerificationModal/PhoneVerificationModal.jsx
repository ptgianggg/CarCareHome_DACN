import React, { useState } from 'react';
import { ShieldCheck, X, Phone, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { sendOTP, verifyOTP } from '@/services/api';
import './PhoneVerificationModal.css';

const PhoneVerificationModal = ({ 
  isOpen, 
  onClose, 
  onVerify, 
  correctPhone,
  title = "Xác minh danh tính",
  message = "Bảo mật tài khoản là ưu tiên hàng đầu. Vui lòng xác minh để tiếp tục."
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState("PHONE"); // PHONE or OTP
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return setError("Vui lòng nhập số điện thoại");

    if (phoneNumber === correctPhone) {
      setError("");
      setLoading(true);
      try {
        const res = await sendOTP(user.email);
        if (res.error) throw new Error(res.message);
        setStep("OTP");
      } catch (err) {
        setError(err.message || "Không thể gửi mã OTP. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    } else {
      setError("Số điện thoại không đúng với số đã đăng ký.");
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode) return setError("Vui lòng nhập mã OTP");

    setLoading(true);
    try {
      const res = await verifyOTP(user.email, otpCode);
      if (!res.success) throw new Error(res.message);
      
      // Success! Reset and proceed
      setStep("PHONE");
      setPhoneNumber("");
      setOtpCode("");
      setError("");
      onVerify();
    } catch (err) {
      setError(err.message || "Mã OTP không chính xác hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("PHONE");
    setError("");
    setOtpCode("");
  };

  return (
    <div className="phone-mod-overlay">
      <div className="phone-mod-container animate-in">
        <button className="phone-mod-close-btn" onClick={() => {
            setStep("PHONE");
            setError("");
            onClose();
        }} aria-label="Close">
          <X size={18} />
        </button>
        
        <div className="phone-mod-content">
          <div className="phone-mod-icon-wrapper">
             {step === "PHONE" ? <ShieldCheck size={28} /> : <Mail size={28} />}
          </div>
          
          <h3 className="phone-mod-title">{title}</h3>
          <p className="phone-mod-message">
            {step === "PHONE" 
              ? "Nhập số điện thoại đã đăng ký để nhận mã OTP qua Email." 
              : `Mã OTP đã được gửi đến email ${user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")}`}
          </p>

          <form onSubmit={step === "PHONE" ? handlePhoneSubmit : handleOTPSubmit} className="phone-mod-form">
            {step === "PHONE" ? (
              <div className={`phone-input-group ${error ? 'has-error' : ''}`}>
                <input 
                  type="tel" 
                  placeholder="Nhập số điện thoại..." 
                  value={phoneNumber}
                  onChange={(e) => { setPhoneNumber(e.target.value); setError(""); }}
                  autoFocus
                />
              </div>
            ) : (
              <div className={`phone-input-group ${error ? 'has-error' : ''}`}>
                <input 
                  type="text" 
                  placeholder="Nhập 6 số OTP..." 
                  value={otpCode}
                  maxLength={6}
                  onChange={(e) => { setOtpCode(e.target.value); setError(""); }}
                  autoFocus
                />
              </div>
            )}

            {error && <span className="phone-error-text">{error}</span>}
            
            <button type="submit" className="phone-mod-btn-primary" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {step === "PHONE" ? "Nhận mã OTP" : "Xác nhận truy cập"}
                  <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                </>
              )}
            </button>

            {step === "OTP" && (
                <button type="button" className="phone-mod-btn-back" onClick={handleBack}>
                    Quay lại nhập số điện thoại
                </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerificationModal;

