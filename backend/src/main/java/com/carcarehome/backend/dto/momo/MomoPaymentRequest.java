package com.carcarehome.backend.dto.momo;

import lombok.Data;

@Data
public class MomoPaymentRequest {
    private String accessKey;
    private String partnerCode;
    private String requestType;
    private String notifyUrl;
    private String returnUrl;
    private String orderId;
    private String amount;
    private String orderInfo;
    private String requestId;
    private String extraData;
    private String signature;
}
