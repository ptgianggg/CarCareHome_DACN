import React, { useState, useEffect } from 'react';
import { getAllLeaves, updateLeaveStatus } from '@/services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import { CalendarOff, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import './style.css'; 

const LeaveManagement = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmData, setConfirmData] = useState(null); 
    
    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const data = await getAllLeaves();
            setLeaves(data || []);
        } catch {
            toast.error("Lỗi lấy danh sách nghỉ phép");
        } finally {
            setLoading(false);
        }
    };

    const triggerConfirm = (id, status) => {
        const isApprove = status === 'APPROVED';
        setConfirmData({
            id,
            status,
            title: isApprove ? "Duyệt đơn nghỉ" : "Từ chối đơn nghỉ",
            message: `Bạn có chắc chắn muốn ${isApprove ? 'duyệt' : 'từ chối'} đơn xin nghỉ này không?`,
            color: isApprove ? "#10b981" : "#ef4444",
            icon: isApprove ? <CheckCircle size={32} /> : <XCircle size={32} />
        });
    };

    const handleUpdateStatus = async () => {
        if (!confirmData) return;
        const { id, status } = confirmData;
        const actionLabel = status === 'APPROVED' ? 'duyệt' : 'từ chối';
        
        try {
            await updateLeaveStatus(id, status);
            toast.success(`Đã ${actionLabel} thành công`);
            setConfirmData(null);
            fetchLeaves();
        } catch {
            toast.error(`Lỗi thao tác`);
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'APPROVED': return <span style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}>Đã duyệt (Off)</span>;
            case 'REJECTED': return <span style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}>Bị từ chối</span>;
            case 'RESTORED': return <span style={{ color: '#94a3b8', background: 'rgba(148, 163, 184, 0.1)', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}>Đã hồi phục (Đi làm lại)</span>;
            default: return <span style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}>Đang chờ duyệt</span>;
        }
    };

    return (
        <>
            <header className="topbar">
                <div>
                    <p className="eyebrow" style={{ color: "var(--admin-primary)", opacity: 0.8 }}>SYSTEM MANAGEMENT</p>
                    <h2 style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.04em', background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.4))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Quản Lý Nghỉ Phép</h2>
                </div>
            </header>

            <section className="service-layout">
                <article className="panel" style={{ padding: '0', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', overflow: 'hidden' }}>
                    <div className="panel-heading" style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <CalendarOff size={24} color="#38bdf8" />
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Danh sách Đơn Nghỉ Phép</h3>
                    </div>

                    <div className="booking-index-table">
                        <div className="booking-index-head" style={{ padding: '20px 30px', background: 'transparent', opacity: 0.5, fontWeight: '800', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr 1fr 1fr', gap: '15px' }}>
                            <span>Nhân viên</span>
                            <span>Thời gian nghỉ</span>
                            <span>Lý do</span>
                            <span style={{ textAlign: 'center' }}>Trạng thái</span>
                            <span style={{ textAlign: 'right' }}>Thao tác</span>
                        </div>

                        {loading ? (
                            <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8' }}>Đang tải dữ liệu...</div>
                        ) : leaves.length === 0 ? (
                            <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>Không có đơn nghỉ phép nào.</div>
                        ) : (
                            leaves.map(l => (
                                <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr 1fr 1fr', gap: '15px', padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center', color: '#e2e8f0' }}>
                                    <div style={{ fontWeight: 'bold' }}>{l.staffName}</div>
                                    <div style={{ fontSize: '0.85rem' }}>
                                        {l.startDate} {l.startDate !== l.endDate ? <><br/><span style={{opacity: 0.5}}>đến</span> {l.endDate}</> : ''}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic' }}>{l.reason}</div>
                                    <div style={{ textAlign: 'center' }}>{getStatusBadge(l.status)}</div>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        {l.status === 'PENDING' ? (
                                            <>
                                                <button onClick={() => triggerConfirm(l.id, 'APPROVED')} title="Duyệt" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981', padding: '10px', borderRadius: '12px', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}>
                                                    <CheckCircle size={20} />
                                                </button>
                                                <button onClick={() => triggerConfirm(l.id, 'REJECTED')} title="Từ chối" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '10px', borderRadius: '12px', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}>
                                                    <XCircle size={20} />
                                                </button>
                                            </>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>-</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </article>
            </section>

            <ConfirmModal 
                isOpen={!!confirmData}
                title={confirmData?.title}
                message={confirmData?.message}
                onConfirm={handleUpdateStatus}
                onCancel={() => setConfirmData(null)}
                confirmText="Xác nhận"
                color={confirmData?.color}
                icon={confirmData?.icon}
            />
        </>
    );
};

export default LeaveManagement;
