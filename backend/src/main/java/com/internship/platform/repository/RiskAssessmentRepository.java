package com.internship.platform.repository;

import com.internship.platform.entity.Internship;
import com.internship.platform.entity.RiskAssessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, Long> {

    Optional<RiskAssessment> findTopByInternshipOrderByCreatedAtDesc(Internship internship);

    Optional<RiskAssessment> findByInternshipId(Long internshipId);

    List<RiskAssessment> findByInternship(Internship internship);
}
