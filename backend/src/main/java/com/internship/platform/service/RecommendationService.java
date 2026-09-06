package com.internship.platform.service;

import com.internship.platform.client.AiServiceClient;
import com.internship.platform.dto.InternshipSearchParams;
import com.internship.platform.dto.MatchInternshipItem;
import com.internship.platform.dto.MatchResponse;
import com.internship.platform.dto.MatchResultItem;
import com.internship.platform.dto.RecommendationItemResponse;
import com.internship.platform.dto.RecommendationListResponse;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.Recommendation;
import com.internship.platform.entity.Student;
import com.internship.platform.entity.User;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.InternshipRepository;
import com.internship.platform.repository.RecommendationRepository;
import com.internship.platform.repository.StudentRepository;
import com.internship.platform.repository.UserRepository;
import com.internship.platform.util.InternshipSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Recommendation service orchestrating the full pipeline:
 *
 * 1. Hard filters (country, work mode, duration, stipend, eligibility, visa)
 *    applied server-side in MySQL via {@link InternshipSpecification}
 *    (Design Rule #1: hard filters before semantic ranking).
 * 2. Sentence-BERT semantic matching via the Python AI microservice
 *    (Design Rule #5: separate HTTP microservice).
 * 3. Raw cosine similarity score stored as ranking signal in MySQL
 *    (Design Rule #2: ranking signal only, never a percentage or probability).
 * 4. Graceful handling when student has no resume/profile data yet.
 */
@Service
public class RecommendationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final InternshipRepository internshipRepository;
    private final RecommendationRepository recommendationRepository;
    private final AiServiceClient aiServiceClient;

    public RecommendationService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            InternshipRepository internshipRepository,
            RecommendationRepository recommendationRepository,
            AiServiceClient aiServiceClient) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.internshipRepository = internshipRepository;
        this.recommendationRepository = recommendationRepository;
        this.aiServiceClient = aiServiceClient;
    }

    /**
     * Get the student's most recently generated recommendations from the database.
     */
    @Transactional(readOnly = true)
    public RecommendationListResponse getRecommendations(String email) {
        Student student = resolveStudent(email);

        if (!hasProfileData(student)) {
            return RecommendationListResponse.noProfile(
                    "Please upload your resume first to unlock AI-powered recommendations.");
        }

        List<Recommendation> stored = recommendationRepository.findByStudentOrderByRankingAsc(student);
        if (stored.isEmpty()) {
            return RecommendationListResponse.empty(
                    "No recommendations generated yet. Click 'Generate Recommendations' to begin.");
        }

        Instant generatedAt = stored.get(0).getCreatedAt();
        List<RecommendationItemResponse> items = stored.stream()
                .map(RecommendationItemResponse::from)
                .toList();

        return RecommendationListResponse.success(items, generatedAt);
    }

    /**
     * Generate fresh recommendations:
     * 1. Check student profile. If absent, return prompt without erroring.
     * 2. Execute mandatory structured hard filters on internships (Design Rule #1).
     * 3. Forward eligible internships to AI service /match endpoint.
     * 4. Persist ranked results in recommendations table with raw cosine score (Design Rule #2).
     */
    @Transactional
    public RecommendationListResponse generateRecommendations(String email, InternshipSearchParams filters) {
        Student student = resolveStudent(email);

        if (!hasProfileData(student)) {
            return RecommendationListResponse.noProfile(
                    "Please upload your resume first to generate personalized recommendations.");
        }

        String resumeText = buildResumeRepresentation(student);
        if (resumeText.isBlank()) {
            return RecommendationListResponse.noProfile(
                    "Your uploaded profile contains no extractable text. Please re-upload a clear PDF resume.");
        }

        // Step 1: Mandatory hard filters (Design Rule #1)
        InternshipSearchParams searchParams = filters != null ? filters : new InternshipSearchParams();
        Specification<Internship> spec = InternshipSpecification.fromParams(searchParams);
        List<Internship> eligible = internshipRepository.findAll(spec);

        if (eligible.isEmpty()) {
            log.info("No internships matched hard filters for student {}", student.getId());
            return RecommendationListResponse.empty("No open internships matched your filter criteria.");
        }

        // Step 2: Format eligible postings for the AI service
        List<MatchInternshipItem> matchItems = new ArrayList<>();
        Map<Long, Internship> internshipMap = eligible.stream()
                .collect(Collectors.toMap(Internship::getId, Function.identity(), (a, b) -> a));

        for (Internship in : eligible) {
            String desc = (in.getDescription() != null && !in.getDescription().isBlank())
                    ? in.getDescription()
                    : (in.getTitle() != null ? in.getTitle() : "Internship opportunity");
            if (in.getRequiredSkills() != null && !in.getRequiredSkills().isBlank()) {
                desc = desc + "\nRequired Skills: " + in.getRequiredSkills();
            }
            matchItems.add(new MatchInternshipItem(in.getId(), in.getTitle(), desc));
        }

        // Step 3: Call AI service /match (Design Rule #5)
        Optional<MatchResponse> aiResponse = aiServiceClient.match(resumeText, matchItems);
        if (aiResponse.isEmpty()) {
            log.error("AI service /match call failed for student {}", student.getId());
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI recommendation service is temporarily unavailable. Please verify the AI service is running.");
        }

        List<MatchResultItem> matches = aiResponse.get().getMatches();
        if (matches == null || matches.isEmpty()) {
            return RecommendationListResponse.empty("AI service returned no recommendations.");
        }

        // Step 4: Clear existing recommendations and persist new ranking in MySQL
        recommendationRepository.deleteByStudent(student);

        Instant now = Instant.now();
        List<Recommendation> savedList = new ArrayList<>();

        for (int i = 0; i < matches.size(); i++) {
            MatchResultItem item = matches.get(i);
            Internship in = internshipMap.get(item.getId());
            if (in != null) {
                Recommendation rec = new Recommendation(
                        student,
                        in,
                        item.getSimilarityScore(), // Raw cosine similarity score (Design Rule #2)
                        i + 1,                     // 1-based rank
                        now
                );
                savedList.add(rec);
            }
        }

        recommendationRepository.saveAll(savedList);

        List<RecommendationItemResponse> responseItems = savedList.stream()
                .map(RecommendationItemResponse::from)
                .toList();

        return RecommendationListResponse.success(responseItems, now);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Student resolveStudent(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        return studentRepository.findByUser(user)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "No student profile found"));
    }

    private boolean hasProfileData(Student student) {
        return (student.getResumePath() != null && !student.getResumePath().isBlank())
                || (student.getSkills() != null && !student.getSkills().isBlank())
                || (student.getExperience() != null && !student.getExperience().isBlank())
                || (student.getProjects() != null && !student.getProjects().isBlank())
                || (student.getEducation() != null && !student.getEducation().isBlank());
    }

    private String buildResumeRepresentation(Student student) {
        StringBuilder sb = new StringBuilder();
        appendSection(sb, "Skills", student.getSkills());
        appendSection(sb, "Experience", student.getExperience());
        appendSection(sb, "Projects", student.getProjects());
        appendSection(sb, "Education", student.getEducation());
        appendSection(sb, "Certifications", student.getCertifications());
        appendSection(sb, "Interests", student.getInterests());
        return sb.toString().trim();
    }

    private void appendSection(StringBuilder sb, String title, String content) {
        if (content != null && !content.isBlank()) {
            sb.append(title).append(":\n").append(content.trim()).append("\n\n");
        }
    }
}
