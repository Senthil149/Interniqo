package com.internship.platform.util;

import com.internship.platform.dto.InternshipSearchParams;
import com.internship.platform.entity.Internship;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Builds JPA Criteria predicates for the student internship search.
 *
 * Pipeline rule (from spec): mandatory structured filters are applied here,
 * server-side, before results are returned. No semantic ranking in this phase.
 *
 * Risk scoring / SBERT matching are later phases — do NOT add ranking here.
 */
public final class InternshipSpecification {

    private InternshipSpecification() {}

    public static Specification<Internship> fromParams(InternshipSearchParams params) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Hard filter 1: only OPEN internships are visible to students.
            predicates.add(cb.equal(root.get("status"), "OPEN"));

            // Hard filter 2: country (exact, case-insensitive)
            if (params.getCountry() != null && !params.getCountry().isBlank()) {
                predicates.add(cb.equal(
                        cb.lower(root.get("country")),
                        params.getCountry().trim().toLowerCase()));
            }

            // Hard filter 3: city (partial, case-insensitive)
            if (params.getCity() != null && !params.getCity().isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("city")),
                        "%" + params.getCity().trim().toLowerCase() + "%"));
            }

            // Hard filter 4: work mode (exact, case-insensitive — REMOTE / HYBRID / ONSITE)
            if (params.getWorkMode() != null && !params.getWorkMode().isBlank()) {
                predicates.add(cb.equal(
                        cb.lower(root.get("workMode")),
                        params.getWorkMode().trim().toLowerCase()));
            }

            // Hard filter 5: duration (exact, case-insensitive — e.g. "3 months")
            if (params.getDuration() != null && !params.getDuration().isBlank()) {
                predicates.add(cb.equal(
                        cb.lower(root.get("duration")),
                        params.getDuration().trim().toLowerCase()));
            }

            // Hard filter 6: minimum stipend (>=); internships with null stipend are excluded
            // when this filter is active, since null fails any comparison predicate.
            if (params.getMinStipend() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("stipend"), params.getMinStipend()));
            }

            // Hard filter 7: currency (exact, case-insensitive)
            if (params.getCurrency() != null && !params.getCurrency().isBlank()) {
                predicates.add(cb.equal(
                        cb.lower(root.get("currency")),
                        params.getCurrency().trim().toLowerCase()));
            }

            // Hard filter 8: visa support — when true, only show postings that have
            // visa_information text. This proves the company has documented visa support,
            // NOT that it guarantees visa sponsorship.
            if (Boolean.TRUE.equals(params.getVisaRequired())) {
                predicates.add(cb.and(
                        cb.isNotNull(root.get("visaInformation")),
                        cb.notEqual(root.get("visaInformation"), "")));
            }

            // Soft text filter: keyword matched against title (case-insensitive LIKE)
            // Applied after hard filters, before results are returned.
            // NOTE: this is a structured text filter, NOT semantic ranking.
            if (params.getKeyword() != null && !params.getKeyword().isBlank()) {
                String pattern = "%" + params.getKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("title")), pattern));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
