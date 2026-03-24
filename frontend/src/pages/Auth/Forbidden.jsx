import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, LogOut } from 'lucide-react';

const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#020617', 
      display: 'grid', 
      placeItems: 'center', 
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      <div style={{ 
        maxWidth: '500px', 
        width: '90%', 
        background: 'rgba(255, 255, 255, 0.03)', 
        backdropFilter: 'blur(30px)', 
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        borderRadius: '40px', 
        padding: '60px 40px', 
        textAlign: 'center',
        boxShadow: '0 40px 100px rgba(0,0,0,0.5)'
      }}>
        <div style={{ 
          width: '100px', 
          height: '100px', 
          background: 'rgba(239, 68, 68, 0.15)', 
          borderRadius: '50%', 
          display: 'grid', 
          placeItems: 'center', 
          margin: '0 auto 30px',
          color: '#ef4444'
        }}>
          <ShieldAlert size={50} strokeWidth={2.5} />
        </div>

        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '900', 
          color: '#fff', 
          marginBottom: '16px',
          letterSpacing: '-0.04em'
        }}>403</h1>
        
        <h2 style={{ 
          fontSize: '1.4rem', 
          fontWeight: '700', 
          color: '#fff', 
          marginBottom: '20px'
        }}>Truy cập bị hạn chế</h2>
        
        <p style={{ 
          color: 'rgba(255,255,255,0.6)', 
          lineHeight: '1.6', 
          marginBottom: '40px',
          fontSize: '1rem'
        }}>
          Tài khoản của quý khách không có quyền truy cập vào khu vực này. Vui lòng quay lại hoặc đăng nhập bằng tài khoản có quyền phù hợp.
        </p>

        <div style={{ display: 'grid', gap: '15px' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              padding: '18px', 
              borderRadius: '20px', 
              background: '#3b82f6', 
              color: '#fff', 
              border: 'none', 
              fontWeight: '800', 
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <Home size={18} /> Về Trang Chủ
          </button>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            style={{ 
              padding: '18px', 
              borderRadius: '20px', 
              background: 'transparent', 
              color: 'rgba(255,255,255,0.8)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              fontWeight: '700', 
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <LogOut size={18} /> Đăng nhập lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
