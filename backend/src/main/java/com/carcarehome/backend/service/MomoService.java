package com.carcarehome.backend.service;

import com.carcarehome.backend.dto.momo.MomoPaymentRequest;
import com.carcarehome.backend.dto.momo.MomoPaymentResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Formatter;
import java.util.Map;

@Service
public class MomoService {

    @Value("${momo.api-url}")
    private String apiUrl;

    @Value("${momo.partner-code}")
    private String partnerCode;

    @Value("${momo.access-key}")
    private String accessKey;

    @Value("${momo.secret-key}")
    private String secretKey;

    @Value("${momo.return-url}")
    private String returnUrl;

    @Value("${momo.notify-url}")
    private String notifyUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public MomoPaymentResponse createPayment(String bookingId, long amount, String orderInfo) throws Exception {
        String momoOrderId = bookingId + "_" + System.currentTimeMillis();
        String requestId = momoOrderId;
        String extraData = "";
        String paymentOrderInfo = "Khach hang: CarCareHome. Noi dung: " + orderInfo + " #" + bookingId;

        String rawData = "partnerCode=" + partnerCode +
                "&accessKey=" + accessKey +
                "&requestId=" + requestId +
                "&amount=" + amount +
                "&orderId=" + momoOrderId +
                "&orderInfo=" + paymentOrderInfo +
                "&returnUrl=" + returnUrl +
                "&notifyUrl=" + notifyUrl +
                "&extraData=" + extraData;

        String signature = hmacSha256(rawData, secretKey);

        MomoPaymentRequest request = new MomoPaymentRequest();
        request.setAccessKey(accessKey);
        request.setPartnerCode(partnerCode);
        request.setRequestType("captureMoMoWallet");
        request.setNotifyUrl(notifyUrl);
        request.setReturnUrl(returnUrl);
        request.setOrderId(momoOrderId);
        request.setAmount(String.valueOf(amount));
        request.setOrderInfo(paymentOrderInfo);
        request.setRequestId(requestId);
        request.setExtraData(extraData);
        request.setSignature(signature);

        return restTemplate.postForObject(apiUrl, request, MomoPaymentResponse.class);
    }

    public boolean verifyCallbackSignature(Map<String, ?> params) throws Exception {
        String receivedSignature = getString(params, "signature");
        if (receivedSignature.isBlank()) {
            return false;
        }

        String errorCode = getString(params, "errorCode");
        if (errorCode.isBlank()) {
            errorCode = getString(params, "resultCode");
        }

        String rawHash = "partnerCode=" + getString(params, "partnerCode") +
                "&accessKey=" + accessKey +
                "&requestId=" + getString(params, "requestId") +
                "&amount=" + getString(params, "amount") +
                "&orderId=" + getString(params, "orderId") +
                "&orderInfo=" + getString(params, "orderInfo") +
                "&orderType=" + getString(params, "orderType") +
                "&transId=" + getString(params, "transId") +
                "&message=" + getString(params, "message") +
                "&localMessage=" + getString(params, "localMessage") +
                "&responseTime=" + getString(params, "responseTime") +
                "&errorCode=" + errorCode +
                "&payType=" + getString(params, "payType") +
                "&extraData=" + getString(params, "extraData");

        String calculatedSignature = hmacSha256(rawHash, secretKey);
        return calculatedSignature.equalsIgnoreCase(receivedSignature);
    }

    public String extractBookingId(String momoOrderId) {
        if (momoOrderId == null || momoOrderId.isBlank()) {
            return "";
        }

        int separatorIndex = momoOrderId.indexOf('_');
        if (separatorIndex < 0) {
            return momoOrderId;
        }

        return momoOrderId.substring(0, separatorIndex);
    }

    private String getString(Map<String, ?> params, String key) {
        Object value = params.get(key);
        return value == null ? "" : String.valueOf(value);
    }

    private String hmacSha256(String data, String key) throws Exception {
        byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
        byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);

        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(keyBytes, "HmacSHA256");
        sha256Hmac.init(secretKeySpec);

        return toHexString(sha256Hmac.doFinal(dataBytes));
    }

    private String toHexString(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        try (Formatter formatter = new Formatter(sb)) {
            for (byte b : bytes) {
                formatter.format("%02x", b);
            }
        }
        return sb.toString();
    }
}
