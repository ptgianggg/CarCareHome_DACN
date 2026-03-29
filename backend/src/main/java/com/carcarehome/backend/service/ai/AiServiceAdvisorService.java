package com.carcarehome.backend.service.ai;

import com.carcarehome.backend.dto.ai.AiServiceAdvisorResponse;
import com.carcarehome.backend.dto.ai.AiServiceRecommendationDto;
import com.carcarehome.backend.entity.Service;
import com.carcarehome.backend.service.ServiceService;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
public class AiServiceAdvisorService {

    private final ServiceService serviceService;
    private final VehicleIssueRuleEngine ruleEngine;
    private final OpenRouterServiceAdvisorClient openRouterClient;

    public AiServiceAdvisorService(
            ServiceService serviceService,
            VehicleIssueRuleEngine ruleEngine,
            OpenRouterServiceAdvisorClient openRouterClient
    ) {
        this.serviceService = serviceService;
        this.ruleEngine = ruleEngine;
        this.openRouterClient = openRouterClient;
    }

    public AiServiceAdvisorResponse advise(String description, MultipartFile image) throws IOException {
        if (!StringUtils.hasText(description) || description.trim().split("\\s+").length < 5) {
            throw new IllegalArgumentException("Vui long mo ta ro tinh trang xe, toi thieu 5 tu.");
        }

        boolean imageProvided = image != null && !image.isEmpty();

        List<Service> activeServices = serviceService.getAllServices().stream()
                .filter(service -> service.getActive() == null || service.getActive())
                .collect(Collectors.toList());

        VehicleIssueRuleEngine.RuleContext ruleContext = ruleEngine.analyze(description, activeServices);
        OpenRouterServiceAdvisorClient.AdvisorResult aiResult = openRouterClient.generateAdvice(
                buildPrompt(description, ruleContext, image),
                image
        );
        boolean relevant = !Boolean.FALSE.equals(aiResult.relevant());
        boolean imageReadable = imageProvided && Boolean.TRUE.equals(aiResult.imageReadable());

        List<AiServiceRecommendationDto> recommendations = relevant
                ? mergeRecommendations(ruleContext, aiResult)
                : List.of();

        return new AiServiceAdvisorResponse(
                "OpenRouter",
                ruleContext.ruleId(),
                relevant,
                relevant ? "" : fallback(aiResult.rejectionReason(), "Minh chi ho tro noi dung lien quan den o to."),
                fallback(aiResult.title(), relevant ? ruleContext.ruleTitle() : "Khong the tu van"),
                fallback(aiResult.summary(), relevant ? "Da phan tich xong." : "Noi dung khong lien quan den o to."),
                fallback(aiResult.rationale(), relevant ? "Chi de xuat dich vu co san trong he thong." : "Hay gui anh xe hoac mo ta tinh trang xe."),
                fallback(aiResult.followUp(), relevant ? "Chon dich vu de xem chi tiet hoac dat lich." : "Gui lai noi dung lien quan den o to."),
                imageProvided,
                imageReadable,
                imageProvided
                        ? fallback(
                        aiResult.imageFeedback(),
                        imageReadable
                                ? "Anh du ro de tham khao them khi tu van."
                                : "Anh chua du ro, he thong uu tien dua vao mo ta hien tai."
                )
                        : "",
                relevant && (Boolean.TRUE.equals(aiResult.interiorDetected()) || ruleContext.descriptionImpliesInterior()),
                recommendations
        );
    }

