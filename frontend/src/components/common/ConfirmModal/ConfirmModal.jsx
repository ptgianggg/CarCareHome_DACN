import React from 'react';
import { AlertCircle, HelpCircle, Info, X } from 'lucide-react';
import './ConfirmModal.css';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Đồng ý", 
  cancelText = "Hủy bỏ",
  type = "danger" 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertCircle size={24} strokeWidth={2.5} className="mod-icon danger" />;
      case 'warning': return <HelpCircle size={24} strokeWidth={2.5} className="mod-icon warning" />;
      default: return <Info size={24} strokeWidth={2.5} className="mod-icon info" />;
    }
  };

  return (
    <div className="mod-overlay">
      <div className="mod-container animate-in">
        <button className="mod-close-btn" onClick={onCancel} aria-label="Close">
          <X size={18} />
        </button>
        
        <div className="mod-content">
          <div className={`mod-icon-wrapper ${type}`}>
            {getIcon()}
          </div>
          
          <h3 className="mod-title">{title}</h3>
          <p className="mod-message">{message}</p>
        </div>
        
        <div className="mod-actions">
          <button className="mod-btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`mod-btn-primary ${type}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
