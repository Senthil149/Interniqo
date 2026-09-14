package com.internship.platform.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.internship.platform.entity.Company;
import com.internship.platform.entity.Credential;
import com.internship.platform.entity.Internship;
import com.internship.platform.entity.Student;

@Repository
public interface CredentialRepository extends JpaRepository<Credential, Long> {

    Optional<Credential> findByCredentialId(String credentialId);

    Optional<Credential> findByInternshipAndStudent(Internship internship, Student student);

    boolean existsByInternshipAndStudent(Internship internship, Student student);

    List<Credential> findByStudentOrderByCompletionDateDesc(Student student);

    long countByStudent(Student student);

    List<Credential> findByCompanyOrderByCompletionDateDesc(Company company);

    List<Credential> findByInternshipOrderByCompletionDateDesc(Internship internship);
}