    private List<AiServiceRecommendationDto> mergeRecommendations(
            VehicleIssueRuleEngine.RuleContext ruleContext,
            OpenRouterServiceAdvisorClient.AdvisorResult aiResult
    ) {
        Map<Long, Service> serviceMap = ruleContext.candidateServices().stream()
                .collect(Collectors.toMap(Service::getId, service -> service, (left, right) -> left, LinkedHashMap::new));

        List<AiServiceRecommendationDto> merged = new ArrayList<>();
        if (aiResult.recommendations() != null) {
            for (OpenRouterServiceAdvisorClient.AdvisorRecommendation recommendation : aiResult.recommendations()) {
                if (recommendation == null || recommendation.serviceId() == null) {
                    continue;
                }
                Service service = serviceMap.get(recommendation.serviceId());
                if (service == null) {
                    continue;
                }
                merged.add(toDto(service, recommendation.matchReason()));
            }
        }

        boolean interiorRequired = Boolean.TRUE.equals(aiResult.interiorDetected()) || ruleContext.descriptionImpliesInterior();
        Service interiorService = ruleContext.interiorService();
        if (interiorRequired && interiorService != null) {
            merged.removeIf(item -> interiorService.getId().equals(item.id()));
            merged.add(0, toDto(interiorService, "Uu tien xu ly noi that."));
        }

        if (merged.isEmpty()) {
            for (Service candidate : ruleContext.candidateServices().stream().limit(3).toList()) {
                merged.add(toDto(candidate, "Lua chon gan nhat voi mo ta hien tai."));
            }
        }

        Map<Long, AiServiceRecommendationDto> unique = merged.stream()
                .collect(Collectors.toMap(AiServiceRecommendationDto::id, item -> item, (left, right) -> left, LinkedHashMap::new));

        return new ArrayList<>(unique.values()).stream().limit(3).toList();
    }

    private AiServiceRecommendationDto toDto(Service service, String matchReason) {
        String imageUrl = service.getImageUrls() != null && !service.getImageUrls().isEmpty()
                ? service.getImageUrls().get(0)
                : null;

        return new AiServiceRecommendationDto(
                service.getId(),
                service.getName(),
                service.getCategory(),
                service.getPrice(),
                service.getDescription(),
                imageUrl,
                fallback(matchReason, "Phu hop voi nhu cau hien tai.")
        );
    }

    private String buildPrompt(String description, VehicleIssueRuleEngine.RuleContext ruleContext, MultipartFile image) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Ban la AI tu van dich vu cham soc xe cho website CarCareHome.\n");
        prompt.append("Bat buoc tra loi hoan toan bang tieng Viet tu nhien, ngan gon, khong duoc dung tieng Anh.\n");
        prompt.append("Khong nhac toi furniture, noi that nha, do dung van phong hoac bat ky linh vuc nao ngoai o to.\n");
        prompt.append("Neu noi dung khong lien quan den o to thi tra ve relevant=false, recommendations=[].\n");
        prompt.append("Chi duoc chon serviceId trong danh sach cho phep.\n");
        prompt.append("Khong duoc tao dich vu moi.\n");
        prompt.append("Neu mo ta hoac anh la noi that xe thi interiorDetected=true.\n");
        prompt.append("Neu co anh, bat buoc danh gia do ro cua anh.\n");
        prompt.append("Neu anh mo, thieu sang, xa, rung, bi che khuat hoac khong nhin ro bo phan xe thi imageReadable=false va imageFeedback phai noi ro ly do.\n");
        prompt.append("Neu anh chua du ro nhung mo ta van du thong tin thi van duoc tu van dua tren mo ta, nhung rationale phai noi ro la anh chi mang tinh tham khao.\n");
        prompt.append("Neu ca anh va mo ta deu khong du can cu thi tra ve relevant=false, recommendations=[] va followUp yeu cau gui anh ro hon hoac mo ta cu the hon.\n");

        if (ruleContext.interiorService() != null) {
            prompt.append("Neu interiorDetected=true thi recommendation dau tien phai la serviceId=")
                    .append(ruleContext.interiorService().getId())
                    .append(".\n");
        }

        prompt.append("Anh dinh kem: ").append(image != null && !image.isEmpty() ? "co" : "khong").append(".\n");
        prompt.append("Mo ta: ").append(description.trim()).append("\n");
        prompt.append("Danh sach dich vu hop le:\n");

        for (Service service : ruleContext.candidateServices()) {
            prompt.append("- serviceId=").append(service.getId())
                    .append(" | ten=").append(service.getName())
                    .append(" | danhMuc=").append(fallback(service.getCategory(), "Khac"))
                    .append(" | gia=").append(service.getPrice() == null ? 0 : service.getPrice())
                    .append(" | moTa=").append(fallback(service.getDescription(), "Khong co mo ta"))
                    .append("\n");
        }

        return prompt.toString();
    }

    private String fallback(String value, String defaultValue) {
        return StringUtils.hasText(value) ? value : defaultValue;
    }
}
