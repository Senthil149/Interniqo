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
}
