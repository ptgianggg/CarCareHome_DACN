import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getProfile, getActiveVouchers, redeemVoucher, getMyVoucherIds } from '@/services/api';
import { 
  Coins, 
  Ticket, 
  Gift,
  ChevronRight,
  ShieldCheck,
  Zap,
  Award,
  Crown,
  Medal,
  Info,
  CheckCircle2,
  Lock
} from 'lucide-react';
import './Loyalty.css';
import ConfirmModal from '@/components/common/ConfirmModal/ConfirmModal';
import PhoneVerificationModal from '@/components/common/PhoneVerificationModal/PhoneVerificationModal';
import { useNavigate } from 'react-router-dom';

const TIER_CONFIG = {
  BRONZE: { label: 'Hạng Đồng', min: 0, next: 500, nextLabel: 'Bạc', icon: <Medal size={20} />, color: '#94a3b8' },
  SILVER: { label: 'Hạng Bạc', min: 500, next: 2000, nextLabel: 'Vàng', icon: <Award size={20} />, color: '#64748b' },
  GOLD: { label: 'Hạng Vàng', min: 2000, next: 5000, nextLabel: 'VIP', icon: <Medal size={20} />, color: '#fbbf24' },
  VIP: { label: 'Hạng VIP', min: 5000, next: null, nextLabel: null, icon: <Crown size={20} />, color: '#ef4444' }
};

