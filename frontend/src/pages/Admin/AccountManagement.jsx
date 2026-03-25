import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUsers, updateUserRole, deleteUser } from '@/services/api';
import toast from 'react-hot-toast';
import { Users, Shield, Trash2, Search, ArrowRightLeft } from 'lucide-react';
import './style.css'; // Reusing admin styling

const AccountManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('USER'); // 'USER' | 'STAFF'

    const { user: currentUser } = useAuth();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data || []);
        } catch {
            toast.error("Lỗi lấy danh sách tài khoản");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        if (currentUser && userId === currentUser.id) {
            toast.error("Bạn không thể tự thay đổi quyền hạn của chính mình!");
            return;
        }
        const actionLabel = newRole === 'STAFF' ? 'cấp quyền Staff' : 'thu hồi quyền Staff (đổi thành User)';
        if (window.confirm(`Bạn có chắc chắn muốn ${actionLabel} cho tài khoản này?`)) {
            try {
                const res = await updateUserRole(userId, newRole);
                if (res && res.error) {
                    toast.error(res.message || "Lỗi cập nhật quyền");
                } else {
                    toast.success("Đã cập nhật phân quyền thành công!");
                    fetchData();
                }
            } catch {
                toast.error("Đã xảy ra lỗi mạng");
            }
        }
    };

    const handleDelete = async (userId) => {
        if (currentUser && userId === currentUser.id) {
            toast.error("HÀNH ĐỘNG BỊ CHẶN: Bạn không thể tự xóa tài khoản của chính mình!");
            return;
        }
        if (window.confirm("HÀNH ĐỘNG NGUY HIỂM: Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này? Thao tác này có thể không thực hiện được nếu người dùng đang có đơn/lịch hẹn.")) {
            try {
                const res = await deleteUser(userId);
                if (res && res.error) {
                    toast.error(res.message || "Không thể xóa tài khoản");
                } else {
                    toast.success("Đã xóa tài khoản thành công!");
                    fetchData();
                }
            } catch {
                toast.error("Đã xảy ra lỗi mạng");
            }
        }
    };

    const filteredUsers = useMemo(() => {
        const searchFiltered = users.filter(u => 
            (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (activeTab === 'STAFF') {
            return searchFiltered.filter(u => u.role?.name === 'STAFF' || u.role?.name === 'ROLE_STAFF');
        } else {
            return searchFiltered.filter(u => u.role?.name === 'USER' || u.role?.name === 'ROLE_USER');
        }
    }, [users, searchTerm, activeTab]);

    return (
        <>
            <header className="topbar">
                <div>
                <p className="eyebrow" style={{ color: "var(--admin-primary)", opacity: 0.8 }}>SYSTEM MANAGEMENT</p>
                <h2 style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.04em', background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.4))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Phân Quyền & Tài Khoản</h2>
                </div>
            </header>

            {/* Thống kê nhanh */}
            <section className="stats-grid" style={{ marginBottom: '40px' }}>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), transparent)', backdropFilter: 'blur(10px)', border: '1px solid rgba(59, 130, 246, 0.3)' }} onClick={() => setActiveTab('USER')}>
                    <p className="eyebrow">KHÁCH HÀNG (USER)</p>
                    <strong style={{ color: '#60a5fa' }}>{users.filter(u => u.role?.name === 'USER' || u.role?.name === 'ROLE_USER').length}</strong>
                    <span style={{ opacity: 0.5 }}>Tài khoản thường</span>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), transparent)', backdropFilter: 'blur(10px)', border: '1px solid rgba(16, 185, 129, 0.3)' }} onClick={() => setActiveTab('STAFF')}>
                    <p className="eyebrow">NHÂN VIÊN (STAFF)</p>
                    <strong style={{ color: '#34d399' }}>{users.filter(u => u.role?.name === 'STAFF' || u.role?.name === 'ROLE_STAFF').length}</strong>
                    <span style={{ opacity: 0.5 }}>Kỹ thuật viên</span>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), transparent)', backdropFilter: 'blur(10px)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                    <p className="eyebrow">QUẢN TRỊ VIÊN (ADMIN)</p>
                    <strong style={{ color: '#a78bfa' }}>{users.filter(u => u.role?.name === 'ADMIN' || u.role?.name === 'ROLE_ADMIN').length}</strong>
                    <span style={{ opacity: 0.5 }}>Hệ thống lõi</span>
                </div>
            </section>

            <section className="service-layout">
                <article className="panel" style={{ padding: '0', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', overflow: 'hidden' }}>
                    
                    {/* Controls */}
                    <div className="panel-heading" style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button 
                                onClick={() => setActiveTab('USER')}
                                style={{ 
                                    padding: '12px 25px', borderRadius: '14px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)',
                                    background: activeTab === 'USER' ? 'var(--admin-primary)' : 'rgba(0,0,0,0.3)',
                                    color: activeTab === 'USER' ? '#0f172a' : '#94a3b8',
                                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <Users size={18} /> Khách hàng
                            </button>
                            <button 
                                onClick={() => setActiveTab('STAFF')}
                                style={{ 
                                    padding: '12px 25px', borderRadius: '14px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)',
                                    background: activeTab === 'STAFF' ? '#10b981' : 'rgba(0,0,0,0.3)',
                                    color: activeTab === 'STAFF' ? '#0f172a' : '#94a3b8',
                                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <Shield size={18} /> Nhân viên kỹ thuật
                            </button>
                        </div>

                        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                            <input 
                                type="text" 
                                placeholder="Tìm theo tên, email..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', height: '50px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff', padding: '0 20px 0 50px', fontSize: '0.95rem' }} 
                            />
                            <Search size={18} style={{ position: 'absolute', top: '50%', left: '20px', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
                        </div>
                    </div>

                    <div className="booking-index-table">
                        <div className="booking-index-head" style={{ padding: '20px 30px', opacity: 0.5, fontWeight: '800', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'grid', gridTemplateColumns: '80px 2fr 2fr 1.5fr 1.5fr', gap: '15px' }}>
                            <span>Id</span>
                            <span>Tên hiển thị</span>
                            <span>Email</span>
                            <span style={{ textAlign: 'center' }}>Quyền hạn</span>
                            <span style={{ textAlign: 'right' }}>Thao tác</span>
                        </div>

                        {loading ? (
                            <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8' }}>Đang tải danh sách tài khoản...</div>
                        ) : filteredUsers.length === 0 ? (
                            <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy tài khoản nào phù hợp.</div>
                        ) : (
                            filteredUsers.map(u => (
                                <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '80px 2fr 2fr 1.5fr 1.5fr', gap: '15px', padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center', color: '#e2e8f0' }}>
                                    
                                    <div style={{ opacity: 0.5, fontFamily: 'monospace' }}>#{u.id}</div>
                                    <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                                    <div style={{ color: '#94a3b8' }}>{u.email}</div>
                                    
                                    <div style={{ textAlign: 'center' }}>
                                        {activeTab === 'STAFF' ? (
                                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                STAFF
                                            </span>
                                        ) : (
                                            <span style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                USER
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        {activeTab === 'USER' ? (
                                            <button 
                                                onClick={() => handleRoleChange(u.id, 'STAFF')} 
                                                title="Cấp quyền Nhân viên" 
                                                style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}
                                            >
                                                <ArrowRightLeft size={14} /> Lập làm Staff
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleRoleChange(u.id, 'USER')} 
                                                title="Thu hồi quyền Nhân viên" 
                                                style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}
                                            >
                                                <ArrowRightLeft size={14} /> Giáng quyền
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDelete(u.id)} 
                                            title="Xóa tài khoản" 
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </article>
            </section>
        </>
    );
};

export default AccountManagement;
