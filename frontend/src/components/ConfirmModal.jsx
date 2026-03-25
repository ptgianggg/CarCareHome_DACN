import React from 'react';
import { createPortal } from 'react-dom';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Đồng ý", cancelText = "Hủy", icon, color = "#3b82f6" }) => {
    if (!isOpen) return null;

    return createPortal(
        <div style={{ 
            position: 'fixed', inset: 0, 
            background: 'rgba(2, 6, 23, 0.85)', 
            backdropFilter: 'blur(12px)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 9999,
            padding: '20px'
        }} onClick={onCancel}>
            <div style={{ 
                width: '100%', maxWidth: '400px', 
                background: '#0f172a', 
                borderRadius: '28px', 
                border: '1px solid rgba(255,255,255,0.08)', 
                overflow: 'hidden', 
                boxShadow: '0 25px 70px rgba(0,0,0,0.7)',
                animation: 'modalScale 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                padding: '35px 30px',
                textAlign: 'center'
            }} onClick={e => e.stopPropagation()}>
                
                {icon && (
                    <div style={{ 
                        width: '70px', height: '70px', borderRadius: '50%', 
                        background: `${color}15`, 
                        display: 'grid', placeItems: 'center', 
                        margin: '0 auto 20px',
                        color: color,
                        border: `1px solid ${color}30`
                    }}>
                        {icon}
                    </div>
                )}

                <h3 style={{ margin: '0 0 10px', fontSize: '1.4rem', fontWeight: '900', color: '#fff' }}>{title}</h3>
                <p style={{ margin: '0 0 30px', color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6 }}>{message}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button 
                        onClick={onCancel}
                        style={{ 
                            padding: '14px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', 
                            background: 'rgba(255,255,255,0.03)', color: '#94a3b8', 
                            fontWeight: '700', cursor: 'pointer', transition: '0.2s' 
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm}
                        style={{ 
                            padding: '14px', borderRadius: '15px', border: 'none', 
                            background: `linear-gradient(135deg, ${color}, ${color}dd)`, color: '#fff', 
                            fontWeight: '900', cursor: 'pointer', 
                            boxShadow: `0 8px 20px ${color}30`,
                            transition: '0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;
