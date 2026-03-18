import React from 'react';
import './AuthLayout.css';

const AuthLayout = ({ children, title, subtitle, features }) => {
  return (
    <div className="auth-wrapper">
      <div className="blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="auth-container">
        {/* Left Panel - Branding & Features */}
        <div className="auth-left">
          <div className="brand">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L3 15V18H21V15L19 13H5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M5 13L7 7H17L19 13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="8" cy="18" r="2" fill="currentColor" />
                <circle cx="16" cy="18" r="2" fill="currentColor" />
                <path d="M9 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="brand-name">CarCare<span>Home</span></h1>
          </div>

          <div className="brand-content">
            <h2>{title}</h2>
            {subtitle && <p className="brand-subtitle">{subtitle}</p>}

            <div className="features">
              {features.map((feature, index) => (
                <div className="feature-item" key={index}>
                  <div className="feature-icon">
                    {feature.icon}
                  </div>
                  <div className="feature-content">
                    <h4>{feature.title}</h4>
                    {feature.desc && <p>{feature.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="brand-decoration">
            <div className="deco-circle deco-circle-1"></div>
            <div className="deco-circle deco-circle-2"></div>
          </div>
        </div>

        {/* Right Panel - Form (Children) */}
        <div className="auth-right">
          <div className="auth-card">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
