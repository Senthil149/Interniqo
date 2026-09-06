package com.internship.platform.repository;

import com.internship.platform.entity.Application;
import com.internship.platform.entity.Company;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    boolean existsByStudentAndInternship(Student student, Internship internship);

    Optional<Application> findByStudentAndInternship(Student student, Internship internship);

    List<Application> findByStudentOrderByAppliedAtDesc(Student student);

    List<Application> findByInternshipCompanyOrderByAppliedAtDesc(Company company);

    List<Application> findByInternshipCompanyAndInternshipOrderByAppliedAtDesc(Company company, Internship internship);

    List<Application> findByInternshipOrderByAppliedAtDesc(Internship internship);
}
