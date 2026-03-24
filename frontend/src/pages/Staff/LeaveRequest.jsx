import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createLeaveRequest, getMyLeaves, updateLeaveStatus } from '@/services/api';
import toast from 'react-hot-toast';
import { Calendar, FileText, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

const LeaveRequest = () => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (user?.email) {
            fetchLeaves();
        }
    }, [user?.email, fetchLeaves]);

    const fetchLeaves = React.useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMyLeaves(user?.email);
            setLeaves(data || []);
        } catch {
            toast.error("Lỗi tải danh sách nghỉ phép");
        } finally {
            setLoading(false);
        }
    }, [user?.email]);

    const calculateDays = (start, end) => {
        if (!start || !end) return 0;
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = e.getTime() - s.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays + 1; // inclusive
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!startDate || !endDate || !reason.trim()) {
            return toast.error("Vui lòng điền đầy đủ thông tin");
        }
        if (startDate < today) {
            return toast.error("Không được chọn ngày trong quá khứ");
        }
        if (endDate < startDate) {
            return toast.error("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
        }
        
        const days = calculateDays(startDate, endDate);
        if (days > 2) {
            return toast.error("Chỉ được xin nghỉ tối đa 2 ngày liên tiếp");
        }

        setSubmitting(true);
        try {
            await createLeaveRequest(user.email, { startDate, endDate, reason });
            toast.success("Đã gửi đơn xin nghỉ phép");
            setStartDate('');
            setEndDate('');
            setReason('');
            fetchLeaves();
        } catch (error) {
            toast.error(error?.message || "Lỗi khi gửi đơn xin nghỉ");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRestore = async (id) => {
        if (window.confirm("Bạn muốn khôi phục lại công việc và hủy bỏ lịch nghỉ phép này?")) {
            try {
                await updateLeaveStatus(id, 'RESTORED');
                toast.success("Đã khôi phục thành công");
                fetchLeaves();
            } catch {
                toast.error("Lỗi khôi phục");
            }
        }
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'APPROVED': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', label: 'Đã duyệt' };
            case 'REJECTED': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', label: 'Từ chối' };
            case 'RESTORED': return { bg: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', label: 'Đã khôi phục (Đi làm lại)' };
            default: return { bg: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', label: 'Chờ duyệt' };
        }
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', color: '#fff' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', margin: '0 0 8px' }}>Xin nghỉ phép</h1>
                <p style={{ color: 'var(--staff-text-muted)' }}>Gửi đơn xin nghỉ phép (tối đa 2 ngày) và quản lý lịch nghỉ của bạn.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
                {/* Form xin nghỉ */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '25px', backdropFilter: 'blur(20px)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18}/> Tạo đơn mới</h2>
                    
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>Ngày bắt đầu nghỉ</label>
                            <input 
                                type="date" 
                                min={today}
                                value={startDate}
                                onChange={e => {
                                    setStartDate(e.target.value);
                                    if (!endDate || e.target.value > endDate) setEndDate(e.target.value);
                                }}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>Ngày kết thúc</label>
                            <input 
                                type="date" 
                                min={startDate || today}
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>Lý do (Bắt buộc)</label>
                                {startDate && endDate && (
                                    <span style={{ fontSize: '0.85rem', color: calculateDays(startDate, endDate) > 2 ? '#ef4444' : '#38bdf8' }}>
                                        {calculateDays(startDate, endDate)} ngày
                                    </span>
                                )}
                            </div>
                            <textarea 
                                rows="3"
                                placeholder="Nhập lý do nghỉ phép..."
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'vertical' }}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting}
                            style={{ 
                                width: '100%', padding: '14px', borderRadius: '12px', 
                                background: 'linear-gradient(to right, #38bdf8, #0ea5e9)', 
                                color: '#0f172a', fontWeight: 'bold', border: 'none', 
                                cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1
                            }}
                        >
                            {submitting ? 'ĐANG GỬI...' : 'GỬI ĐƠN'}
                        </button>
                    </form>
                </div>

                {/* Danh sách nghỉ phép */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '25px', backdropFilter: 'blur(20px)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18}/> Lịch sử đơn nghỉ phép</h2>
                    
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div>
                    ) : leaves.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                            Chưa có dữ liệu nghỉ phép.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {leaves.map(req => {
                                const st = getStatusStyle(req.status);
                                return (
                                    <div key={req.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                <strong style={{ fontSize: '1.1rem' }}>{req.startDate} {req.startDate !== req.endDate ? `đến ${req.endDate}` : ''}</strong>
                                                <span style={{ background: st.bg, color: st.color, padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                    {st.label}
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Lý do: {req.reason}</p>
                                        </div>
                                        <div>
                                            {/* Nút khôi phục chỉ cho các đơn đang APPROVED */}
                                            {req.status === 'APPROVED' && (
                                                <button 
                                                    onClick={() => handleRestore(req.id)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.3)', color: '#38bdf8', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                                >
                                                    <RotateCcw size={16} /> Khôi phục việc
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaveRequest;
