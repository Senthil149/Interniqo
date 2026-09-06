package com.internship.platform.service;

import com.internship.platform.dto.RiskAssessmentResponse;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.RiskAssessment;
import com.internship.platform.entity.RiskLevel;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.InternshipRepository;
import com.internship.platform.repository.RiskAssessmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Automated weighted risk-assessment engine for internship postings.
 *
 * Design Rule #3 compliance:
 * 1. Indicators and weights:
 *    - Fee request: 25
 *    - Training/payment request: 20
 *    - Unrealistic stipend: 15
 *    - Guaranteed job promise: 20
 *    - Incomplete company info: 10
 *    - Suspicious payment instructions: 20
 *    - Duplicate posting: 15
 * 2. Total weights sum to 125. The total score is EXPLICITLY CAPPED AT 100 before
 *    assigning labels:
 *    - Low: score < 40
 *    - Medium: 40 <= score <= 70
 *    - High: score > 70
 * 3. Warning signal only: this assessment is an automated heuristic signal to alert
 *    students and platform operators. It is NEVER framed as proof of fraud or
 *    as a "verified safe" certification.
 */
@Service
public class RiskAssessmentService {

    private static final Logger log = LoggerFactory.getLogger(RiskAssessmentService.class);

    // Indicator weights (sum to 125)
    public static final int WEIGHT_FEE_REQUEST = 25;
    public static final int WEIGHT_TRAINING_PAYMENT = 20;
    public static final int WEIGHT_UNREALISTIC_STIPEND = 15;
    public static final int WEIGHT_JOB_GUARANTEE = 20;
    public static final int WEIGHT_INCOMPLETE_COMPANY = 10;
    public static final int WEIGHT_SUSPICIOUS_PAYMENT = 20;
    public static final int WEIGHT_DUPLICATE_POSTING = 15;

