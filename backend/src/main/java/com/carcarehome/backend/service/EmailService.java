package com.carcarehome.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendResetPasswordEmail(String to, String token) {
        String subject = "Đặt lại mật khẩu - CarCareHome";
        String resetUrl = "http://localhost:5173/reset-password?token=" + token;
        
        String content = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>" +
                "<h2 style='color: #3b82f6; text-align: center;'>CarCareHome</h2>" +
                "<p>Xin chào,</p>" +
                "<p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản tại <strong>CarCareHome</strong>. Vui lòng nhấn vào nút bên dưới để thiết lập mật khẩu mới:</p>" +
                "<div style='text-align: center; margin: 30px 0;'>" +
                "<a href='" + resetUrl + "' style='background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Đặt lại mật khẩu</a>" +
                "</div>" +
                "<p>Link này có hiệu lực trong vòng <strong>15 phút</strong>. Nếu bạn không yêu cầu thay đổi này, vui lòng bỏ qua email này.</p>" +
                "<hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>" +
                "<p style='color: #888; font-size: 12px; text-align: center;'>Đây là email tự động, vui lòng không phản hồi.</p>" +
                "</div>";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Lỗi khi gửi email: " + e.getMessage());
        }
    }
}
