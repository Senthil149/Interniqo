package com.internship.platform.controller;

import com.internship.platform.dto.InternshipSearchParams;
import com.internship.platform.dto.RecommendationListResponse;
import com.internship.platform.service.RecommendationService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints for student AI recommendations:
 *
 * GET  /api/recommendations          — returns current stored recommendations
 * POST /api/recommendations/generate — runs hard filters, calls AI /match, stores & returns new ranking
 */
@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping
    public RecommendationListResponse getRecommendations(Authentication authentication) {
        return recommendationService.getRecommendations(authentication.getName());
    }

    @PostMapping("/generate")
    public RecommendationListResponse generateRecommendations(
            @RequestBody(required = false) InternshipSearchParams filters,
            Authentication authentication) {
        return recommendationService.generateRecommendations(authentication.getName(), filters);
    }
}