const Loyalty = () => {
  const { user: authUser, isLoyaltyVerified, verifyLoyalty } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [allActiveVouchers, setAllActiveVouchers] = useState([]);
  const [myVoucherIds, setMyVoucherIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);

  // Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [redeemStatus, setRedeemStatus] = useState({ success: true, message: "" });

  if (!isLoyaltyVerified) {
    return (
      <div className="loyalty-gate-container" style={{ minHeight: '100vh', background: '#0f172a' }}>
        <PhoneVerificationModal 
          isOpen={true}
          onClose={() => navigate("/my-bookings")} // Quay lại lịch hẹn nếu đóng
          onVerify={() => verifyLoyalty()}
          correctPhone={authUser?.phone}
        />
      </div>
    );
  }


  const fetchData = async () => {
    try {
      const [profile, vouchers, ownedIds] = await Promise.all([
        getProfile(),
        getActiveVouchers(),
        getMyVoucherIds()
      ]);
      setUserProfile(profile);
      setAllActiveVouchers(Array.isArray(vouchers) ? vouchers : []);
      setMyVoucherIds(Array.isArray(ownedIds) ? ownedIds : []);
    } catch (err) {
      console.error("Failed to fetch loyalty data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const points = (userProfile?.points ?? authUser?.points ?? 0);
  const lifetimePoints = (userProfile?.pointsLifetime ?? authUser?.pointsLifetime ?? 0);
  const currentTier = (userProfile?.tier || authUser?.tier || 'BRONZE');
  const tierConfig = TIER_CONFIG[currentTier] || TIER_CONFIG.BRONZE;

  const progressPercent = useMemo(() => {
    if (!tierConfig.next) return 100;
    const currentTierMin = tierConfig.min;
    const nextTierMin = tierConfig.next;
    const diff = nextTierMin - currentTierMin;
    const earnedInCurrent = Math.max(0, lifetimePoints - currentTierMin);
    return Math.min(100, (earnedInCurrent / diff) * 100);
  }, [lifetimePoints, tierConfig]);

  const checkTierUnlock = (voucherTier) => {
    if (voucherTier === 'ALL') return true;
    const TIER_ORDER = ['BRONZE', 'SILVER', 'GOLD', 'VIP'];
    const userIdx = TIER_ORDER.indexOf(currentTier);
    const voucherIdx = TIER_ORDER.indexOf(voucherTier);
    return userIdx >= voucherIdx;
  };

  const triggerRedeemFlow = (voucher) => {
    if (myVoucherIds.includes(voucher.id)) return;
    if (!checkTierUnlock(voucher.targetTier)) {
      setRedeemStatus({ success: false, message: `Voucher này dành riêng cho hội viên hạng ${voucher.targetTier} trở lên!` });
      setShowSuccessModal(true);
      return;
    }
    if (points < voucher.pointsRequired) {
      setRedeemStatus({ success: false, message: "Bạn không đủ điểm để đổi mã này! Hãy tích lũy thêm điểm bằng cách đặt lịch dịch vụ." });
      setShowSuccessModal(true);
      return;
    }

    setSelectedVoucher(voucher);
    setShowConfirmModal(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedVoucher) return;
    
    setShowConfirmModal(false);
    setRedeemingId(selectedVoucher.id);
    
    try {
      await redeemVoucher(selectedVoucher.id);
      setRedeemStatus({ success: true, message: "Đổi voucher thành công! Bạn có thể kiểm tra và sử dụng mã trong quá trình đặt lịch dịch vụ." });
      setShowSuccessModal(true);
      await fetchData(); // Refresh data
    } catch (err) {
      setRedeemStatus({ success: false, message: err.message || "Có lỗi xảy ra khi đổi voucher. Vui lòng thử lại sau." });
      setShowSuccessModal(true);
    } finally {
      setRedeemingId(null);
      setSelectedVoucher(null);
    }
  };


  if (loading) return (
    <div className="loyalty-loading-minimal">
      <div className="simple-spinner"></div>
    </div>
  );

  return (
    <div className="loyalty-minimal-page">
      <div className="loyalty-inner-wrapper">
        
        <section className="loyalty-hero-minimal">
          <div className="hero-main-info">
            <h1 className="minimal-title">Đổi Điểm Nhận Ưu Đãi</h1>
            <div className="points-container">
              <div className="points-label">ĐIỂM THƯỞNG HIỆN CÓ</div>
              <div className="points-value">
                <Coins className="points-icon" size={32} />
                <span>{points.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="tier-progress-minimal">
            <div className="tier-header-row">
              <div className="tier-badge-label" style={{ background: `${tierConfig.color}20`, color: tierConfig.color }}>
                {tierConfig.icon}
                <span>{tierConfig.label}</span>
              </div>
              <div className="total-lifetime">Tổng tích lũy: {lifetimePoints.toLocaleString()} pts</div>
            </div>
            
            <div className="minimal-prog-container">
              <div className="minimal-prog-bg">
                <div className="minimal-prog-fill" style={{ width: `${progressPercent}%`, background: tierConfig.color }}></div>
              </div>
              <div className="prog-labels-minimal">
                {tierConfig.next ? (
                  <p>Sắp tới: <strong>{tierConfig.nextLabel}</strong> (Cần thêm {(tierConfig.next - lifetimePoints).toLocaleString()} pts)</p>
                ) : (
                  <p>Hạng cao nhất! Cảm ơn bạn đã đồng hành 🎉</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="loyalty-quick-rules">
            <div className="q-rule"><Zap size={14} /> 10.000đ = 1 pts</div>
            <div className="q-rule"><CheckCircle2 size={14} /> Không thời hạn</div>
            <div className="q-rule"><ShieldCheck size={14} /> Bảo mật tuyệt đối</div>
          </div>
        </section>

        <section className="vouchers-section">
           <div className="section-head">
              <h2>Mã Giảm Giá Khả Dụng</h2>
              <div className="badge-count">{allActiveVouchers.length} mã</div>
           </div>

           <div className="loyalty-vouchers-grid">
             {allActiveVouchers.map((v) => {
               const isOwned = myVoucherIds.includes(v.id);
               const isLocked = !checkTierUnlock(v.targetTier);
               const canAfford = points >= v.pointsRequired;
               const isRedeeming = redeemingId === v.id;

               return (
                 <div key={v.id} className={`voucher-compact-card ${isOwned ? 'owned' : ''} ${isLocked ? 'tier-locked' : ''}`}>
                    <div className="voucher-left">
                      <div className="voucher-type-icon">
                        {v.discountType === 'PERCENT' ? '%' : 'VNĐ'}
                      </div>
                      <div className="voucher-cutout"></div>
                    </div>

                    <div className="voucher-right">
                      <div className="voucher-main">
                        <div className="v-header">
                           <h3 title={v.title}>{v.title}</h3>
                           {isOwned ? (
                             <div className="v-status redeemed">
                               <CheckCircle2 size={12} /> Đã sở hữu
                             </div>
                           ) : isLocked ? (
                             <div className="v-status locked">
                               <Lock size={12} /> Hạng {v.targetTier}
                             </div>
                           ) : null}
                        </div>
                        <p className="v-description-short">{v.description || "Áp dụng cho mọi dịch vụ tại CarCareHome."}</p>
                        
                        <div className="v-meta-row">
                          <div className="v-points-cost">
                            <Coins size={14} /> 
                            <strong>{v.pointsRequired.toLocaleString()}</strong>
                            <span>pts</span>
                          </div>
                          {v.minOrderValue > 0 && (
                            <div className="v-min-order">Đơn từ {Math.round(v.minOrderValue/1000)}k</div>
                          )}
                        </div>
                      </div>

                      <button 
                        className={`v-redeem-btn ${isOwned ? 'is-owned' : ''} ${isLocked || !canAfford ? 'is-locked' : ''} ${isRedeeming ? 'is-loading' : ''}`}
                        onClick={() => triggerRedeemFlow(v)}
                        disabled={isOwned || isLocked || !canAfford || isRedeeming}
                      >
                        {isRedeeming ? 'Đang đổi...' : isOwned ? 'Đã sở hữu' : isLocked ? `Hạng ${v.targetTier}` : !canAfford ? 'Chưa đủ điểm' : 'Đổi ngay'}
                      </button>
                    </div>
                 </div>
               );
             })}

             {allActiveVouchers.length === 0 && (
               <div className="empty-vouchers">
                 <Ticket size={48} />
                 <p>Hiện tại không có voucher nào đang hoạt động.</p>
               </div>
             )}
           </div>
        </section>

      </div>

      {/* Redeeming Modal */}
      <ConfirmModal 
        isOpen={showConfirmModal}
        title="Xác nhận đổi điểm"
        message={`Dùng ${selectedVoucher?.pointsRequired} điểm để đổi mã "${selectedVoucher?.title}"?`}
        onConfirm={handleConfirmRedeem}
        onCancel={() => setShowConfirmModal(false)}
        confirmText="Xác nhận đổi"
        cancelText="Hủy bỏ"
        type="warning"
      />

      {/* Feedback Modal (Success/Error) */}
      <ConfirmModal 
        isOpen={showSuccessModal}
        title={redeemStatus.success ? "Hoàn tất" : "Không thể đổi"}
        message={redeemStatus.message}
        onConfirm={() => setShowSuccessModal(false)}
        onCancel={() => setShowSuccessModal(false)}
        confirmText="Đóng"
        type={redeemStatus.success ? "info" : "danger"}
      />


      <style>{`
        .loyalty-minimal-page {
          min-height: 100vh;
          background: #020617;
          color: #fff;
          padding: 100px 20px 80px;
          font-family: 'Inter', -apple-system, sans-serif;
        }
        .loyalty-inner-wrapper {
          max-width: 900px;
          margin: 0 auto;
        }
        .loyalty-hero-minimal {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 40px;
          padding: 50px 40px;
          margin-bottom: 50px;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px);
        }
        .hero-main-info {
          text-align: center;
          margin-bottom: 40px;
        }
        .minimal-title {
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 4px;
          font-weight: 800;
          color: #3b82f6;
          margin-bottom: 25px;
        }
        .points-container {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
        }
        .points-label {
          font-size: 0.75rem;
          font-weight: 700;
          opacity: 0.4;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .points-value {
          display: flex;
          align-items: center;
          gap: 15px;
          font-size: 4.5rem;
          font-weight: 950;
          line-height: 1;
        }
        .points-icon { color: #fbbf24; }

        .tier-progress-minimal {
          max-width: 600px;
          margin: 0 auto 30px;
          background: rgba(0,0,0,0.2);
          padding: 25px;
          border-radius: 24px;
        }
        .tier-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .tier-badge-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 100px;
          font-weight: 800;
          font-size: 0.85rem;
        }
        .total-lifetime {
          font-size: 0.8rem;
          font-weight: 600;
          opacity: 0.5;
        }
        .minimal-prog-bg {
          height: 10px;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          margin-bottom: 15px;
        }
        .minimal-prog-fill {
           height: 100%;
           border-radius: 10px;
           box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
           transition: 1.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .prog-labels-minimal p {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.4);
          text-align: center;
          margin: 0;
        }
        .loyalty-quick-rules {
          display: flex;
          justify-content: center;
          gap: 30px;
          padding-top: 30px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .q-rule {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          opacity: 0.5;
        }

        /* Voucher Grid */
        .vouchers-section .section-head {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 30px;
          padding: 0 10px;
        }
        .vouchers-section h2 { font-size: 1.5rem; font-weight: 900; margin: 0; }
        .badge-count {
          background: rgba(255,255,255,0.1);
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          opacity: 0.6;
        }

        .loyalty-vouchers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
          gap: 20px;
        }

        .voucher-compact-card {
           display: flex;
           background: rgba(30, 41, 59, 0.3);
           border: 1px solid rgba(255, 255, 255, 0.08);
           border-radius: 20px;
           height: 180px;
           transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
           position: relative;
        }
        .voucher-compact-card:hover {
          background: rgba(30, 41, 59, 0.5);
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.3);
        }

        .voucher-left {
          width: 70px;
          background: linear-gradient(135deg, #1e293b, #0f172a);
          display: grid;
          place-items: center;
          border-radius: 19px 0 0 19px;
          position: relative;
          color: #3b82f6;
          font-weight: 900;
          font-size: 1.2rem;
          border-right: 2px dashed rgba(255,255,255,0.1);
        }
        /* Ticket punch cutouts */
        .voucher-cutout {
          position: absolute;
          width: 20px;
          height: 20px;
          background: #020617;
          border-radius: 50%;
          right: -11px;
          z-index: 2;
        }
        .voucher-cutout::before { content: ''; position: absolute; top: -85px; width: 20px; height: 20px; background: #020617; border-radius: 50%; }
        .voucher-cutout::after { content: ''; position: absolute; bottom: -85px; width: 20px; height: 20px; background: #020617; border-radius: 50%; }

        .voucher-right {
          flex: 1;
          padding: 20px 25px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .v-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .v-header h3 { 
          margin: 0; 
          font-size: 1.15rem; 
          font-weight: 800; 
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .v-status {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .v-status.redeemed { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .v-status.locked { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }

        .v-description-short {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
          line-height: 1.4;
          margin: 10px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .v-meta-row { display: flex; align-items: center; gap: 15px; }
        .v-points-cost {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #fbbf24;
        }
        .v-points-cost strong { font-size: 1.2rem; font-weight: 950; }
        .v-points-cost span { font-size: 0.65rem; font-weight: 700; opacity: 0.7; }
        .v-min-order {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 8px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
        }

        .v-redeem-btn {
          margin-top: 15px;
          width: 100%;
          height: 44px;
          border-radius: 12px;
          border: none;
          background: #3b82f6;
          color: #fff;
          font-weight: 800;
          font-size: 0.85rem;
          cursor: pointer;
          transition: 0.3s;
        }
        .v-redeem-btn:hover:not(:disabled) {
           background: #2563eb;
           box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }
        .v-redeem-btn:disabled {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.15);
          cursor: not-allowed;
        }
        .v-redeem-btn.is-owned {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .voucher-compact-card.owned { border-color: rgba(16, 185, 129, 0.3); }
        .voucher-compact-card.tier-locked { filter: grayscale(0.8) opacity(0.7); }

        .empty-vouchers {
          grid-column: 1 / -1;
          text-align: center;
          padding: 80px 0;
          opacity: 0.2;
        }

        @media (max-width: 850px) {
          .loyalty-vouchers-grid { grid-template-columns: 1fr; }
          .voucher-compact-card { max-width: 100%; }
        }

        @media (max-width: 600px) {
           .points-value { font-size: 3rem; }
           .loyalty-hero-minimal { padding: 30px 20px; }
        }
      `}</style>
    </div>
  );
};

export default Loyalty;