    // Detection regex patterns
    private static final Pattern FEE_PATTERN = Pattern.compile(
            "\\b(registration fee|application fee|processing fee|security deposit|initial deposit|" +
            "pay a fee|fee of|fees required|refundable deposit|upfront fee|candidate fee|pay to apply)\\b",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern TRAINING_PAYMENT_PATTERN = Pattern.compile(
            "\\b(paid training|training fee|purchase (?:the |our )?(?:course|training|materials|certificate)|" +
            "pay for training|mandatory training fee|candidates must pay for|course fee|training charge)\\b",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern UNREALISTIC_EARNING_PATTERN = Pattern.compile(
            "\\b(earn \\$?\\d{3,} (?:daily|per day|hourly|per week)|get rich|" +
            "unrealistic (?:stipend|salary)|\\$\\d{5,} (?:per month|monthly)|earn up to \\$?\\d{5,})\\b",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern JOB_GUARANTEE_PATTERN = Pattern.compile(
            "\\b(100% job guarantee|100% placement|guaranteed job|guaranteed placement|" +
            "guaranteed employment|direct hiring without interview|instant offer letter|" +
            "guaranteed salary|offer letter guaranteed)\\b",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern SUSPICIOUS_PAYMENT_PATTERN = Pattern.compile(
            "\\b(crypto(?:currency)?|bitcoin|btc|usdt|ethereum|gift cards?|western union|moneygram|" +
            "telegram (?:pay|wallet|transfer)|zelle|cashapp|cash app|venmo|wire transfer|" +
            "check deposit|cashier'?s check)\\b",
            Pattern.CASE_INSENSITIVE);

    private final InternshipRepository internshipRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;

    public RiskAssessmentService(
            InternshipRepository internshipRepository,
            RiskAssessmentRepository riskAssessmentRepository) {
        this.internshipRepository = internshipRepository;
        this.riskAssessmentRepository = riskAssessmentRepository;
    }

    /**
     * Analyze an internship posting against all 7 weighted risk indicators,
     * persist the result, and return the report.
     */
    @Transactional
    public RiskAssessmentResponse analyzeInternship(Long internshipId) {
        Internship internship = internshipRepository.findById(internshipId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));

        List<String> reasons = new ArrayList<>();
        int rawScore = 0;

        String corpus = buildTextCorpus(internship);
        Company company = internship.getCompany();

        // 1. Fee request (weight: 25)
        if (FEE_PATTERN.matcher(corpus).find()) {
            rawScore += WEIGHT_FEE_REQUEST;
            reasons.add("Upfront or application fee requested from applicant (weight: " + WEIGHT_FEE_REQUEST + ")");
        }

        // 2. Training/payment request (weight: 20)
        if (TRAINING_PAYMENT_PATTERN.matcher(corpus).find()) {
            rawScore += WEIGHT_TRAINING_PAYMENT;
            reasons.add("Mandatory paid training or course purchase requirement detected (weight: " + WEIGHT_TRAINING_PAYMENT + ")");
        }

        // 3. Unrealistic stipend (weight: 15)
        if (isUnrealisticStipend(internship, corpus)) {
            rawScore += WEIGHT_UNREALISTIC_STIPEND;
            reasons.add("Unrealistically high stipend or earning claim detected (weight: " + WEIGHT_UNREALISTIC_STIPEND + ")");
        }

        // 4. Guaranteed job promise (weight: 20)
        if (JOB_GUARANTEE_PATTERN.matcher(corpus).find()) {
            rawScore += WEIGHT_JOB_GUARANTEE;
            reasons.add("Guaranteed employment or job placement promise detected (weight: " + WEIGHT_JOB_GUARANTEE + ")");
        }

        // 5. Incomplete company information (weight: 10)
        if (isIncompleteCompany(company)) {
            rawScore += WEIGHT_INCOMPLETE_COMPANY;
            reasons.add("Company profile is missing website, descriptive background, or country information (weight: " + WEIGHT_INCOMPLETE_COMPANY + ")");
        }

        // 6. Suspicious payment instructions (weight: 20)
        if (SUSPICIOUS_PAYMENT_PATTERN.matcher(corpus).find()) {
            rawScore += WEIGHT_SUSPICIOUS_PAYMENT;
            reasons.add("Suspicious or unconventional payment instructions detected (weight: " + WEIGHT_SUSPICIOUS_PAYMENT + ")");
        }

        // 7. Duplicate posting (weight: 15)
        if (isDuplicatePosting(internship)) {
            rawScore += WEIGHT_DUPLICATE_POSTING;
            reasons.add("Duplicate or near-identical internship posting detected for this company (weight: " + WEIGHT_DUPLICATE_POSTING + ")");
        }

        // ── Design Rule #3 Cap ────────────────────────────────────────────────
        // Indicators sum to 125 — cap the total score at 100 before assigning labels:
        // Low (<40), Medium (40-70), High (>70).
        int finalScore = Math.min(rawScore, 100);

        RiskLevel level;
        if (finalScore < 40) {
            level = RiskLevel.LOW;
        } else if (finalScore <= 70) {
            level = RiskLevel.MEDIUM;
        } else {
            level = RiskLevel.HIGH;
        }

        String storedReasons = reasons.isEmpty()
                ? "No risk indicators triggered. Note: This indicates absence of automated warning signals, not proof of safety."
                : String.join("\n", reasons);

        // Update existing record if present, or create a new one
        RiskAssessment assessment = riskAssessmentRepository
                .findTopByInternshipOrderByCreatedAtDesc(internship)
                .orElseGet(() -> {
                    RiskAssessment ra = new RiskAssessment();
                    ra.setInternship(internship);
                    return ra;
                });

        assessment.setScore(finalScore);
        assessment.setLevel(level);
        assessment.setReasons(storedReasons);
        assessment.setCreatedAt(Instant.now());

        RiskAssessment saved = riskAssessmentRepository.save(assessment);
        log.info("Risk assessment for internship {}: rawScore={}, finalScore={}, level={}",
                internshipId, rawScore, finalScore, level);

        return RiskAssessmentResponse.from(saved);
    }

    /**
     * Get the latest risk assessment for an internship.
     * If not found, triggers a fresh analysis.
     */
    @Transactional
    public RiskAssessmentResponse getAssessment(Long internshipId) {
        Internship internship = internshipRepository.findById(internshipId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));

        return riskAssessmentRepository.findTopByInternshipOrderByCreatedAtDesc(internship)
                .map(RiskAssessmentResponse::from)
                .orElseGet(() -> analyzeInternship(internshipId));
    }

    /**
     * Lookup risk assessment entity for an internship (used internally by InternshipService).
     */
    @Transactional(readOnly = true)
    public Optional<RiskAssessment> getAssessmentEntity(Internship internship) {
        return riskAssessmentRepository.findTopByInternshipOrderByCreatedAtDesc(internship);
    }

    // ── Indicator Heuristics ──────────────────────────────────────────────────

    private String buildTextCorpus(Internship internship) {
        StringBuilder sb = new StringBuilder();
        if (internship.getTitle() != null) sb.append(internship.getTitle()).append(" ");
        if (internship.getDescription() != null) sb.append(internship.getDescription()).append(" ");
        if (internship.getRequiredSkills() != null) sb.append(internship.getRequiredSkills()).append(" ");
        if (internship.getEligibility() != null) sb.append(internship.getEligibility()).append(" ");
        if (internship.getVisaInformation() != null) sb.append(internship.getVisaInformation()).append(" ");
        return sb.toString();
    }

    private boolean isUnrealisticStipend(Internship in, String corpus) {
        BigDecimal stipend = in.getStipend();
        String currency = in.getCurrency() != null ? in.getCurrency().trim().toUpperCase() : "";

        if (stipend != null) {
            // Student internship stipend thresholds
            if (("USD".equals(currency) || "EUR".equals(currency) || "GBP".equals(currency))
                    && stipend.compareTo(new BigDecimal("15000")) > 0) {
                return true;
            }
            if ("INR".equals(currency) && stipend.compareTo(new BigDecimal("300000")) > 0) {
                return true;
            }
            if (stipend.compareTo(new BigDecimal("250000")) > 0) {
                return true;
            }
        }

        return UNREALISTIC_EARNING_PATTERN.matcher(corpus).find();
    }

    private boolean isIncompleteCompany(Company company) {
        if (company == null) return true;

        String website = company.getWebsite();
        boolean invalidWebsite = website == null
                || website.isBlank()
                || !website.contains(".")
                || website.toLowerCase().contains("example.com")
                || website.equalsIgnoreCase("none")
                || website.equalsIgnoreCase("n/a");

        String description = company.getDescription();
        boolean invalidDescription = description == null
                || description.trim().length() < 30;

        String country = company.getCountry();
        boolean invalidCountry = country == null || country.isBlank();

        return invalidWebsite || invalidDescription || invalidCountry;
    }

    private boolean isDuplicatePosting(Internship current) {
        if (current.getCompany() == null) return false;

        List<Internship> companyListings = internshipRepository
                .findByCompanyOrderByIdDesc(current.getCompany());

        String currentTitle = current.getTitle() != null ? current.getTitle().trim().toLowerCase() : "";
        String currentDesc = current.getDescription() != null ? current.getDescription().trim() : "";

        for (Internship other : companyListings) {
            if (other.getId() != null && !other.getId().equals(current.getId())) {
                String otherTitle = other.getTitle() != null ? other.getTitle().trim().toLowerCase() : "";
                String otherDesc = other.getDescription() != null ? other.getDescription().trim() : "";

                if (!currentTitle.isEmpty() && currentTitle.equalsIgnoreCase(otherTitle)) {
                    return true;
                }
                if (!currentDesc.isEmpty() && currentDesc.length() > 40 && currentDesc.equals(otherDesc)) {
                    return true;
                }
            }
        }
        return false;
    }
}
