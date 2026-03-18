import { useAuth } from "@/context/AuthContext";
import "./Home.css";

function Home() {
  const { user } = useAuth();

  return (
    <div className="home-wrapper">
      <section className="welcome-section">
        {/* ... existing content ... */}
        <div className="welcome-content">
          <span className="welcome-badge">Chào mừng trở lại</span>
          <h1>Xin chào, <span>{user?.name}</span>!</h1>
          <p>Hệ thống chăm sóc xe hơi thông minh đã sẵn sàng phục vụ bạn.</p>
          
          <div className="quick-actions">
            <button className="action-btn primary">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Đặt lịch ngay
            </button>
            <button className="action-btn secondary">
              <svg viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
              Xem dịch vụ
            </button>
          </div>
        </div>
        
        <div className="welcome-image">
           <div className="glass-card main-stats">
              <div className="stat-item">
                <span className="stat-value">03</span>
                <span className="stat-label">Lịch hẹn sắp tới</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">VIP</span>
                <span className="stat-label">Hạng thành viên</span>
              </div>
           </div>
        </div>
      </section>

      <section className="dashboard-grid">
         <div className="dashboard-card">
            <h3>Thông tin tài khoản</h3>
            <div className="user-details">
               <div className="user-detail-item">
                  <label>Email</label>
                  <span>{user?.email}</span>
               </div>
               <div className="user-detail-item">
                  <label>Vai trò</label>
                  <span className="role-chip">{user?.role}</span>
               </div>
            </div>
         </div>
         
         <div className="dashboard-card">
            <h3>Lịch sử hoạt động</h3>
            <div className="empty-state">
               <p>Chưa có dữ liệu hoạt động gần đây.</p>
            </div>
         </div>
      </section>
    </div>
  );
}

export default Home;
