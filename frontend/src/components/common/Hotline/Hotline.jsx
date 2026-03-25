import React from 'react';
import './Hotline.css';
import phoneIcon from '@/assets/icon-1.png';

const Hotline = () => {
  return (
    <div className="hotline-phone-ring-wrap">
      <div className="hotline-phone-ring">
        <div className="hotline-phone-ring-circle"></div>
        <div className="hotline-phone-ring-circle-fill"></div>
        <div className="hotline-phone-ring-img-circle">
          <a href="tel:0971440008" className="pps-btn-img">
            <img src={phoneIcon} alt="Số điện thoại" width="50" />
          </a>
        </div>
      </div>
      <div className="hotline-bar">
        <a href="tel:0971440008">
          <span className="text-hotline">097.144.0008</span>
        </a>
      </div>
    </div>
  );
};

export default Hotline;
