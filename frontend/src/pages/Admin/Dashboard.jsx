import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  ArrowUpRight, 
  Calendar,
  Layers,
  CheckCircle,
  FileText,
  Star
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8089/api";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/reports/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error("Fetch dashboard stats failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="admin-loading">Đang tải dữ liệu...</div>;
  if (!stats) return <div className="admin-error">Không thể tải dữ liệu thống kê</div>;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  return (
    <div className="admin-dashboard-container animate-fade-in">
      <header className="topbar" style={{ marginBottom: '30px' }}>
        <div>
            <p className="eyebrow" style={{ color: "var(--admin-primary)", opacity: 0.8 }}>SYSTEM OVERVIEW</p>
            <h2 style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.04em', background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.4))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tổng quan hệ thống</h2>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card gold">
          <div className="stat-icon-box">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Tổng doanh thu</span>
            <h3 className="stat-value">{formatCurrency(stats.totalRevenue)}</h3>
            <div className="stat-trend positive">
              <ArrowUpRight size={14} /> <span>12% so với tháng trước</span>
            </div>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon-box">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Tổng đơn đặt lịch</span>
            <h3 className="stat-value">{stats.statusDistribution?.reduce((acc, curr) => acc + curr[1], 0) || 0}</h3>
            <div className="stat-trend positive">
              <ArrowUpRight size={14} /> <span>8% so với tháng trước</span>
            </div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon-box">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Đang chờ xử lý</span>
            <h3 className="stat-value">{stats.pendingBookings}</h3>
            <p className="stat-hint">Cần gán kỹ thuật viên ngay</p>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon-box">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Tổng khách hàng</span>
            <h3 className="stat-value">{stats.totalUsers}</h3>
            <div className="stat-trend positive">
              <ArrowUpRight size={14} /> <span>+5 người dùng mới</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-charts-layout">
        <div className="chart-wrapper-glass">
            <div className="chart-header">
                <h3>Doanh thu 7 ngày gần nhất</h3>
                <div className="chart-legend">
                    <span className="dot"></span> Doanh thu (vnđ)
                </div>
            </div>
            
            <div className="custom-bar-chart">
                {stats.dailyRevenue && stats.dailyRevenue.length > 0 ? (
                    stats.dailyRevenue.slice(0, 7).reverse().map((item, idx) => (
                        <div key={idx} className="bar-item">
                            <div className="bar-pillar-wrap">
                                <div 
                                    className="bar-pillar" 
                                    style={{ height: `${Math.min(100, (item[1] / 1000000) * 10)}%` }}
                                >
                                    <div className="bar-tooltip">{formatCurrency(item[1])}</div>
                                </div>
                            </div>
                            <span className="bar-label">{new Date(item[0]).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                        </div>
                    ))
                ) : (
                    <div className="empty-chart">Chưa có dữ liệu doanh thu</div>
                )}
            </div>
        </div>

        <div className="status-breakdown-glass">
            <div className="chart-header">
                <h3>Thanh toán & Trạng thái</h3>
            </div>
            <div className="status-list">
                {stats.statusDistribution?.map((item, idx) => (
                    <div key={idx} className="status-row">
                        <div className="status-info-row">
                            <span className="s-name">{item[0]}</span>
                            <span className="s-count">{item[1]} đơn</span>
                        </div>
                        <div className="status-progress-bg">
                            <div 
                                className={`status-progress-fill ${item[0].toLowerCase()}`} 
                                style={{ width: `${(item[1] / (stats.statusDistribution.reduce((a,c)=>a+c[1],0) || 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <div className="dashboard-charts-layout">
        <div className="chart-wrapper-glass staff-rank-panel">
            <div className="chart-header">
                <h3>Xếp hạng Kỹ thuật viên</h3>
                <div className="chart-legend">Dựa trên đánh giá thực tế</div>
            </div>
            <div className="staff-ranking-list">
                {stats.staffPerformance && stats.staffPerformance.length > 0 ? stats.staffPerformance.map((staff, idx) => (
                    <div key={idx} className="staff-rank-item">
                        <div className="rank-badge">{idx + 1}</div>
                        <div className="staff-rank-info">
                            <div className="staff-avatar-wrapper">
                                <div className="staff-avatar-mini">
                                    {staff[1] ? <img src={staff[1]} alt={staff[0]} /> : <Users size={18} />}
                                </div>
                            </div>
                            <div className="staff-main-details">
                                <strong>{staff[0]}</strong>
                                <span className="staff-count-tag">{staff[3]} lượt phục vụ</span>
                            </div>
                        </div>
                        <div className="staff-performance-metrics">
                            <div className="rating-visual-row">
                                <span className="rating-score-num">{staff[2]?.toFixed(1)}</span>
                                <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                            </div>
                            <div className="rating-bar-tiny">
                                <div 
                                    className="rating-fill-tiny" 
                                    style={{ width: `${(staff[2] / 5) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )) : <div className="empty-rank-state">Chưa có dữ liệu đánh giá</div>}
            </div>
        </div>

        <div className="recent-activity-glass">
            <div className="chart-header">
                <h3>Hoạt động gần đây</h3>
                <button className="view-all-btn">Xem tất cả</button>
            </div>
            <div className="activity-list-minimal">
                {stats.recentActivities && stats.recentActivities.length > 0 ? stats.recentActivities.map((act, idx) => {
                    // Helper to get status icon/color
                    const getStatusStyles = (status) => {
                        switch(status) {
                            case 'COMPLETED': return { icon: <CheckCircle size={18} />, color: 'green' };
                            case 'IN_PROGRESS': return { icon: <Clock size={18} />, color: 'blue' };
                            case 'WAITING_FOR_PAYMENT': return { icon: <Layers size={18} />, color: 'gold' };
                            case 'CANCELLED': case 'REJECTED': return { icon: <FileText size={18} />, color: 'red' };
                            default: return { icon: <FileText size={18} />, color: 'blue' };
                        }
                    };
                    const styles = getStatusStyles(act.status);
                    return (
                        <div key={idx} className="activity-item">
                            <div className={`activity-icon ${styles.color}`}>{styles.icon}</div>
                            <div className="activity-text">
                                <strong>Đơn hàng #{act.id}</strong> - {act.serviceType}
                                <div className="activity-sub">
                                    <span>Bởi {act.customerName}</span>
                                    <span className={`status-pill-mini ${act.status.toLowerCase()}`}>{act.status}</span>
                                </div>
                            </div>
                        </div>
                    );
                }) : <div className="empty-mini">Chưa có hoạt động mới</div>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
