package com.internship.platform.repository;

import com.internship.platform.entity.Student;
import com.internship.platform.entity.StudentPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentPreferenceRepository extends JpaRepository<StudentPreference, Long> {

    Optional<StudentPreference> findByStudent(Student student);
}
