package com.carcarehome.backend.dto.ai;

public record AiServiceRecommendationDto(
        Long id,
        String name,
        String category,
        Double price,
        String description,
        String imageUrl,
        String matchReason
) {
}
