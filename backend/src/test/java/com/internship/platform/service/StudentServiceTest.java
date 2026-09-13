package com.internship.platform.service;

import com.internship.platform.client.AiServiceClient;
import com.internship.platform.dto.ResumeExtractionResult;
import com.internship.platform.dto.ResumeUploadResponse;
import com.internship.platform.dto.StudentProfileResponse;
import com.internship.platform.entity.Student;
import com.internship.platform.entity.User;
import com.internship.platform.entity.UserRole;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.StudentRepository;
import com.internship.platform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private AiServiceClient aiServiceClient;

    @TempDir
    Path tempUploadDir;

    private StudentService studentService;
    private User user;
    private Student student;

    @BeforeEach
    void setUp() {
        studentService = new StudentService(
                userRepository,
                studentRepository,
                aiServiceClient,
                tempUploadDir.toString()
        );

        user = new User();
        user.setId(1L);
        user.setEmail("student@university.edu");
        user.setName("Charlie Student");
        user.setRole(UserRole.STUDENT);

        student = new Student();
        student.setId(10L);
        student.setUser(user);
    }

    @Test
    @DisplayName("uploadResume: Valid PDF calls AI service, stores file, updates extracted profile fields")
    void uploadResume_validPdf_successWithAiExtraction() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "charles_resume.pdf",
                "application/pdf",
                "%PDF-1.4 Mock PDF Content with Skills and Experience".getBytes()
        );

        when(userRepository.findByEmail("student@university.edu")).thenReturn(Optional.of(user));
        when(studentRepository.findByUser(user)).thenReturn(Optional.of(student));

        ResumeExtractionResult extraction = new ResumeExtractionResult();
        extraction.setSkills("Java, Spring Boot, React, Python");
        extraction.setEducation("B.S. in Computer Science, 2026");
        extraction.setExperience("Software Engineering Intern at Startup");
        extraction.setProjects("Interniqo Platform, Distributed Cache");
        extraction.setCertifications("AWS Certified Developer");
        extraction.setInterests("Distributed Systems, Machine Learning");

        when(aiServiceClient.extractResume(any(byte[].class), eq("charles_resume.pdf")))
                .thenReturn(Optional.of(extraction));

        ResumeUploadResponse response = studentService.uploadResume("student@university.edu", file);

        assertNotNull(response);
        assertTrue(response.isAiExtractionSucceeded());
        assertEquals("Java, Spring Boot, React, Python", response.getSkills());
        assertEquals("B.S. in Computer Science, 2026", response.getEducation());
        assertNotNull(response.getResumePath());
        assertTrue(response.getResumePath().endsWith(".pdf"));

        assertEquals("Java, Spring Boot, React, Python", student.getSkills());
        assertEquals("B.S. in Computer Science, 2026", student.getEducation());
        verify(studentRepository, times(1)).save(student);
    }

    @Test
    @DisplayName("uploadResume: If AI microservice is unreachable, upload still succeeds and sets aiExtractionSucceeded=false")
    void uploadResume_aiServiceDown_succeedsWithFallback() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "resume.pdf",
                "application/pdf",
                "%PDF-1.4 Content".getBytes()
        );

        when(userRepository.findByEmail("student@university.edu")).thenReturn(Optional.of(user));
        when(studentRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(aiServiceClient.extractResume(any(byte[].class), eq("resume.pdf")))
                .thenReturn(Optional.empty());

        ResumeUploadResponse response = studentService.uploadResume("student@university.edu", file);

        assertNotNull(response);
        assertFalse(response.isAiExtractionSucceeded());
        assertNull(response.getSkills());
        assertNotNull(student.getResumePath());
        verify(studentRepository, times(1)).save(student);
    }

    @Test
    @DisplayName("uploadResume: Non-PDF files are rejected with BAD_REQUEST")
    void uploadResume_nonPdf_throwsBadRequest() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "resume.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Word content".getBytes()
        );

        ApiException ex = assertThrows(ApiException.class,
                () -> studentService.uploadResume("student@university.edu", file));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Only PDF files are accepted"));
        verifyNoInteractions(studentRepository, aiServiceClient);
    }

    @Test
    @DisplayName("uploadResume: Empty file is rejected with BAD_REQUEST")
    void uploadResume_emptyFile_throwsBadRequest() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.pdf",
                "application/pdf",
                new byte[0]
        );

        ApiException ex = assertThrows(ApiException.class,
                () -> studentService.uploadResume("student@university.edu", emptyFile));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Resume file is required"));
    }

    @Test
    @DisplayName("getProfile: Returns existing student profile fields correctly")
    void getProfile_returnsStudentProfile() {
        student.setSkills("Java, Python");
        student.setEducation("CS Degree");
        student.setExperience("1 year intern");
        student.setResumePath("/path/to/resume.pdf");

        when(userRepository.findByEmail("student@university.edu")).thenReturn(Optional.of(user));
        when(studentRepository.findByUser(user)).thenReturn(Optional.of(student));

        StudentProfileResponse profile = studentService.getProfile("student@university.edu");

        assertNotNull(profile);
        assertEquals("Java, Python", profile.getSkills());
        assertEquals("CS Degree", profile.getEducation());
        assertEquals("resume.pdf", profile.getResumeFileName());
    }

    @Test
    @DisplayName("updateProfile: Updates User name and Student profile fields")
    void updateProfile_validRequest_success() {
        when(userRepository.findByEmail("student@university.edu")).thenReturn(Optional.of(user));
        when(studentRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));

        com.internship.platform.dto.StudentProfileUpdateRequest req = new com.internship.platform.dto.StudentProfileUpdateRequest();
        req.setName("Charles Student Updated");
        req.setProfessionalHeadline("Full Stack Java & React Engineer");
        req.setLocation("Berlin, Germany");
        req.setCollege("Technical University of Munich");
        req.setBio("Passionate developer focusing on distributed cloud systems.");
        req.setGithubUrl("github.com/charles-dev");
        req.setLinkedinUrl("linkedin.com/in/charles-dev");
        req.setPortfolioUrl("https://charles.dev");
        req.setSkills(java.util.List.of("Java", "Spring Boot", "React"));

        StudentProfileResponse resp = studentService.updateProfile("student@university.edu", req);

        assertNotNull(resp);
        assertEquals("Charles Student Updated", resp.getName());
        assertEquals("Full Stack Java & React Engineer", resp.getProfessionalHeadline());
        assertEquals("Berlin, Germany", resp.getLocation());
        assertEquals("Technical University of Munich", resp.getCollege());
        assertEquals("Passionate developer focusing on distributed cloud systems.", resp.getBio());
        assertEquals("https://github.com/charles-dev", resp.getGithubUrl());
        assertEquals("https://linkedin.com/in/charles-dev", resp.getLinkedinUrl());
        assertEquals("https://charles.dev", resp.getPortfolioUrl());
        assertTrue(resp.getSkillList().contains("Java"));
        assertTrue(resp.getSkillList().contains("Spring Boot"));
        assertTrue(resp.getSkillList().contains("React"));
    }

    @Test
    @DisplayName("updateProfile: Skills are normalized and deduplicated")
    void updateProfile_skillsDeduplication() {
        when(userRepository.findByEmail("student@university.edu")).thenReturn(Optional.of(user));
        when(studentRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));

        com.internship.platform.dto.StudentProfileUpdateRequest req = new com.internship.platform.dto.StudentProfileUpdateRequest();
        req.setSkills(java.util.List.of("java", "Java", "react", "React", "Spring Boot"));

        StudentProfileResponse resp = studentService.updateProfile("student@university.edu", req);

        assertNotNull(resp);
        assertEquals(3, resp.getSkillList().size());
        assertTrue(resp.getSkillList().contains("Java"));
        assertTrue(resp.getSkillList().contains("React"));
        assertTrue(resp.getSkillList().contains("Spring Boot"));
    }

    @Test
    @DisplayName("uploadProfilePhoto: Valid image is saved to disk and updates photo URL")
    void uploadProfilePhoto_validImage_success() {
        MockMultipartFile photo = new MockMultipartFile(
                "file",
                "avatar.png",
                "image/png",
                new byte[]{ (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A }
        );

        when(userRepository.findByEmail("student@university.edu")).thenReturn(Optional.of(user));
        when(studentRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));

        StudentProfileResponse resp = studentService.uploadProfilePhoto("student@university.edu", photo);

        assertNotNull(resp);
        assertNotNull(resp.getProfilePhotoUrl());
        assertTrue(resp.getProfilePhotoUrl().startsWith("/api/photos/photo_student_10_"));
        assertTrue(resp.getProfilePhotoUrl().endsWith(".png"));
    }

    @Test
    @DisplayName("uploadProfilePhoto: Invalid file type is rejected with BAD_REQUEST")
    void uploadProfilePhoto_invalidType_throwsBadRequest() {
        MockMultipartFile badFile = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/octet-stream",
                "not an image".getBytes()
        );

        ApiException ex = assertThrows(ApiException.class,
                () -> studentService.uploadProfilePhoto("student@university.edu", badFile));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    @DisplayName("removeProfilePhoto: Clears photo path and URL")
    void removeProfilePhoto_success() {
        student.setProfilePhotoUrl("/api/photos/photo_student_10_123.png");
        student.setProfilePhotoPath(tempUploadDir.resolve("photo_student_10_123.png").toString());

        when(userRepository.findByEmail("student@university.edu")).thenReturn(Optional.of(user));
        when(studentRepository.findByUser(user)).thenReturn(Optional.of(student));
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));

        StudentProfileResponse resp = studentService.removeProfilePhoto("student@university.edu");

        assertNotNull(resp);
        assertNull(resp.getProfilePhotoUrl());
    }

    @Test
    @DisplayName("getResumeResource: Throws NOT_FOUND when no resume exists")
    void getResumeResource_noResume_throwsNotFound() {
        student.setResumePath(null);
        when(userRepository.findByEmail("student@university.edu")).thenReturn(Optional.of(user));
        when(studentRepository.findByUser(user)).thenReturn(Optional.of(student));

        ApiException ex = assertThrows(ApiException.class,
                () -> studentService.getResumeResource("student@university.edu"));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }
}
