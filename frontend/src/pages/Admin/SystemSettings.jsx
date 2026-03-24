import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const SystemSettings = () => {
    const [settings, setSettings] = useState({
        bannerUrl: '',
        bannerTitle: '',
        bannerSubtitle: '',
        bannerButtonText: '',
        bannerButtonLink: '',
        popupEnabled: false,
        popupImageUrl: '',
        popupTitle: '',
        popupContent: '',
        popupLink: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#06b6d4',
        backgroundColor: '#020617',
        textColor: '#f1f5f9',
        fontFamily: "'Inter', sans-serif",
        contactPhone: '',
        contactEmail: '',
        contactAddress: ''
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/system-settings`);
            setSettings(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Không thể tải cấu hình hệ thống');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/uploads`, formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSettings(prev => ({ ...prev, [field]: response.data.url }));
            toast.success('Tải ảnh lên thành công!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Lỗi khi tải ảnh lên');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/system-settings`, settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Cập nhật cấu hình thành công!');
            // Reload to apply changes if needed
            window.location.reload();
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Lỗi khi cập nhật cấu hình');
        }
    };

    if (loading) return <div className="admin-loading">Đang tải...</div>;

    return (
        <div className="admin-page">
            <header className="page-header">
                <div className="header-context">
                    <span className="eyebrow">Quản lý</span>
                    <h1>Cấu hình hệ thống</h1>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="settings-form">
                <div className="settings-grid">
                    {/* Banner Section */}
                    <div className="settings-card">
                        <h3>Cấu hình Banner</h3>
                        <div className="input-group">
                            <label>Hình ảnh Banner</label>
                            <div className="image-upload-wrapper">
                                {settings.bannerUrl && (
                                    <div className="image-preview">
                                        <img src={settings.bannerUrl.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${settings.bannerUrl}` : settings.bannerUrl} alt="Banner Preview" />
                                        <button type="button" className="remove-img" onClick={() => setSettings(prev => ({...prev, bannerUrl: ''}))}>&times;</button>
                                    </div>
                                )}
                                <label className="upload-btn">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => handleFileUpload(e, 'bannerUrl')} 
                                        hidden 
                                    />
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    <span>Tải ảnh lên từ máy</span>
                                </label>
                                <div className="url-input-alt">
                                    <span>Hoặc nhập URL:</span>
                                    <input type="text" name="bannerUrl" value={settings.bannerUrl} onChange={handleChange} placeholder="https://example.com/banner.jpg" />
                                </div>
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Tiêu đề Banner</label>
                            <input type="text" name="bannerTitle" value={settings.bannerTitle} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Phụ đề Banner</label>
                            <textarea name="bannerSubtitle" value={settings.bannerSubtitle} onChange={handleChange}></textarea>
                        </div>
                        <div className="input-row">
                            <div className="input-group">
                                <label>Nội dung Button</label>
                                <input type="text" name="bannerButtonText" value={settings.bannerButtonText} onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label>Link Button</label>
                                <input type="text" name="bannerButtonLink" value={settings.bannerButtonLink} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* Popup Section */}
                    <div className="settings-card">
                        <div className="card-header-flex">
                            <h3>Cấu hình Popup</h3>
                            <label className="switch">
                                <input type="checkbox" name="popupEnabled" checked={settings.popupEnabled} onChange={handleChange} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                        <div className={`popup-settings ${!settings.popupEnabled ? 'disabled' : ''}`}>
                            <div className="input-group">
                                <label>Hình ảnh Popup</label>
                                <div className="image-upload-wrapper">
                                    {settings.popupImageUrl && (
                                        <div className="image-preview">
                                            <img src={settings.popupImageUrl.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${settings.popupImageUrl}` : settings.popupImageUrl} alt="Popup Preview" />
                                            <button type="button" className="remove-img" onClick={() => setSettings(prev => ({...prev, popupImageUrl: ''}))}>&times;</button>
                                        </div>
                                    )}
                                    <label className={`upload-btn ${!settings.popupEnabled ? 'disabled' : ''}`}>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={(e) => handleFileUpload(e, 'popupImageUrl')} 
                                            hidden 
                                            disabled={!settings.popupEnabled}
                                        />
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                        <span>Tải ảnh lên từ máy</span>
                                    </label>
                                    <div className="url-input-alt">
                                        <span>Hoặc nhập URL:</span>
                                        <input type="text" name="popupImageUrl" value={settings.popupImageUrl} onChange={handleChange} placeholder="https://example.com/popup.jpg" disabled={!settings.popupEnabled} />
                                    </div>
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Tiêu đề Popup</label>
                                <input type="text" name="popupTitle" value={settings.popupTitle} onChange={handleChange} disabled={!settings.popupEnabled} />
                            </div>
                            <div className="input-group">
                                <label>Link khi click Popup</label>
                                <input type="text" name="popupLink" value={settings.popupLink} onChange={handleChange} disabled={!settings.popupEnabled} />
                            </div>
                        </div>
                    </div>

                    {/* Theme Section */}
                    <div className="settings-card">
                        <h3>Giao diện & Màu sắc</h3>
                        <div className="color-grid">
                            <div className="input-group">
                                <label>Màu chính (Primary)</label>
                                <div className="color-input">
                                    <input type="color" name="primaryColor" value={settings.primaryColor} onChange={handleChange} />
                                    <span>{settings.primaryColor}</span>
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Màu phụ (Secondary)</label>
                                <div className="color-input">
                                    <input type="color" name="secondaryColor" value={settings.secondaryColor} onChange={handleChange} />
                                    <span>{settings.secondaryColor}</span>
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Màu nền</label>
                                <div className="color-input">
                                    <input type="color" name="backgroundColor" value={settings.backgroundColor} onChange={handleChange} />
                                    <span>{settings.backgroundColor}</span>
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Màu chữ</label>
                                <div className="color-input">
                                    <input type="color" name="textColor" value={settings.textColor} onChange={handleChange} />
                                    <span>{settings.textColor}</span>
                                </div>
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Font chữ</label>
                            <select name="fontFamily" value={settings.fontFamily} onChange={handleChange}>
                                <option value="'Inter', sans-serif">Inter</option>
                                <option value="'Roboto', sans-serif">Roboto</option>
                                <option value="'Montserrat', sans-serif">Montserrat</option>
                                <option value="'Open Sans', sans-serif">Open Sans</option>
                                <option value="system-ui, sans-serif">Hệ thống</option>
                            </select>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className="settings-card">
                        <h3>Thông tin liên hệ</h3>
                        <div className="input-group">
                            <label>Số điện thoại</label>
                            <input type="text" name="contactPhone" value={settings.contactPhone} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Email liên hệ</label>
                            <input type="text" name="contactEmail" value={settings.contactEmail} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Địa chỉ</label>
                            <textarea name="contactAddress" value={settings.contactAddress} onChange={handleChange}></textarea>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="primary-button save-settings-btn">Lưu cấu hình hệ thống</button>
                </div>
            </form>

            <style dangerouslySetInnerHTML={{ __html: `
                .settings-form { margin-top: 2rem; }
                .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .settings-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 1.5rem; border-radius: 16px; }
                .settings-card h3 { margin-bottom: 1.5rem; color: var(--admin-primary); font-size: 1.1rem; }
                .input-group { margin-bottom: 1.25rem; }
                .input-group label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.5rem; }
                .input-group input, .input-group textarea, .input-group select { 
                    width: 100%; padding: 0.75rem; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); 
                    border-radius: 8px; color: #fff; font-size: 0.9rem;
                }
                .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .color-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .color-input { display: flex; align-items: center; gap: 0.75rem; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
                .color-input input { width: 30px; height: 30px; padding: 0; border: none; background: none; cursor: pointer; }
                .card-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .card-header-flex h3 { margin-bottom: 0; }
                .popup-settings.disabled { opacity: 0.5; pointer-events: none; }
                .save-settings-btn { padding: 1.25rem 3rem; font-size: 1rem; font-weight: 700; border-radius: 12px; margin-top: 2rem; }
                
                /* Image Upload Styling */
                .image-upload-wrapper { display: flex; flex-direction: column; gap: 1rem; }
                .image-preview { position: relative; width: 100%; height: 180px; border-radius: 12px; overflow: hidden; background: #000; border: 1px solid rgba(255,255,255,0.1); }
                .image-preview img { width: 100%; height: 100%; object-fit: cover; }
                .remove-img { position: absolute; top: 10px; right: 10px; width: 24px; height: 24px; background: rgba(0,0,0,0.5); border: none; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(4px); }
                .upload-btn { 
                    display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.75rem; 
                    background: rgba(59, 130, 246, 0.1); border: 1.5px dashed rgba(59, 130, 246, 0.4); 
                    border-radius: 12px; color: #3b82f6; cursor: pointer; transition: 0.3s;
                }
                .upload-btn:hover { background: rgba(59, 130, 246, 0.15); border-color: #3b82f6; }
                .upload-btn svg { width: 20px; height: 20px; }
                .upload-btn.disabled { opacity: 0.5; pointer-events: none; }
                .url-input-alt { display: flex; flex-direction: column; gap: 0.5rem; }
                .url-input-alt span { font-size: 0.8rem; color: #64748b; }
                
                /* Switch Slider */
                .switch { position: relative; display: inline-block; width: 50px; height: 24px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #334155; transition: .4s; }
                .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
                input:checked + .slider { background-color: #3b82f6; }
                input:checked + .slider:before { transform: translateX(26px); }
                .slider.round { border-radius: 34px; }
                .slider.round:before { border-radius: 50%; }
            `}} />
        </div>
    );
};

export default SystemSettings;
