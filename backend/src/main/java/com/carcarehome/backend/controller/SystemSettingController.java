package com.carcarehome.backend.controller;

import com.carcarehome.backend.entity.SystemSetting;
import com.carcarehome.backend.service.SystemSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/system-settings")
@CrossOrigin(origins = "*")
public class SystemSettingController {

    @Autowired
    private SystemSettingService systemSettingService;

    @GetMapping
    public ResponseEntity<SystemSetting> getSettings() {
        return ResponseEntity.ok(systemSettingService.getSettings());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemSetting> updateSettings(@RequestBody SystemSetting settings) {
        return ResponseEntity.ok(systemSettingService.updateSettings(settings));
    }
}
