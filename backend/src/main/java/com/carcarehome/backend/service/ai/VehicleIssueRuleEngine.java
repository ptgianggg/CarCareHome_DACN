package com.carcarehome.backend.service.ai;

import com.carcarehome.backend.entity.Service;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class VehicleIssueRuleEngine {

    private static final List<String> INTERIOR_ISSUE_KEYWORDS = List.of(
            "noi that", "ghe xe", "ghe da", "tham san", "tap lo", "vo lang", "tran xe",
            "mui hoi", "ben trong", "khoang lai", "cabin", "interior"
    );

    private static final List<String> INTERIOR_SERVICE_KEYWORDS = List.of(
            "ve sinh noi that", "noi that", "don dep noi that", "interior", "cabin"
    );

    private static final List<RuleDefinition> RULES = List.of(
            new RuleDefinition(
                    "interior-care",
                    100,
                    INTERIOR_ISSUE_KEYWORDS,
                    INTERIOR_SERVICE_KEYWORDS,
                    "Ưu tiên vệ sinh nội thất"
            ),
            new RuleDefinition(
                    "paint-and-scratch",
                    80,
                    List.of("tray xuoc", "xuoc", "tray", "va quet", "mat bong", "xoay xam", "op son", "son bi mo", "swirl", "polish"),
                    List.of("danh bong", "hieu chinh son", "phu ceramic", "son", "polish"),
                    "Ưu tiên xử lý bề mặt sơn"
            ),
            new RuleDefinition(
                    "exterior-cleaning",
                    60,
                    List.of("bun dat", "bui ban", "nuoc mua", "kinh ban", "than xe", "mui xe", "ngoai that", "rua xe", "ve sinh ben ngoai"),
                    List.of("rua xe", "ngoai that", "ve sinh", "cham soc than xe", "wash"),
                    "Ưu tiên làm sạch ngoại thất"
            ),
            new RuleDefinition(
                    "wheel-and-brake",
                    50,
                    List.of("mam xe", "lazang", "lop xe", "phanh", "banh xe", "vanh xe", "thang xe"),
                    List.of("mam", "lazang", "lop", "banh xe", "phanh"),
                    "Kiểm tra nhóm bánh xe"
            )
    );

    public RuleContext analyze(String description, List<Service> services) {
        String normalizedDescription = normalize(description);
        RuleDefinition matchedRule = RULES.stream()
                .sorted(Comparator.comparingInt(RuleDefinition::priority).reversed())
                .filter(rule -> countKeywordHits(normalizedDescription, rule.issueKeywords()) > 0)
                .findFirst()
                .orElse(null);

        Service interiorService = findInteriorService(services);
        boolean descriptionImpliesInterior = countKeywordHits(normalizedDescription, INTERIOR_ISSUE_KEYWORDS) > 0;

        List<Service> rankedCandidates = matchedRule != null
                ? rankServices(services, matchedRule.serviceKeywords(), tokenize(description), 2)
                : rankServices(services, tokenize(description), tokenize(description), 1);

        List<Service> candidates = new ArrayList<>();
        if (interiorService != null) {
            candidates.add(interiorService);
        }
        candidates.addAll(rankedCandidates);

        List<Service> uniqueCandidates = candidates.stream()
                .filter(service -> service.getActive() == null || service.getActive())
                .collect(Collectors.collectingAndThen(
                        Collectors.toMap(Service::getId, service -> service, (left, right) -> left, java.util.LinkedHashMap::new),
                        map -> new ArrayList<>(map.values())
                ));

        if (uniqueCandidates.isEmpty()) {
            uniqueCandidates = services.stream()
                    .filter(service -> service.getActive() == null || service.getActive())
                    .limit(6)
                    .collect(Collectors.toList());
        } else if (uniqueCandidates.size() > 6) {
            uniqueCandidates = uniqueCandidates.subList(0, 6);
        }

        return new RuleContext(
                matchedRule != null ? matchedRule.id() : "general-advisor",
                matchedRule != null ? matchedRule.title() : "Đề xuất theo mô tả tổng quát",
                descriptionImpliesInterior,
                interiorService,
                uniqueCandidates
        );
    }

    private Service findInteriorService(List<Service> services) {
        return rankServices(services, INTERIOR_SERVICE_KEYWORDS, List.of(), 4).stream().findFirst().orElse(null);
    }

    private List<Service> rankServices(List<Service> services, List<String> primaryKeywords, List<String> contextTokens, int minimumScore) {
        return services.stream()
                .filter(service -> service.getActive() == null || service.getActive())
                .map(service -> new ScoredService(service, scoreService(service, primaryKeywords, contextTokens)))
                .filter(scored -> scored.score() >= minimumScore)
                .sorted(Comparator
                        .comparingInt(ScoredService::score).reversed()
                        .thenComparing(scored -> scored.service().getPrice() == null ? 0D : scored.service().getPrice()))
                .map(ScoredService::service)
                .collect(Collectors.toList());
    }

    private int scoreService(Service service, List<String> primaryKeywords, List<String> contextTokens) {
        String serviceText = normalize(String.join(" ",
                valueOrEmpty(service.getName()),
                valueOrEmpty(service.getCategory()),
                valueOrEmpty(service.getDescription())
        ));
        String serviceName = normalize(service.getName());
        String serviceCategory = normalize(service.getCategory());

        int score = 0;
        for (String keyword : primaryKeywords) {
            String normalizedKeyword = normalize(keyword);
            if (serviceText.contains(normalizedKeyword)) {
                score += 6;
            }
            if (serviceName.contains(normalizedKeyword)) {
                score += 4;
            }
            if (serviceCategory.contains(normalizedKeyword)) {
                score += 3;
            }
        }

        for (String token : contextTokens) {
            if (serviceText.contains(token)) {
                score += 1;
            }
        }
        return score;
    }

    private int countKeywordHits(String normalizedText, List<String> keywords) {
        int hits = 0;
        for (String keyword : keywords) {
            if (normalizedText.contains(normalize(keyword))) {
                hits++;
            }
        }
        return hits;
    }

    private List<String> tokenize(String text) {
        Set<String> tokens = Arrays.stream(normalize(text).split(" "))
                .filter(token -> token.length() >= 4)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        return new ArrayList<>(tokens);
    }

    private String normalize(String value) {
        String normalized = Normalizer.normalize(valueOrEmpty(value), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'd')
                .toLowerCase(Locale.ROOT);

        return normalized.replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }

    private record RuleDefinition(
            String id,
            int priority,
            List<String> issueKeywords,
            List<String> serviceKeywords,
            String title
    ) {
    }

    private record ScoredService(Service service, int score) {
    }

    public record RuleContext(
            String ruleId,
            String ruleTitle,
            boolean descriptionImpliesInterior,
            Service interiorService,
            List<Service> candidateServices
    ) {
    }
}
