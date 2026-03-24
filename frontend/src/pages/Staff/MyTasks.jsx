import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStaffTasks } from '@/hooks/useStaffTasks';
import TaskCard from './components/TaskCard';
import { MapPin, Phone, Car, Clock, Calendar as CalendarIcon } from 'lucide-react';

const formatPrice = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const MyTasks = () => {
    const { user } = useAuth();
    const { tasks, loading, handleStatusUpdate } = useStaffTasks(user?.email);
    
    const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, in_progress, completed
    const [selectedTask, setSelectedTask] = useState(null);

    const stats = useMemo(() => {
        return {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'COMPLETED').length,
            pending: tasks.filter(t => t.status === 'SUCCESS' || t.status === 'PENDING').length,
        };
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (activeTab === 'upcoming') return t.status === 'SUCCESS' || t.status === 'PENDING';
            if (activeTab === 'in_progress') return t.status === 'IN_PROGRESS';
            if (activeTab === 'completed') return t.status === 'COMPLETED';
            return true;
        });
    }, [tasks, activeTab]);

    if (loading) return <div style={{ color: 'white', padding: '100px', textAlign: 'center' }} className="spinner-heavy"></div>;

    return (
        <div className="tasks-container" style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', color: '#fff' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', margin: '0 0 8px' }}>Nhiệm vụ của tôi</h1>
                <p style={{ color: 'var(--staff-text-muted)' }}>Quản lý và thực hiện các dịch vụ đã được phân công.</p>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <p style={{ margin: '0 0 5px', fontSize: '0.85rem', color: '#94a3b8' }}>TỔNG CÔNG VIỆC</p>
                    <h2 style={{ margin: 0, fontSize: '2rem', color: '#38bdf8' }}>{stats.total}</h2>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <p style={{ margin: '0 0 5px', fontSize: '0.85rem', color: '#94a3b8' }}>CẦN THỰC HIỆN</p>
                    <h2 style={{ margin: 0, fontSize: '2rem', color: '#fbbf24' }}>{stats.pending}</h2>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <p style={{ margin: '0 0 5px', fontSize: '0.85rem', color: '#94a3b8' }}>ĐÃ HOÀN TẤT</p>
                    <h2 style={{ margin: 0, fontSize: '2rem', color: '#10b981' }}>{stats.completed}</h2>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                <button onClick={() => setActiveTab('upcoming')} style={{ background: activeTab === 'upcoming' ? 'rgba(56, 189, 248, 0.2)' : 'transparent', color: activeTab === 'upcoming' ? '#38bdf8' : '#94a3b8', border: 'none', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}>Sắp làm ({stats.pending})</button>
                <button onClick={() => setActiveTab('in_progress')} style={{ background: activeTab === 'in_progress' ? 'rgba(56, 189, 248, 0.2)' : 'transparent', color: activeTab === 'in_progress' ? '#38bdf8' : '#94a3b8', border: 'none', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}>Đang thực hiện</button>
                <button onClick={() => setActiveTab('completed')} style={{ background: activeTab === 'completed' ? 'rgba(56, 189, 248, 0.2)' : 'transparent', color: activeTab === 'completed' ? '#38bdf8' : '#94a3b8', border: 'none', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}>Đã hoàn tất ({stats.completed})</button>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
                {filteredTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <p style={{ color: 'var(--staff-text-muted)' }}>Bạn không có công việc nào trong danh mục này.</p>
                    </div>
                ) : (
                    filteredTasks.map(task => (
                        <div key={task.id} onClick={(e) => {
                            // Prevent triggering modal when clicking buttons or inputs inside TaskCard
                            if(e.target.closest('button') || e.target.tagName === 'INPUT') return;
                            setSelectedTask(task);
                        }}>
                            <TaskCard 
                                task={task} 
                                onStatusUpdate={handleStatusUpdate} 
                            />
                        </div>
                    ))
                )}
            </div>

            {/* Modal Detail */}
            {selectedTask && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }} onClick={() => setSelectedTask(null)}>
                    <div style={{ width: '100%', maxWidth: '600px', background: '#1e293b', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', animation: 'modalScale 0.3s cubic-bezier(0.17, 0.89, 0.32, 1.28)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Chi tiết Công việc #{selectedTask.id}</h2>
                            <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                        </div>
                        
                        <div style={{ padding: '25px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                                <h3 style={{ margin: '0 0 15px', color: '#38bdf8', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Car size={18} /> {selectedTask.serviceType}</h3>
                                
                                <div style={{ display: 'grid', gap: '12px', fontSize: '0.95rem' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <CalendarIcon size={16} color="#94a3b8" />
                                        <span>Ngày hẹn: <strong style={{color: '#fff'}}>{selectedTask.bookingDate} {selectedTask.bookingTime}</strong></span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <MapPin size={16} color="#94a3b8" style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <span>Địa chỉ: <strong style={{color: '#fff'}}>{selectedTask.addressName}</strong></span>
                                    </div>
                                    {selectedTask.distance != null && (
                                        <div style={{ marginLeft: '26px', fontSize: '0.85rem', color: '#fbbf24' }}>
                                             Khoảng cách di chuyển: {selectedTask.distance} km
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: '25px' }}>
                                <h4 style={{ color: '#94a3b8', marginBottom: '10px', fontSize: '0.85rem', letterSpacing: '0.5px' }}>THÔNG TIN KHÁCH HÀNG</h4>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px' }}>
                                    <p style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#fff' }}><strong>{selectedTask.customerName}</strong></p>
                                    <p style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}><Phone size={14} color="#38bdf8"/> {selectedTask.customerPhone}</p>
                                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Chủng loại xe: {selectedTask.vehicleType} - Biển số: <strong style={{color: '#fff'}}>{selectedTask.vehiclePlate}</strong></p>
                                </div>
                            </div>

                            {selectedTask.note && (
                                <div style={{ marginBottom: '25px' }}>
                                    <h4 style={{ color: '#94a3b8', marginBottom: '10px', fontSize: '0.85rem', letterSpacing: '0.5px' }}>GHI CHÚ KÈM THEO</h4>
                                    <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '15px', borderRadius: '12px', fontStyle: 'italic', borderLeft: '3px solid #fbbf24', color: '#fde68a' }}>
                                        "{selectedTask.note}"
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 style={{ color: '#94a3b8', marginBottom: '10px', fontSize: '0.85rem', letterSpacing: '0.5px' }}>THU TIỀN TẬN NƠI</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                    <span style={{ color: '#e2e8f0', fontWeight: '500' }}>Cần thu thực tế:</span>
                                    <span style={{ color: '#38bdf8', fontSize: '1.2rem', fontWeight: '800' }}>
                                        {selectedTask.paymentStatus === 'PAID_FULL' ? "0 ₫" : formatPrice(selectedTask.totalPrice - (selectedTask.depositAmount || 0))}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                                    {selectedTask.paymentStatus === 'PAID_FULL' 
                                        ? "(Đã thanh toán 100% qua MoMo)" 
                                        : `(Tổng: ${formatPrice(selectedTask.totalPrice)} • Đã cọc: ${formatPrice(selectedTask.depositAmount)})`}
                                </div>
                                {selectedTask.proofImage && (
                                    <div style={{ marginTop: '20px' }}>
                                        <h4 style={{ color: '#94a3b8', marginBottom: '10px', fontSize: '0.85rem', letterSpacing: '0.5px' }}>ẢNH NGHIỆM THU</h4>
                                        <img src={selectedTask.proofImage} alt="Proof" style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    </div>
                                )}
                            </div>

                        </div>
                        
                        <div style={{ padding: '20px 25px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>
                            <button onClick={() => setSelectedTask(null)} style={{ padding: '12px 24px', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>Đóng chi tiết</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTasks;
