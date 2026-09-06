package com.internship.platform.repository;

import com.internship.platform.entity.Company;
import com.internship.platform.entity.Internship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface InternshipRepository extends JpaRepository<Internship, Long>,
        JpaSpecificationExecutor<Internship> {

    List<Internship> findByCompanyOrderByIdDesc(Company company);
}
