package com.carcarehome.backend.service;

import com.carcarehome.backend.entity.SystemSetting;
import com.carcarehome.backend.repository.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SystemSettingService {
    @Autowired
    private SystemSettingRepository systemSettingRepository;

    public SystemSetting getSettings() {
        return systemSettingRepository.findFirstByOrderByIdAsc().orElseGet(() -> {
            SystemSetting defaultSettings = new SystemSetting();
            defaultSettings.setPrimaryColor("#3b82f6");
            defaultSettings.setSecondaryColor("#06b6d4");
            defaultSettings.setBackgroundColor("#020617");
            defaultSettings.setTextColor("#f1f5f9");
            defaultSettings.setFontFamily("'Inter', sans-serif");
            defaultSettings.setBannerTitle("Chào mừng đến với CarCareHome");
            defaultSettings.setBannerSubtitle("Hệ thống chăm sóc xe hơi thông minh số 1 Việt Nam");
            defaultSettings.setBannerButtonText("Đặt lịch ngay");
            defaultSettings.setBannerButtonLink("/booking");
            defaultSettings.setPopupEnabled(false);
            return systemSettingRepository.save(defaultSettings);
        });
    }

    public SystemSetting updateSettings(SystemSetting settings) {
        SystemSetting existing = getSettings();
        settings.setId(existing.getId());
        return systemSettingRepository.save(settings);
    }
}
