import React, { useRef, useState } from 'react';
import { processCashPayment, createMomoRemainingPayment } from '@/services/api';
import { MapPin, Phone, DollarSign, CreditCard, QrCode, Calendar as CalendarIcon } from 'lucide-react';
import toast from 'react-hot-toast';

import ConfirmModal from '@/components/ConfirmModal';

const formatPrice = (value) => 
    `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const TaskCard = ({ task, onStatusUpdate, onRefresh }) => {
    const fileInputRef = useRef(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleCompleteTask = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onStatusUpdate(task.id, 'NEXT', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Xử lý thanh toán tiền mặt (sau khi xác nhận)
    const handleConfirmCash = async () => {
        setIsConfirmOpen(false);
        setPaymentLoading(true);
        try {
            const result = await processCashPayment(task.id);
            if (result?.error) {
                toast.error(result.message || "Lỗi xử lý thanh toán");
                return;
            }
            toast.success("Đã xác nhận thanh toán tiền mặt thành công!");
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error("Cash payment error:", error);
            toast.error("Lỗi kết nối khi xử lý thanh toán");
        } finally {
            setPaymentLoading(false);
        }
    };

    // Xử lý khi nhấn nút MoMo
    const handleMomoPayment = async () => {
        setPaymentLoading(true);
        try {
            const data = await createMomoRemainingPayment(task.id);
            if (data?.payUrl) {
                window.open(data.payUrl, '_blank');
                toast.success("Đã mở trang thanh toán MoMo");
            } else {
                toast.error(data?.message || "Không thể tạo thanh toán MoMo");
            }
        } catch (error) {
            console.error("MoMo payment error:", error);
            toast.error("Lỗi kết nối khi tạo thanh toán MoMo");
        } finally {
            setPaymentLoading(false);
        }
    };

    const remainingAmount = task.paymentStatus === 'PAID_FULL' 
        ? 0 
        : (task.totalPrice || 0) - (task.depositAmount || 0);

    return (
        <div className="booking-item-row" style={{ 
            display: 'grid', 
            gridTemplateColumns: '1.4fr 1.2fr 2fr auto', 
            gap: '30px', 
            alignItems: 'center', 
            padding: '28px 35px',
            background: 'var(--staff-bg-panel)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--staff-border)',
            borderRadius: '24px',
            marginBottom: '15px'
        }}>
            {/* Column 1: Service */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', minWidth: 0 }}>
                <div style={{ 
                    width: '64px', height: '64px', borderRadius: '18px', 
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05))', 
                    display: 'grid', placeItems: 'center',
                    color: 'var(--staff-primary)', flexShrink: 0,
                    border: '1px solid rgba(59, 130, 246, 0.1)'
                }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 28, height: 28 }}>
                        <path d="M19 17h2l.64-2.54c.24-.959.24-1.962 0-2.92l-1.07-4.27A2 2 0 0018.63 6H5.37a2 2 0 00-1.94 1.27l-1.07 4.27c-.24.958-.24 1.961 0 2.92l.64 2.54h2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h3m3 0h2m3 0h3m-9 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-6 0h.01m15 0h.01" />
                    </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                    <p className="eyebrow" style={{ color: 'var(--staff-primary)', opacity: 0.6, fontSize: '0.65rem', margin: '0 0 4px' }}>DỊCH VỤ</p>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.serviceType}</h3>
                </div>
            </div>

            {/* Column 2: Customer */}
            <div style={{ minWidth: 0 }}>
                <p className="eyebrow" style={{ color: 'var(--staff-text-muted)', fontSize: '0.65rem', margin: '0 0 4px' }}>KHÁCH HÀNG</p>
                <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '800', marginBottom: '4px' }}>{task.customerName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--staff-primary)', fontSize: '0.9rem', fontWeight: '600' }}>
                    <Phone size={14}/> {task.customerPhone}
                </div>
            </div>

            {/* Column 3: Address */}
            <div style={{ minWidth: 0 }}>
                <p className="eyebrow" style={{ color: 'var(--staff-text-muted)', fontSize: '0.65rem', margin: '0 0 4px' }}>ĐỊA CHỈ</p>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    <MapPin size={16} color="var(--staff-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.addressName}</span>
                </div>
            </div>

            {/* Column 4: Status & Actions */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                {/* SUCCESS: KTV ACCEPT / REJECT */}
                {task.status === 'SUCCESS' && (
                    <>
                        <button 
                            className="logout-icon-btn" 
                            style={{ width: '50px', height: '50px' }}
                            onClick={() => {
                                if (window.confirm('Bạn có chắc chắn muốn từ chối công việc này?')) {
                                    onStatusUpdate(task.id, 'REJECT');
                                }
                            }}
                        >
                            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                        <button 
                            className="staff-primary-btn" 
                            style={{ padding: '0 30px', height: '50px', borderRadius: '16px', fontSize: '0.95rem', boxShadow: '0 10px 20px var(--staff-primary-glow)' }}
                            onClick={() => onStatusUpdate(task.id, 'NEXT')}
                        >
                            Bắt đầu làm
                        </button>
                    </>
                )}

                {/* IN_PROGRESS: COMPLETE */}
                {task.status === 'IN_PROGRESS' && (
                    <>
                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleCompleteTask} />
                        <button 
                            className="staff-primary-btn" 
                            style={{ 
                                background: 'linear-gradient(135deg, var(--staff-accent), #0891b2)', 
                                padding: '0 30px', height: '50px', borderRadius: '16px', 
                                fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px' 
                            }} 
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            Hoàn tất
                        </button>
                    </>
                )}

                {/* AWAITING_PAYMENT: COLLECT CASH / MOMO */}
                {task.status === 'AWAITING_FINAL_PAYMENT' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            className="staff-primary-btn" 
                            style={{ 
                                background: 'linear-gradient(135deg, #10b981, #059669)', 
                                padding: '0 20px', height: '50px', borderRadius: '16px', fontSize: '0.9rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }} 
                            onClick={() => setIsConfirmOpen(true)}
                            disabled={paymentLoading}
                        >
                            <CreditCard size={18} /> Tiền mặt
                        </button>
                        <button 
                            className="staff-primary-btn" 
                            style={{ 
                                background: 'linear-gradient(135deg, #a855f7, #7c3aed)', 
                                padding: '0 20px', height: '50px', borderRadius: '16px', fontSize: '0.9rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }} 
                            onClick={handleMomoPayment}
                            disabled={paymentLoading}
                        >
                            <QrCode size={18} /> MoMo
                        </button>
                    </div>
                )}

                {/* COMPLETED */}
                {task.status === 'COMPLETED' && (
                    <div style={{ 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        border: '1px solid rgba(16, 185, 129, 0.2)', 
                        color: 'var(--staff-success)', 
                        padding: '12px 24px', 
                        borderRadius: '16px', 
                        fontSize: '1rem', 
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 5 5L20 7"/></svg>
                        Xong
                    </div>
                )}
            </div>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Xác nhận thanh toán"
                message={`Xác nhận đã nhận ${formatPrice(remainingAmount)} tiền mặt từ khách hàng?`}
                onConfirm={handleConfirmCash}
                onCancel={() => setIsConfirmOpen(false)}
                confirmText="Xác nhận"
                cancelText="Hủy"
                icon={<DollarSign size={32} />}
            />
        </div>
    );
};

export default TaskCard;
