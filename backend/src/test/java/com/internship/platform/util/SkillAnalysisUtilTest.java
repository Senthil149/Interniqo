package com.internship.platform.util;

import com.internship.platform.entity.Internship;
import com.internship.platform.entity.Student;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class SkillAnalysisUtilTest {

    @Test
    @DisplayName("normalizeSkill resolves common aliases and variations correctly")
    void testNormalizeSkillAliases() {
        assertEquals("JavaScript", SkillAnalysisUtil.normalizeSkill("js"));
        assertEquals("JavaScript", SkillAnalysisUtil.normalizeSkill("javascript"));
        assertEquals("JavaScript", SkillAnalysisUtil.normalizeSkill("Java Script"));

        assertEquals("TypeScript", SkillAnalysisUtil.normalizeSkill("ts"));
        assertEquals("TypeScript", SkillAnalysisUtil.normalizeSkill("typescript"));

        assertEquals("React", SkillAnalysisUtil.normalizeSkill("react.js"));
        assertEquals("React", SkillAnalysisUtil.normalizeSkill("reactjs"));
        assertEquals("React", SkillAnalysisUtil.normalizeSkill("React"));

        assertEquals("Spring Boot", SkillAnalysisUtil.normalizeSkill("spring"));
        assertEquals("Spring Boot", SkillAnalysisUtil.normalizeSkill("springboot"));
        assertEquals("Spring Boot", SkillAnalysisUtil.normalizeSkill("spring-boot"));

        assertEquals("Docker", SkillAnalysisUtil.normalizeSkill("docker"));
        assertEquals("Docker", SkillAnalysisUtil.normalizeSkill("containers"));

        assertEquals("PostgreSQL", SkillAnalysisUtil.normalizeSkill("postgres"));
        assertEquals("PostgreSQL", SkillAnalysisUtil.normalizeSkill("psql"));

        assertEquals("REST API", SkillAnalysisUtil.normalizeSkill("restful api"));
        assertEquals("REST API", SkillAnalysisUtil.normalizeSkill("rest"));
    }

    @Test
    @DisplayName("extractSkills extracts distinct normalized skills from free-form lists")
    void testExtractSkills() {
        String skillsString = "Java, Spring Boot; JS, Docker, AWS, ReactJS • Python";
        Set<String> extracted = SkillAnalysisUtil.extractSkills(skillsString);

        assertTrue(extracted.contains("Java"));
        assertTrue(extracted.contains("Spring Boot"));
        assertTrue(extracted.contains("JavaScript"));
        assertTrue(extracted.contains("Docker"));
        assertTrue(extracted.contains("AWS"));
        assertTrue(extracted.contains("React"));
        assertTrue(extracted.contains("Python"));
    }

    @Test
    @DisplayName("analyze produces matched skills, missing skills, matching strengths, and advice")
    void testAnalyzeSkillGapAndExplainability() {
        Student student = new Student();
        student.setSkills("Java, Spring Boot, React, MySQL");
        student.setProjects("Built a microservice banking app using Spring Boot and MySQL");
        student.setEducation("B.Tech in Computer Science and Engineering");
        student.setExperience("Intern at Tech Corp developing REST APIs");

        Internship internship = new Internship();
        internship.setTitle("Java Backend Developer");
        internship.setRequiredSkills("Java, Spring Boot, Docker, AWS");
        internship.setWorkMode("REMOTE");
        internship.setCountry("Germany");
        internship.setCity("Berlin");
        internship.setDuration("6 months");
        internship.setStipend(new BigDecimal("2000"));
        internship.setCurrency("EUR");

        SkillAnalysisUtil.AnalysisResult result = SkillAnalysisUtil.analyze(student, internship, 0.82);

        assertNotNull(result);
        assertEquals("Best Match", result.getFitLevel());

        // Check matched skills
        assertTrue(result.getMatchedSkills().contains("Java"));
        assertTrue(result.getMatchedSkills().contains("Spring Boot"));

        // Check missing skills (skill-gap)
        assertTrue(result.getMissingSkills().contains("Docker"));
        assertTrue(result.getMissingSkills().contains("AWS"));

        // Check matching strengths
        assertTrue(result.getMatchingStrengths().stream().anyMatch(s -> s.contains("Java matches")));
        assertTrue(result.getMatchingStrengths().stream().anyMatch(s -> s.contains("Spring Boot matches")));
        assertTrue(result.getMatchingStrengths().stream().anyMatch(s -> s.contains("project experience")));
        assertTrue(result.getMatchingStrengths().stream().anyMatch(s -> s.contains("academic")));

        // Check preference matches
        assertTrue(result.getPreferenceMatches().stream().anyMatch(s -> s.contains("Remote work mode")));
        assertTrue(result.getPreferenceMatches().stream().anyMatch(s -> s.contains("Germany")));
        assertTrue(result.getPreferenceMatches().stream().anyMatch(s -> s.contains("2000")));

        // Check skill gap message
        assertTrue(result.getSkillGapMessage().contains("Docker and AWS"));
    }

    @Test
    @DisplayName("analyze handles zero missing skills gracefully")
    void testAnalyzeZeroMissingSkills() {
        Student student = new Student();
        student.setSkills("Java, Spring Boot, Docker, AWS");

        Internship internship = new Internship();
        internship.setRequiredSkills("Java, Docker");

        SkillAnalysisUtil.AnalysisResult result = SkillAnalysisUtil.analyze(student, internship, 0.90);

        assertTrue(result.getMissingSkills().isEmpty());
        assertTrue(result.getSkillGapMessage().contains("covers the key required skills") || result.getSkillGapMessage().contains("covers"));
    }
}
