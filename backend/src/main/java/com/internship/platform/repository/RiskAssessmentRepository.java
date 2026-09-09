package com.internship.platform.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.internship.platform.entity.Internship;
import com.internship.platform.entity.RiskAssessment;
import com.internship.platform.entity.RiskLevel;

public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, Long> {

    Optional<RiskAssessment> findTopByInternshipOrderByCreatedAtDesc(Internship internship);

    Optional<RiskAssessment> findByInternshipId(Long internshipId);

    List<RiskAssessment> findByInternship(Internship internship);

    List<RiskAssessment> findByLevelInOrderByCreatedAtDesc(List<RiskLevel> levels);

    long countByLevel(RiskLevel level);
}
