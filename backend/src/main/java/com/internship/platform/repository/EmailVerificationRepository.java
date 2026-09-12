package com.internship.platform.repository;

import com.internship.platform.entity.Company;
import com.internship.platform.entity.EmailVerification;
import com.internship.platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {

    Optional<EmailVerification> findByToken(String token);

    List<EmailVerification> findByCompanyOrderByExpiryDesc(Company company);

    Optional<EmailVerification> findTopByCompanyAndVerifiedAtIsNullOrderByExpiryDesc(Company company);

    List<EmailVerification> findByUserOrderByExpiryDesc(User user);

    Optional<EmailVerification> findTopByUserAndVerifiedAtIsNullOrderByExpiryDesc(User user);

    @Query("SELECT COUNT(e) > 0 FROM EmailVerification e WHERE e.user = :user AND e.verifiedAt IS NOT NULL AND e.token NOT LIKE 'reset_%'")
    boolean isUserEmailVerified(@Param("user") User user);

    Optional<EmailVerification> findTopByUserAndTokenAndVerifiedAtIsNull(User user, String token);

    Optional<EmailVerification> findTopByCompanyAndTokenAndVerifiedAtIsNull(Company company, String token);

    List<EmailVerification> findAllByOrderByIdDesc();

    long countByVerifiedAtIsNotNull();

    void deleteByExpiryBefore(java.time.Instant time);
}
