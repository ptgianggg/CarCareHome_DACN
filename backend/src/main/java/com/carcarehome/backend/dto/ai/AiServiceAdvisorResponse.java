package com.carcarehome.backend.dto.ai;

import java.util.ArrayList;
import java.util.List;

public record AiServiceAdvisorResponse(
        String provider,
        String ruleId,
        Boolean relevant,
        String rejectionReason,
        String title,
        String summary,
        String rationale,
        String followUp,
        Boolean imageProvided,
        Boolean imageReadable,
        String imageFeedback,
        Boolean interiorDetected,
        List<AiServiceRecommendationDto> recommendations
) {
    public AiServiceAdvisorResponse {
        recommendations = recommendations == null ? new ArrayList<>() : recommendations;
        interiorDetected = Boolean.TRUE.equals(interiorDetected);
        relevant = !Boolean.FALSE.equals(relevant);
        imageProvided = Boolean.TRUE.equals(imageProvided);
        imageReadable = imageProvided && Boolean.TRUE.equals(imageReadable);
        imageFeedback = imageFeedback == null ? "" : imageFeedback;
    }
}
