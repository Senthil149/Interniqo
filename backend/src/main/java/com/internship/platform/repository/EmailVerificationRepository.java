package com.internship.platform.repository;

import com.internship.platform.entity.Company;
import com.internship.platform.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {

    Optional<EmailVerification> findByToken(String token);

    List<EmailVerification> findByCompanyOrderByExpiryDesc(Company company);

    Optional<EmailVerification> findTopByCompanyAndVerifiedAtIsNullOrderByExpiryDesc(Company company);
}
