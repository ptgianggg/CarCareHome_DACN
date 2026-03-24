package com.carcarehome.backend.controller;

import com.carcarehome.backend.dto.momo.MomoPaymentResponse;
import com.carcarehome.backend.entity.Booking;
import com.carcarehome.backend.service.BookingService;
import com.carcarehome.backend.service.MomoService;
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

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @PostMapping("/create-payment/{bookingId}")
    public ResponseEntity<?> createPayment(@PathVariable Long bookingId) {
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

    @GetMapping("/callback")
    public ResponseEntity<Void> handleCallback(@RequestParam Map<String, String> allParams) {
        String fullOrderId = allParams.getOrDefault("orderId", "");
        String bookingId = momoService.extractBookingId(fullOrderId);
        String resultCode = allParams.getOrDefault("errorCode", "-1");
        String message = allParams.getOrDefault("localMessage", allParams.getOrDefault("message", "Thanh toan that bai"));

        try {
            boolean isValidSignature = momoService.verifyCallbackSignature(allParams);
            if (!isValidSignature) {
                resultCode = "-1";
                message = "Chu ky MoMo khong hop le";
            } else if ("0".equals(resultCode) && !bookingId.isBlank()) {
                updateBookingPaymentStatus(bookingId);
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
            if ("0".equals(resultCode) && !fullOrderId.isBlank()) {
                String bookingId = momoService.extractBookingId(fullOrderId);
                if (!bookingId.isBlank()) {
                    updateBookingPaymentStatus(bookingId);
                }
            }

            return ResponseEntity.ok(Map.of("message", "success"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Notify processing failed"));
        }
    }

    private void updateBookingPaymentStatus(String bookingIdValue) {
        Long bookingId = Long.parseLong(bookingIdValue);
        Booking booking = bookingService.getBookingById(bookingId);
        String newStatus = "MOMO".equalsIgnoreCase(booking.getPaymentMethod()) ? "PAID_FULL" : "DEPOSITED";
        bookingService.updatePaymentStatus(bookingId, newStatus);
    }
}
