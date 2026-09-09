package com.internship.platform.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.internship.platform.entity.Company;
import com.internship.platform.entity.User;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findByUser(User user);

    Optional<Company> findByEmail(String email);

    List<Company> findAllByOrderByIdDesc();

    long countByEmailVerified(boolean emailVerified);
}
