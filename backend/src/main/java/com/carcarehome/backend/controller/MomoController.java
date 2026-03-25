package com.carcarehome.backend.controller;

import com.carcarehome.backend.dto.momo.MomoPaymentResponse;
import com.carcarehome.backend.entity.Booking;
import com.carcarehome.backend.service.BookingService;
import com.carcarehome.backend.service.MomoService;
import com.carcarehome.backend.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/momo")
@CrossOrigin(origins = "*")
public class MomoController {

    @Autowired
    private MomoService momoService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private PaymentService paymentService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Thanh toán cọc / toàn bộ khi đặt dịch vụ (flow cũ)
     */
    @PostMapping("/create-payment/{bookingId}")
    public ResponseEntity<?> createPayment(@PathVariable("bookingId") Long bookingId) {
        try {
            Booking booking = bookingService.getBookingById(bookingId);
            long amount = booking.getDepositAmount() != null ? booking.getDepositAmount().longValue() : 0L;
            if (amount <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "So tien thanh toan phai lon hon 0"));
            }

            MomoPaymentResponse response = momoService.createPayment(
                    booking.getId().toString(),
                    amount,
                    "Thanh toan lich hen CarCareHome"
            );

            if (response == null || response.getPayUrl() == null || response.getPayUrl().isBlank()) {
                String message = response != null && response.getLocalMessage() != null
                        ? response.getLocalMessage()
                        : "MoMo khong tra ve payUrl";
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", message));
            }

            return ResponseEntity.ok(response);
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorResponse = e.getResponseBodyAsString();
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("message", "MoMo API Error: " + errorResponse));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Loi he thong: " + (e.getMessage() != null ? e.getMessage() : e.toString())));
        }
    }

    /**
     * Thanh toán phần còn lại qua MoMo (sau khi dịch vụ hoàn tất)
     * KTV chọn "Thanh toán MoMo" → gọi API này → trả về payUrl/QR
     */
    @PostMapping("/create-remaining-payment/{bookingId}")
    public ResponseEntity<?> createRemainingPayment(@PathVariable("bookingId") Long bookingId) {
        try {
            BigDecimal remainingAmount = paymentService.calculateRemainingForMomo(bookingId);
            long amount = remainingAmount.longValue();

            if (amount <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Không còn số tiền nào cần thanh toán"));
            }

            // Sử dụng prefix "REM_" để phân biệt với thanh toán cọc
            String orderId = "REM_" + bookingId;
            MomoPaymentResponse response = momoService.createPayment(
                    orderId,
                    amount,
                    "Thanh toan phan con lai don #" + bookingId
            );

            if (response == null || response.getPayUrl() == null || response.getPayUrl().isBlank()) {
                String message = response != null && response.getLocalMessage() != null
                        ? response.getLocalMessage()
                        : "MoMo khong tra ve payUrl";
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", message));
            }

            return ResponseEntity.ok(response);
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("message", "MoMo API Error: " + e.getResponseBodyAsString()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Loi he thong: " + (e.getMessage() != null ? e.getMessage() : e.toString())));
        }
    }

    @GetMapping("/callback")
    public ResponseEntity<Void> handleCallback(@RequestParam Map<String, String> allParams) {
        String fullOrderId = allParams.getOrDefault("orderId", "");
        String resultCode = allParams.getOrDefault("errorCode", "-1");
        String message = allParams.getOrDefault("localMessage", allParams.getOrDefault("message", "Thanh toan that bai"));
        String transactionId = allParams.getOrDefault("transId", "");

        // Xác định loại thanh toán: cọc hay phần còn lại
        boolean isRemainingPayment = false;
        String bookingId = "";
        
        String extractedId = momoService.extractBookingId(fullOrderId);
        if (extractedId.startsWith("REM_")) {
            isRemainingPayment = true;
            bookingId = extractedId.substring(4); // Bỏ prefix "REM_"
        } else {
            bookingId = extractedId;
        }

        try {
            boolean isValidSignature = momoService.verifyCallbackSignature(allParams);
            if (!isValidSignature) {
                resultCode = "-1";
                message = "Chu ky MoMo khong hop le";
            } else if ("0".equals(resultCode) && !bookingId.isBlank()) {
                if (isRemainingPayment) {
                    // Thanh toán phần còn lại
                    Long bId = Long.parseLong(bookingId);
                    paymentService.handleMomoRemainingPaymentSuccess(bId, transactionId);
                } else {
                    // Thanh toán cọc (flow cũ)
                    updateBookingPaymentStatus(bookingId, transactionId);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            resultCode = "-1";
            message = "Khong the xac thuc ket qua thanh toan";
        }

        URI redirectUri = UriComponentsBuilder.fromHttpUrl(frontendUrl)
                .path("/payment/callback")
                .queryParam("resultCode", resultCode)
                .queryParam("orderId", bookingId.isBlank() ? fullOrderId : bookingId)
                .queryParam("message", message)
                .build()
                .encode()
                .toUri();

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(redirectUri)
                .build();
    }

    @PostMapping("/notify")
    public ResponseEntity<?> handleNotify(@RequestBody Map<String, Object> notifyData) {
        try {
            boolean isValidSignature = momoService.verifyCallbackSignature(notifyData);
            if (!isValidSignature) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid signature"));
            }

            String resultCode = String.valueOf(notifyData.getOrDefault("errorCode", notifyData.getOrDefault("resultCode", "-1")));
            String fullOrderId = String.valueOf(notifyData.getOrDefault("orderId", ""));
            String transactionId = String.valueOf(notifyData.getOrDefault("transId", ""));
            
            if ("0".equals(resultCode) && !fullOrderId.isBlank()) {
                String extractedId = momoService.extractBookingId(fullOrderId);
                
                if (extractedId.startsWith("REM_")) {
                    // Thanh toán phần còn lại
                    String bookingId = extractedId.substring(4);
                    if (!bookingId.isBlank()) {
                        paymentService.handleMomoRemainingPaymentSuccess(Long.parseLong(bookingId), transactionId);
                    }
                } else if (!extractedId.isBlank()) {
                    // Thanh toán cọc
                    updateBookingPaymentStatus(extractedId, transactionId);
                }
            }

            return ResponseEntity.ok(Map.of("message", "success"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Notify processing failed"));
        }
    }

    private void updateBookingPaymentStatus(String bookingIdValue, String transactionId) {
        Long bookingId = Long.parseLong(bookingIdValue);
        Booking booking = bookingService.getBookingById(bookingId);
        
        // Ghi nhận giao dịch cọc vào Payment table
        BigDecimal amount = booking.getDepositAmount() != null ? booking.getDepositAmount() : java.math.BigDecimal.ZERO;
        paymentService.recordDepositPayment(bookingId, transactionId, amount);
        
        String newStatus = "MOMO".equalsIgnoreCase(booking.getPaymentMethod()) ? "PAID_FULL" : "DEPOSITED";
        bookingService.updatePaymentStatus(bookingId, newStatus);
    }
}
