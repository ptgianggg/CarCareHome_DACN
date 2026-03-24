package com.carcarehome.backend.dto.momo;

import lombok.Data;

@Data
public class MomoPaymentResponse {
    private String requestId;
    private int errorCode;
    private String orderId;
    private String message;
    private String localMessage;
    private String requestType;
    private String payUrl;
    private String signature;
    private String qrCodeUrl;
    private String deeplink;
    private String deeplinkWebInApp;
}
