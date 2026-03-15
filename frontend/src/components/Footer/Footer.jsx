import React from 'react';
import { Link } from 'react-router-dom';
import "./Footer.css";

const Footer = () => {
    return (
        <footer className="home-footer">
            <div className="home-footer-content">
                <div className="footer-brand-section">
                    <div className="home-brand">
                        <span className="home-brand-mark">CC</span>
                        <span>CarCareHome</span>
                    </div>
                    <p className="footer-desc">
                        Dịch vụ chăm sóc xe chuyên nghiệp hàng đầu, mang lại vẻ đẹp và sự bền bỉ cho chiếc xe của bạn.
                    </p>
                </div>
                <div className="footer-links-section">
                    <h4>Về chúng tôi</h4>
                    <ul>
                        <li><Link to="/home">Trang chủ</Link></li>
                        <li><a href="/home#products">Sản phẩm</a></li>
                        <li><a href="/home#contact">Liên hệ</a></li>
                        <li><Link to="/services">Tất cả dịch vụ</Link></li>
                    </ul>
                </div>
                <div className="footer-contact-section">
                    <h4>Liên hệ</h4>
                    <ul>
                        <li>Hotline: 0900 123 456</li>
                        <li>Email: support@carcarehome.vn</li>
                        <li>Địa chỉ: Quận 7, TP.HCM</li>
                    </ul>
                </div>
            </div>
            <div className="home-footer-bottom">
                <p>&copy; {new Date().getFullYear()} CarCareHome. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
