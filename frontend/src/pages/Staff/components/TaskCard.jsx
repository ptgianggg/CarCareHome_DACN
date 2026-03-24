import React, { useRef } from 'react';

const formatPrice = (value) => 
    `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const TaskCard = ({ task, onStatusUpdate }) => {
    const fileInputRef = useRef(null);

    const handleCompleteTask = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Sử dụng 'NEXT' thay vì hardcode 'COMPLETED' để tuân thủ State Pattern
                onStatusUpdate(task.id, 'NEXT', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="staff-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{ 
                    width: '60px', height: '60px', borderRadius: '14px', 
                    background: 'var(--staff-glass-strong)', display: 'grid', placeItems: 'center',
                    color: 'var(--staff-primary)'
                }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}>
                        <path d="M19 17h2l.64-2.54c.24-.959.24-1.962 0-2.92l-1.07-4.27A2 2 0 0018.63 6H5.37a2 2 0 00-1.94 1.27l-1.07 4.27c-.24.958-.24 1.961 0 2.92l.64 2.54h2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h3m3 0h2m3 0h3m-9 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-6 0h.01m15 0h.01" />
                    </svg>
                </div>
                <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>{task.serviceType}</h3>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: 'var(--staff-text-soft)' }}>
                        <span>👤 {task.customerName}</span>
                        <span>🚗 {task.vehiclePlate}</span>
                        <span>📅 {task.bookingDate} {task.bookingTime}</span>
                        <span className={`status-badge status-${task.status?.toLowerCase()}`}>
                            {task.status}
                        </span>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '1rem', fontWeight: '800', color: 'var(--staff-primary)' }}>
                        Tiền cần thu: {formatPrice(task.totalPrice - (task.depositAmount || 0))}
                        <small style={{ marginLeft: '10px', fontSize: '0.75rem', color: 'var(--staff-text-muted)', fontWeight: '400' }}>
                            (Tổng: {formatPrice(task.totalPrice)} - Cọc: {formatPrice(task.depositAmount)})
                        </small>
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                {task.status === 'SUCCESS' && (
                    <button className="staff-primary-btn" onClick={() => onStatusUpdate(task.id, 'NEXT')}>
                        Bắt đầu làm
                    </button>
                )}
                {task.status === 'IN_PROGRESS' && (
                    <>
                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleCompleteTask} />
                        <button className="staff-primary-btn" style={{ background: 'var(--staff-accent)' }} onClick={() => fileInputRef.current?.click()}>
                            Chụp ảnh nghiệm thu & Hoàn tất
                        </button>
                    </>
                )}
                {task.status === 'COMPLETED' && (
                    <span style={{ color: 'var(--staff-accent)', fontWeight: '600' }}>Đã hoàn thành</span>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
