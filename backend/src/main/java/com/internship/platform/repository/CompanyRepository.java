package com.internship.platform.repository;

import com.internship.platform.entity.Company;
import com.internship.platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findByUser(User user);
}
