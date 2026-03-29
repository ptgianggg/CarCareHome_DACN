package com.carcarehome.backend.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class OpenRouterServiceAdvisorClient {

    private static final String DEFAULT_MODEL = "openrouter/free";

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.openrouter.api-key:}")
    private String apiKey;

    @Value("${ai.openrouter.model:" + DEFAULT_MODEL + "}")
    private String model;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public OpenRouterServiceAdvisorClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public AdvisorResult generateAdvice(String prompt, MultipartFile image) throws IOException {
        if (!StringUtils.hasText(apiKey)) {
            throw new IllegalStateException("Chua cau hinh OPENROUTER_API_KEY cho backend.");
        }

        List<Map<String, Object>> content = new ArrayList<>();
        content.add(Map.of(
                "type", "text",
                "text", prompt
        ));

        if (image != null && !image.isEmpty()) {
            content.add(Map.of(
                    "type", "image_url",
                    "image_url", Map.of(
                            "url", "data:" + resolveMimeType(image) + ";base64," + Base64.getEncoder().encodeToString(image.getBytes())
                    )
            ));
        }

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(Map.of(
                "role", "user",
                "content", content
        )));
        requestBody.put("response_format", Map.of(
                "type", "json_schema",
                "json_schema", Map.of(
                        "name", "service_advisor_response",
                        "strict", true,
                        "schema", buildSchema()
                )
        ));
        requestBody.put("plugins", List.of(Map.of("id", "response-healing")));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        headers.set("HTTP-Referer", frontendUrl);
        headers.set("X-Title", "CarCareHome");

        JsonNode responseNode = restTemplate.postForObject(
                "https://openrouter.ai/api/v1/chat/completions",
                new HttpEntity<>(requestBody, headers),
                JsonNode.class
        );

        if (responseNode == null) {
            throw new IllegalStateException("OpenRouter khong tra ve du lieu.");
        }

        JsonNode messageNode = responseNode.path("choices").path(0).path("message");
        String payload = extractPayload(messageNode);
        if (!StringUtils.hasText(payload)) {
            throw new IllegalStateException("Khong doc duoc structured output tu OpenRouter.");
        }

        return objectMapper.readValue(payload, AdvisorResult.class);
    }

    private Map<String, Object> buildSchema() {
        Map<String, Object> recommendationSchema = new LinkedHashMap<>();
        recommendationSchema.put("type", "object");
        recommendationSchema.put("properties", Map.of(
                "serviceId", Map.of("type", "integer"),
                "matchReason", Map.of("type", "string")
        ));
        recommendationSchema.put("required", List.of("serviceId", "matchReason"));
        recommendationSchema.put("additionalProperties", false);

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", Map.of(
                "relevant", Map.of("type", "boolean"),
                "rejectionReason", Map.of("type", "string"),
                "title", Map.of("type", "string"),
                "summary", Map.of("type", "string"),
                "rationale", Map.of("type", "string"),
                "followUp", Map.of("type", "string"),
                "imageReadable", Map.of("type", "boolean"),
                "imageFeedback", Map.of("type", "string"),
                "interiorDetected", Map.of("type", "boolean"),
                "recommendations", Map.of(
                        "type", "array",
                        "items", recommendationSchema,
                        "minItems", 0,
                        "maxItems", 3
                )
        ));
        schema.put("required", List.of(
                "relevant",
                "rejectionReason",
                "title",
                "summary",
                "rationale",
                "followUp",
                "imageReadable",
                "imageFeedback",
                "interiorDetected",
                "recommendations"
        ));
        schema.put("additionalProperties", false);
        return schema;
    }

    private String resolveMimeType(MultipartFile image) {
        String contentType = image.getContentType();
        return StringUtils.hasText(contentType) ? contentType : MediaType.IMAGE_JPEG_VALUE;
    }

    private String extractPayload(JsonNode messageNode) {
        JsonNode contentNode = messageNode.path("content");

        if (contentNode.isTextual()) {
            return cleanJsonString(contentNode.asText());
        }

        if (contentNode.isArray()) {
            for (JsonNode item : contentNode) {
                JsonNode textNode = item.path("text");
                if (textNode.isTextual()) {
                    return cleanJsonString(textNode.asText());
                }
            }
        }

        JsonNode parsedNode = messageNode.path("parsed");
        if (parsedNode.isObject()) {
            return parsedNode.toString();
        }

        return "";
    }

    private String cleanJsonString(String raw) {
        String value = StringUtils.hasText(raw) ? raw.trim() : "";
        if (!StringUtils.hasText(value)) {
            return "";
        }

        if (value.startsWith("```")) {
            value = value.replaceFirst("^```json\\s*", "");
            value = value.replaceFirst("^```\\s*", "");
            value = value.replaceFirst("\\s*```$", "");
        }

        int firstBrace = value.indexOf('{');
        int lastBrace = value.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return value.substring(firstBrace, lastBrace + 1);
        }

        return value;
    }

    public record AdvisorResult(
            Boolean relevant,
            String rejectionReason,
            String title,
            String summary,
            String rationale,
            String followUp,
            Boolean imageReadable,
            String imageFeedback,
            Boolean interiorDetected,
            List<AdvisorRecommendation> recommendations
    ) {
    }

    public record AdvisorRecommendation(
            Long serviceId,
            String matchReason
    ) {
    }
}
