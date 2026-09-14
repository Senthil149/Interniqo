package com.internship.platform.service;

import com.internship.platform.client.AiServiceClient;
import com.internship.platform.dto.InternshipSearchParams;
import com.internship.platform.dto.MatchInternshipItem;
import com.internship.platform.dto.MatchResponse;
import com.internship.platform.dto.MatchResultItem;
import com.internship.platform.dto.RecommendationItemResponse;
import com.internship.platform.dto.RecommendationListResponse;
import com.internship.platform.dto.StudentRecommendationDashboardResponse;
import com.internship.platform.entity.ApplicationStatus;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.Recommendation;
import com.internship.platform.entity.Student;
import com.internship.platform.entity.User;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.ApplicationRepository;
import com.internship.platform.repository.CredentialRepository;
import com.internship.platform.repository.InternshipRepository;
import com.internship.platform.repository.RecommendationRepository;
import com.internship.platform.entity.StudentPreference;
import com.internship.platform.repository.RiskAssessmentRepository;
import com.internship.platform.repository.StudentPreferenceRepository;
import com.internship.platform.repository.StudentRepository;
import com.internship.platform.repository.UserRepository;
import com.internship.platform.util.InternshipSpecification;
import com.internship.platform.util.SkillAnalysisUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
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
    private final StudentPreferenceRepository studentPreferenceRepository;
    private final InternshipRepository internshipRepository;
    private final RecommendationRepository recommendationRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final ApplicationRepository applicationRepository;
    private final AiServiceClient aiServiceClient;
    private final CredentialRepository credentialRepository;

    @Autowired
    public RecommendationService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            StudentPreferenceRepository studentPreferenceRepository,
            InternshipRepository internshipRepository,
            RecommendationRepository recommendationRepository,
            RiskAssessmentRepository riskAssessmentRepository,
            ApplicationRepository applicationRepository,
            AiServiceClient aiServiceClient,
            @Autowired(required = false) CredentialRepository credentialRepository) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.studentPreferenceRepository = studentPreferenceRepository;
        this.internshipRepository = internshipRepository;
        this.recommendationRepository = recommendationRepository;
        this.riskAssessmentRepository = riskAssessmentRepository;
        this.applicationRepository = applicationRepository;
        this.aiServiceClient = aiServiceClient;
        this.credentialRepository = credentialRepository;
    }

    public RecommendationService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            StudentPreferenceRepository studentPreferenceRepository,
            InternshipRepository internshipRepository,
            RecommendationRepository recommendationRepository,
            RiskAssessmentRepository riskAssessmentRepository,
            ApplicationRepository applicationRepository,
            AiServiceClient aiServiceClient) {
        this(userRepository, studentRepository, studentPreferenceRepository, internshipRepository, recommendationRepository, riskAssessmentRepository, applicationRepository, aiServiceClient, null);
    }

    public RecommendationService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            InternshipRepository internshipRepository,
            RecommendationRepository recommendationRepository,
            RiskAssessmentRepository riskAssessmentRepository,
            ApplicationRepository applicationRepository,
            AiServiceClient aiServiceClient) {
        this(userRepository, studentRepository, null, internshipRepository, recommendationRepository, riskAssessmentRepository, applicationRepository, aiServiceClient, null);
    }

    public RecommendationService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            InternshipRepository internshipRepository,
            RecommendationRepository recommendationRepository,
            RiskAssessmentRepository riskAssessmentRepository,
            AiServiceClient aiServiceClient) {
        this(userRepository, studentRepository, null, internshipRepository, recommendationRepository, riskAssessmentRepository, null, aiServiceClient, null);
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
        List<Recommendation> deduped = deduplicateRecommendations(stored);
        if (deduped.isEmpty()) {
            return RecommendationListResponse.empty(
                    "No recommendations generated yet. Click 'Generate Recommendations' to begin.");
        }

        Instant generatedAt = deduped.get(0).getCreatedAt();
        StudentPreference pref = studentPreferenceRepository != null
                ? studentPreferenceRepository.findByStudent(student).orElse(null)
                : null;
        List<RecommendationItemResponse> items = new ArrayList<>();
        for (int i = 0; i < deduped.size(); i++) {
            Recommendation rec = deduped.get(i);
            com.internship.platform.entity.RiskAssessment risk = rec.getInternship() != null
                    ? riskAssessmentRepository.findTopByInternshipOrderByCreatedAtDesc(rec.getInternship()).orElse(null)
                    : null;
            RecommendationItemResponse item = RecommendationItemResponse.from(rec, risk, pref);
            item.setRanking(i + 1);
            items.add(item);
        }

        return RecommendationListResponse.success(items, generatedAt);
    }

    /**
     * Get live recommendation dashboard statistics for the student,
     * including match scores, counts, application milestones, and top recommendation previews.
     */
    @Transactional(readOnly = true)
    public StudentRecommendationDashboardResponse getStudentDashboard(String email) {
        Student student = resolveStudent(email);

        if (!hasProfileData(student)) {
            return StudentRecommendationDashboardResponse.noProfile(
                    "Please upload your resume first to unlock personalized AI recommendations and fit metrics.");
        }

        List<Recommendation> stored = recommendationRepository.findByStudentOrderByRankingAsc(student);
        List<Recommendation> deduped = deduplicateRecommendations(stored);
        long totalApplied = applicationRepository != null ? applicationRepository.countByStudent(student) : 0L;
        long totalShortlisted = applicationRepository != null ? applicationRepository.countByStudentAndStatus(student, ApplicationStatus.SHORTLISTED) : 0L;
        long totalAccepted = applicationRepository != null ? applicationRepository.countByStudentAndStatus(student, ApplicationStatus.ACCEPTED) : 0L;
        long totalCompleted = applicationRepository != null ? applicationRepository.countByStudentAndStatus(student, ApplicationStatus.COMPLETED) : 0L;
        long totalCredentials = credentialRepository != null ? credentialRepository.countByStudent(student) : 0L;
        long totalSaved = 0L;

        StudentRecommendationDashboardResponse resp = new StudentRecommendationDashboardResponse();
        resp.setHasProfile(true);
        resp.setTotalRecommended(deduped.size());
        resp.setTotalSaved(totalSaved);
        resp.setTotalApplied(totalApplied);
        resp.setTotalShortlisted(totalShortlisted);
        resp.setTotalAccepted(totalAccepted);
        resp.setTotalCompleted(totalCompleted);
        resp.setTotalCredentials(totalCredentials);

        if (deduped.isEmpty()) {
            resp.setTopRecommendations(Collections.emptyList());
            resp.setSummaryMessage("No recommendations generated yet. Click 'Generate Recommendations' to begin.");
            return resp;
        }

        resp.setLastComputedAt(deduped.get(0).getCreatedAt());
        Double topScore = deduped.get(0).getSimilarityScore();
        resp.setTopMatchScore(topScore);
        resp.setTopMatchFitLevel(SkillAnalysisUtil.getFitLevel(topScore));

        long bestCount = deduped.stream()
                .filter(r -> r.getSimilarityScore() != null && r.getSimilarityScore() >= 0.70)
                .count();
        long strongCount = deduped.stream()
                .filter(r -> r.getSimilarityScore() != null && r.getSimilarityScore() >= 0.50 && r.getSimilarityScore() < 0.70)
                .count();
        long goodCount = deduped.stream()
                .filter(r -> r.getSimilarityScore() != null && r.getSimilarityScore() >= 0.30 && r.getSimilarityScore() < 0.50)
                .count();

        resp.setBestMatchCount(bestCount);
        resp.setStrongMatchCount(strongCount);
        resp.setGoodMatchCount(goodCount);

        List<RecommendationItemResponse> topItems = new ArrayList<>();
        StudentPreference pref = studentPreferenceRepository != null
                ? studentPreferenceRepository.findByStudent(student).orElse(null)
                : null;
        for (int i = 0; i < Math.min(3, deduped.size()); i++) {
            Recommendation rec = deduped.get(i);
            com.internship.platform.entity.RiskAssessment risk = rec.getInternship() != null
                    ? riskAssessmentRepository.findTopByInternshipOrderByCreatedAtDesc(rec.getInternship()).orElse(null)
                    : null;
            RecommendationItemResponse item = RecommendationItemResponse.from(rec, risk, pref);
            item.setRanking(i + 1);
            topItems.add(item);
        }

        resp.setTopRecommendations(topItems);
        resp.setSummaryMessage("Active AI match recommendations computed from your verified profile.");
        return resp;
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

        // Deduplicate eligible postings so duplicate seed/test internships never produce duplicate recommendations
        Map<String, Internship> uniqueEligibleMap = new java.util.LinkedHashMap<>();
        for (Internship in : eligible) {
            Long compId = (in.getCompany() != null) ? in.getCompany().getId() : 0L;
            String normTitle = (in.getTitle() != null) ? in.getTitle().trim().toLowerCase(java.util.Locale.ROOT) : "";
            String dedupKey = compId + "::" + normTitle;
            uniqueEligibleMap.putIfAbsent(dedupKey, in);
        }
        List<Internship> dedupedEligible = new ArrayList<>(uniqueEligibleMap.values());

        // Step 2: Format eligible postings for the AI service
        List<MatchInternshipItem> matchItems = new ArrayList<>();
        Map<Long, Internship> internshipMap = dedupedEligible.stream()
                .collect(Collectors.toMap(Internship::getId, Function.identity(), (a, b) -> a));

        for (Internship in : dedupedEligible) {
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

        StudentPreference pref = studentPreferenceRepository != null
                ? studentPreferenceRepository.findByStudent(student).orElse(null)
                : null;
        List<RecommendationItemResponse> responseItems = savedList.stream()
                .map(rec -> {
                    com.internship.platform.entity.RiskAssessment risk = rec.getInternship() != null
                            ? riskAssessmentRepository.findTopByInternshipOrderByCreatedAtDesc(rec.getInternship()).orElse(null)
                            : null;
                    return RecommendationItemResponse.from(rec, risk, pref);
                })
                .toList();

        return RecommendationListResponse.success(responseItems, now);
    }

    private List<Recommendation> deduplicateRecommendations(List<Recommendation> stored) {
        if (stored == null || stored.isEmpty()) {
            return Collections.emptyList();
        }
        List<Recommendation> result = new ArrayList<>();
        java.util.Set<String> seenRoles = new java.util.HashSet<>();
        for (Recommendation rec : stored) {
            if (rec.getInternship() == null) {
                continue;
            }
            Long compId = (rec.getInternship().getCompany() != null)
                    ? rec.getInternship().getCompany().getId()
                    : 0L;
            String normTitle = (rec.getInternship().getTitle() != null)
                    ? rec.getInternship().getTitle().trim().toLowerCase(java.util.Locale.ROOT)
                    : "";
            String roleKey = compId + "::" + normTitle;
            if (seenRoles.add(roleKey)) {
                result.add(rec);
            }
        }
        return result;
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
                || (student.getSummary() != null && !student.getSummary().isBlank())
                || (student.getExperience() != null && !student.getExperience().isBlank())
                || (student.getProjects() != null && !student.getProjects().isBlank())
                || (student.getEducation() != null && !student.getEducation().isBlank());
    }

    private String buildResumeRepresentation(Student student) {
        StringBuilder sb = new StringBuilder();
        appendSection(sb, "Summary", student.getSummary());
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
