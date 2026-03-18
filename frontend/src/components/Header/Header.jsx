import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Header.css";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <header className="main-header">
      {/* Top Header Row */}
      <div className="header-top">
        <div className="header-container">
          <Link to="/" className="header-brand">
            <div className="header-logo">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L3 15V18H21V15L19 13H5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M5 13L7 7H17L19 13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="8" cy="18" r="2" fill="currentColor" />
                <circle cx="16" cy="18" r="2" fill="currentColor" />
                <path d="M9 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1>CarCare<span>Home</span></h1>
          </Link>

          {/* Search Bar - Replaces Middle Nav */}
          <div className="header-search">
            <div className="search-wrapper">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                placeholder="Tìm kiếm dịch vụ, phụ tùng..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="header-user">
            <div 
              className="user-profile" 
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</span>
              </div>
              <svg className={`chevron ${showDropdown ? 'open' : ''}`} viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {showDropdown && (
              <>
                <div className="dropdown-overlay" onClick={() => setShowDropdown(false)}></div>
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <p className="dropdown-email">{user.email}</p>
                  </div>
                  <div className="dropdown-links">
                    <Link to="/profile" className="dropdown-item">
                      <svg viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>
                      Hồ sơ của tôi
                    </Link>
                    <Link to="/settings" className="dropdown-item">
                      <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/></svg>
                      Cấu hình
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      <svg viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sub Header / Navigation Row */}
      <div className="header-bottom">
        <div className="header-container">
          <nav className="header-nav">
            <Link to="/" className="nav-link active">Trang chủ</Link>
            <Link to="/services" className="nav-link">Dịch vụ</Link>
            <Link to="/booking" className="nav-link">Đặt lịch</Link>
            <div className="nav-divider"></div>
            <Link to="/promotion" className="nav-link">Khuyến mãi</Link>
            <Link to="/news" className="nav-link">Tin tức</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
