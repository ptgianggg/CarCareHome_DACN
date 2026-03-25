import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStaffTasks } from '@/hooks/useStaffTasks';
import TaskCard from './components/TaskCard';
import { MapPin, Phone, Car, Clock, Calendar as CalendarIcon, DollarSign } from 'lucide-react';

const formatPrice = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const MyTasks = () => {
    const { user } = useAuth();
    const { tasks, loading, handleStatusUpdate, fetchTasks } = useStaffTasks(user?.email);
    
    const [activeTab, setActiveTab] = useState('upcoming');
    const [selectedTask, setSelectedTask] = useState(null);

    const stats = useMemo(() => {
        return {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'COMPLETED').length,
            pending: tasks.filter(t => t.status === 'SUCCESS' || t.status === 'PENDING').length,
            awaitingPayment: tasks.filter(t => t.status === 'AWAITING_FINAL_PAYMENT').length,
        };
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (activeTab === 'upcoming') return t.status === 'SUCCESS' || t.status === 'PENDING';
            if (activeTab === 'in_progress') return t.status === 'IN_PROGRESS';
            if (activeTab === 'awaiting_payment') return t.status === 'AWAITING_FINAL_PAYMENT';
            if (activeTab === 'completed') return t.status === 'COMPLETED';
            return true;
        });
    }, [tasks, activeTab]);

    if (loading) return <div style={{ color: 'white', padding: '100px', textAlign: 'center' }} className="spinner-heavy"></div>;

    return (
        <div className="dashboard" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <header className="topbar" style={{ marginBottom: '40px' }}>
                <div>
                    <p className="eyebrow" style={{ color: "var(--staff-primary)", opacity: 0.8 }}>PHÂN TỔ CÔNG VIỆC</p>
                    <h2 style={{ 
                        fontSize: '2.8rem', 
                        fontWeight: '900', 
                        letterSpacing: '-0.04em', 
                        background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.4))', 
                        WebkitBackgroundClip: 'text', 
                        WebkitTextFillColor: 'transparent',
                        margin: 0
                    }}>
                        Nhiệm Vụ Của Tôi
                    </h2>
                </div>
            </header>

            {/* Quick Stats */}
            <section className="stats-grid" style={{ marginBottom: '40px' }}>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), transparent)', backdropFilter: 'blur(10px)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <p className="eyebrow" style={{ color: 'var(--staff-primary)' }}>TỔNG CÔNG VIỆC</p>
                    <strong style={{ textShadow: '0 0 30px rgba(59, 130, 246, 0.4)' }}>{stats.total}</strong>
                    <span style={{ opacity: 0.5 }}>Công việc hệ thống</span>
                </div>
                <div className="stat-card" style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderLeft: '5px solid var(--staff-accent)' }}>
                    <p className="eyebrow">CẦN THỰC HIỆN</p>
                    <strong style={{ color: 'var(--staff-accent)' }}>{stats.pending}</strong>
                    <span style={{ opacity: 0.5 }}>Đang chờ xử lý</span>
                </div>
                <div className="stat-card" style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', borderLeft: '5px solid #a855f7' }}>
                    <p className="eyebrow">CHỜ THANH TOÁN</p>
                    <strong style={{ color: '#a855f7' }}>{stats.awaitingPayment}</strong>
                    <span style={{ opacity: 0.5 }}>Đợi khách trả tiền</span>
                </div>
                <div className="stat-card" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderLeft: '5px solid var(--staff-success)' }}>
                    <p className="eyebrow">ĐÃ HOÀN TẤT</p>
                    <strong style={{ color: 'var(--staff-success)' }}>{stats.completed}</strong>
                    <span style={{ opacity: 0.5 }}>Nhiệm vụ xong</span>
                </div>
            </section>

            <article className="panel" style={{ padding: '0', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', overflow: 'hidden' }}>
                {/* Tabs Bar */}
                <div style={{ padding: '25px 30px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '15px', overflowX: 'auto' }}>
                    {[
                        { id: 'upcoming', label: 'Sắp làm', count: stats.pending },
                        { id: 'in_progress', label: 'Đang thực hiện' },
                        { id: 'awaiting_payment', label: 'Chờ thanh toán', count: stats.awaitingPayment, color: '#a855f7' },
                        { id: 'completed', label: 'Đã hoàn tất', count: stats.completed }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)} 
                            style={{ 
                                background: activeTab === tab.id ? (tab.color ? `${tab.color}22` : 'rgba(59, 130, 246, 0.15)') : 'rgba(255,255,255,0.03)', 
                                color: activeTab === tab.id ? (tab.color || 'var(--staff-primary)') : '#94a3b8', 
                                border: '1px solid',
                                borderColor: activeTab === tab.id ? (tab.color || 'var(--staff-primary)') : 'rgba(255,255,255,0.1)',
                                padding: '10px 24px', 
                                borderRadius: '16px', 
                                cursor: 'pointer', 
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {tab.label}
                            {tab.count !== undefined && (
                                <span style={{ 
                                    background: activeTab === tab.id ? (tab.color || 'var(--staff-primary)') : 'rgba(255,255,255,0.1)', 
                                    color: activeTab === tab.id ? '#fff' : '#94a3b8',
                                    padding: '2px 8px',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem'
                                }}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div style={{ padding: '30px', display: 'grid', gap: '20px' }}>
                    {filteredTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 0', opacity: 0.5 }}>
                            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📋</div>
                            <p style={{ fontSize: '1.1rem' }}>Bạn không có công việc nào trong danh mục này.</p>
                        </div>
                    ) : (
                        filteredTasks.map(task => (
                            <div key={task.id} 
                                onClick={(e) => {
                                    if(e.target.closest('button') || e.target.tagName === 'INPUT') return;
                                    setSelectedTask(task);
                                }}
                                style={{
                                    transition: 'transform 0.3s, background 0.3s',
                                    borderRadius: '20px',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(8px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                            >
                                <TaskCard 
                                    task={task} 
                                    onStatusUpdate={handleStatusUpdate}
                                    onRefresh={fetchTasks}
                                />
                            </div>
                        ))
                    )}
                </div>
            </article>

            {/* Modal Detail */}
            {selectedTask && (
                <div style={{ 
                    position: 'fixed', inset: 0, 
                    background: 'rgba(2, 6, 23, 0.9)', 
                    backdropFilter: 'blur(15px)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    padding: '20px', zIndex: 1000 
                }} onClick={() => setSelectedTask(null)}>
                    <div style={{ 
                        width: '100%', maxWidth: '750px', 
                        background: 'var(--staff-bg-mid)', 
                        borderRadius: '32px', 
                        border: '1px solid var(--staff-border)', 
                        overflow: 'hidden', 
                        boxShadow: '0 25px 100px rgba(0,0,0,0.8)',
                        animation: 'modalScale 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)' 
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '30px 40px', borderBottom: '1px solid var(--staff-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p className="eyebrow" style={{ color: 'var(--staff-primary)', margin: 0 }}>CHI TIẾT NHIỆM VỤ</p>
                                <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900' }}>#{selectedTask.id}</h2>
                            </div>
                            <button onClick={() => setSelectedTask(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', width: '45px', height: '45px', borderRadius: '15px', display: 'grid', placeItems: 'center', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                        </div>
                        
                        <div style={{ padding: '40px', maxHeight: '75vh', overflowY: 'auto' }}>
                            <div style={{ 
                                background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.05))', 
                                padding: '30px', borderRadius: '24px', marginBottom: '30px', 
                                border: '1px solid rgba(59, 130, 246, 0.2)' 
                            }}>
                                <h3 style={{ margin: '0 0 20px', color: 'var(--staff-primary)', fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Car size={24} /> {selectedTask.serviceType}
                                </h3>
                                
                                <div style={{ display: 'grid', gap: '16px', fontSize: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center' }}><CalendarIcon size={18} color="var(--staff-text-muted)" /></div>
                                        <span>Ngày hẹn: <strong style={{color: '#fff'}}>{selectedTask.bookingDate} {selectedTask.bookingTime}</strong></span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><MapPin size={18} color="var(--staff-text-muted)" /></div>
                                        <span>Địa chỉ: <strong style={{color: '#fff'}}>{selectedTask.addressName}</strong></span>
                                    </div>
                                    {selectedTask.distance != null && (
                                        <div style={{ marginLeft: '48px', fontSize: '0.9rem', color: 'var(--staff-accent)', fontWeight: '600' }}>
                                             Khoảng cách: {selectedTask.distance} km
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', marginBottom: '30px' }}>
                                <div>
                                    <h4 style={{ color: 'var(--staff-text-muted)', marginBottom: '15px', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1px' }}>KHÁCH HÀNG</h4>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ margin: '0 0 10px', fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>{selectedTask.customerName}</p>
                                        <p style={{ margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--staff-primary)', fontWeight: '600' }}><Phone size={16}/> {selectedTask.customerPhone}</p>
                                        <p style={{ margin: 0, color: 'var(--staff-text-muted)', fontSize: '0.9rem' }}>{selectedTask.vehicleType} • <strong style={{color: '#fff', fontSize: '1rem'}}>{selectedTask.vehiclePlate}</strong></p>
                                    </div>
                                </div>
                                <div>
                                    <h4 style={{ color: 'var(--staff-text-muted)', marginBottom: '15px', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1px' }}>GHI CHÚ</h4>
                                    <div style={{ 
                                        height: 'calc(100% - 30px)',
                                        background: selectedTask.note ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.02)', 
                                        padding: '20px', borderRadius: '20px', 
                                        fontStyle: 'italic', borderLeft: `4px solid ${selectedTask.note ? 'var(--staff-primary)' : 'rgba(255,255,255,0.1)'}`,
                                        color: selectedTask.note ? '#fff' : 'var(--staff-text-muted)',
                                        display: 'flex', alignItems: 'center'
                                    }}>
                                        {selectedTask.note ? `"${selectedTask.note}"` : "Không có ghi chú"}
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', padding: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h4 style={{ color: 'var(--staff-text-muted)', marginBottom: '20px', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1px' }}>
                                    <DollarSign size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> THANH TOÁN
                                </h4>
                                <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--staff-text-muted)' }}>Tổng phí dịch vụ:</span>
                                        <span style={{ fontWeight: '600' }}>{formatPrice(selectedTask.totalPrice)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--staff-text-muted)' }}>Khách đã đặt cọc:</span>
                                        <span style={{ color: 'var(--staff-success)', fontWeight: '600' }}>- {formatPrice(selectedTask.depositAmount)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0 0', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '5px' }}>
                                        <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>TIỀN CẦN THU:</span>
                                        <span style={{ color: 'var(--staff-primary)', fontSize: '1.8rem', fontWeight: '900' }}>
                                            {selectedTask.paymentStatus === 'PAID_FULL' ? "0 ₫" : formatPrice(selectedTask.totalPrice - (selectedTask.depositAmount || 0))}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ 
                                    display: 'flex', alignItems: 'center', gap: '12px', 
                                    padding: '15px 20px', borderRadius: '15px',
                                    background: selectedTask.paymentStatus === 'PAID_FULL' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                    border: `1px solid ${selectedTask.paymentStatus === 'PAID_FULL' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)'}`
                                }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: selectedTask.paymentStatus === 'PAID_FULL' ? 'var(--staff-success)' : '#fbbf24' }}></div>
                                    <span style={{ fontSize: '0.95rem', fontWeight: '700', color: selectedTask.paymentStatus === 'PAID_FULL' ? 'var(--staff-success)' : '#fbbf24' }}>
                                        {selectedTask.paymentStatus === 'PAID_FULL' ? "Thanh toán đầy đủ" : "Chưa hoàn tất thanh toán"}
                                    </span>
                                </div>

                                {selectedTask.proofImage && (
                                    <div style={{ marginTop: '30px' }}>
                                        <h4 style={{ color: 'var(--staff-text-muted)', marginBottom: '15px', fontSize: '0.8rem', fontWeight: '800' }}>ẢNH NGHIỆM THU</h4>
                                        <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <img src={selectedTask.proofImage} alt="Proof" style={{ width: '100%', display: 'block' }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div style={{ padding: '25px 40px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--staff-border)', textAlign: 'right' }}>
                            <button onClick={() => setSelectedTask(null)} style={{ padding: '14px 35px', background: 'var(--staff-primary)', color: '#fff', fontWeight: '900', border: 'none', borderRadius: '18px', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 10px 20px var(--staff-primary-glow)' }}>ĐÓNG</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTasks;
