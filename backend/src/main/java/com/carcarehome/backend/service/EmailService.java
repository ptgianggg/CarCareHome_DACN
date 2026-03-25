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

    public void sendOTPEmail(String to, String otp) {
        String subject = "Mã xác thực OTP - CarCareHome";
        
        String content = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>" +
                "<h2 style='color: #3b82f6; text-align: center;'>CarCareHome</h2>" +
                "<p>Xin chào,</p>" +
                "<p>Bạn đang thực hiện truy cập vào khu vực <strong>Tra cứu điểm thưởng</strong>. Vui lòng sử dụng mã OTP sau để xác nhận:</p>" +
                "<div style='text-align: center; margin: 30px 0;'>" +
                "<span style='background: #f1f5f9; color: #3b82f6; padding: 12px 30px; border-radius: 8px; font-size: 24px; font-weight: 800; letter-spacing: 4px; border: 1px dashed #3b82f6;'>" + otp + "</span>" +
                "</div>" +
                "<p>Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>. Vui lòng không tiết lộ mã này cho bất kỳ ai.</p>" +
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
            throw new RuntimeException("Lỗi khi gửi email OTP: " + e.getMessage());
        }
    }

    public void sendBookingConfirmationEmail(String to, com.carcarehome.backend.entity.Booking booking) {
        String subject = "Đặt lịch thành công - CarCareHome #" + booking.getId();
        
        String content = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;'>" +
                "<div style='background: #1e293b; padding: 30px; text-align: center;'>" +
                "<h1 style='color: #fff; margin: 0; font-size: 24px;'>CarCareHome</h1>" +
                "<p style='color: #94a3b8; margin: 10px 0 0;'>Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi!</p>" +
                "</div>" +
                "<div style='padding: 30px; background: #fff;'>" +
                "<h2 style='color: #1e293b; margin: 0 0 20px;'>Thông báo đặt lịch thành công</h2>" +
                "<p>Xin chào <strong>" + booking.getCustomerName() + "</strong>,</p>" +
                "<p>Lịch hẹn của bạn đã được ghi nhận thành công trên hệ thống. Dưới đây là thông tin chi tiết:</p>" +
                
                "<div style='background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;'>" +
                "<p style='margin: 0 0 10px;'><strong>Mã đơn hàng:</strong> #" + booking.getId() + "</p>" +
                "<p style='margin: 0 0 10px;'><strong>Dịch vụ:</strong> " + booking.getServiceType() + "</p>" +
                "<p style='margin: 0 0 10px;'><strong>Thời gian:</strong> " + booking.getBookingTime() + " - " + booking.getBookingDate() + "</p>" +
                "<p style='margin: 0 0 10px;'><strong>Địa chỉ:</strong> " + booking.getAddressName() + "</p>" +
                "<p style='margin: 0;'><strong>Tổng cộng:</strong> " + String.format("%,.0f", booking.getTotalPrice()) + " VNĐ</p>" +
                "</div>" +
                
                "<p>Chúng tôi sẽ sớm điều phối kỹ thuật viên đến phục vụ bạn. Bạn có thể theo dõi trạng thái lịch hẹn tại mục <strong>Lịch hẹn của tôi</strong> trên website.</p>" +
                
                "<div style='text-align: center; margin: 30px 0;'>" +
                "<a href='http://localhost:5173/my-bookings' style='background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;'>Xem lịch hẹn của tôi</a>" +
                "</div>" +
                
                "<p style='font-size: 14px; color: #64748b;'>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ hotline: <strong>097.144.0008</strong></p>" +
                "</div>" +
                "<div style='background: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;'>" +
                "&copy; 2026 CarCareHome. All rights reserved." +
                "</div>" +
                "</div>";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Lỗi khi gửi email xác nhận đặt lịch: " + e.getMessage());
        }
    }
}
