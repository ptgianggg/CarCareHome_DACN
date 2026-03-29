package com.carcarehome.backend.controller;

import com.carcarehome.backend.dto.ai.AiServiceAdvisorResponse;
import com.carcarehome.backend.service.ai.AiServiceAdvisorService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:5173")
public class AiServiceAdvisorController {

    private final AiServiceAdvisorService aiServiceAdvisorService;

    public AiServiceAdvisorController(AiServiceAdvisorService aiServiceAdvisorService) {
        this.aiServiceAdvisorService = aiServiceAdvisorService;
    }

    @PostMapping(value = "/service-advisor", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AiServiceAdvisorResponse advise(
            @RequestParam("description") String description,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) throws IOException {
        return aiServiceAdvisorService.advise(description, image);
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, Object>> handleBadRequest(RuntimeException exception) {
        return ResponseEntity.badRequest().body(Map.of(
                "error", true,
                "message", exception.getMessage()
        ));
    }
}
