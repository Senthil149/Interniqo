package com.internship.platform.repository;

import com.internship.platform.entity.Recommendation;
import com.internship.platform.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {

    List<Recommendation> findByStudentOrderByRankingAsc(Student student);

    List<Recommendation> findTop3ByStudentOrderByRankingAsc(Student student);

    long countByStudent(Student student);

    @Modifying
    @Query("DELETE FROM Recommendation r WHERE r.student = :student")
    void deleteByStudent(@Param("student") Student student);
}
