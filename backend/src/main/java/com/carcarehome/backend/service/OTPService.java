package com.carcarehome.backend.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.time.LocalDateTime;

@Service
public class OTPService {
    private final Map<String, OTPInfo> otpStorage = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public String generateOTP(String email) {
        String otp = String.format("%06d", random.nextInt(1000000));
        otpStorage.put(email, new OTPInfo(otp, LocalDateTime.now().plusMinutes(5)));
        return otp;
    }

    public boolean verifyOTP(String email, String otp) {
        OTPInfo info = otpStorage.get(email);
        if (info == null) return false;
        
        if (LocalDateTime.now().isAfter(info.expiryTime)) {
            otpStorage.remove(email);
            return false;
        }
        
        if (info.otp.equals(otp)) {
            otpStorage.remove(email);
            return true;
        }
        
        return false;
    }

    private static class OTPInfo {
        String otp;
        LocalDateTime expiryTime;

        OTPInfo(String otp, LocalDateTime expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }
    }
}
