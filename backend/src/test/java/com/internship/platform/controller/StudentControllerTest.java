package com.internship.platform.controller;

import com.internship.platform.dto.InternshipResponse;
import com.internship.platform.dto.InternshipSearchParams;
import com.internship.platform.dto.ResumeUploadResponse;
import com.internship.platform.dto.StudentProfileResponse;
import com.internship.platform.service.InternshipService;
import com.internship.platform.service.StudentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = StudentController.class)
@AutoConfigureMockMvc(addFilters = false)
class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private InternshipService internshipService;

    @MockBean
    private StudentService studentService;

    private UsernamePasswordAuthenticationToken auth(String email, String role) {
        return new UsernamePasswordAuthenticationToken(
                email,
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }

    @Test
    @DisplayName("GET /api/student/me returns student identity")
    void meReturnsStudentIdentity() throws Exception {
        mockMvc.perform(get("/api/student/me").principal(auth("student@test.edu", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.email").value("student@test.edu"));
    }

    @Test
    @DisplayName("POST /api/student/resume accepts multipart file and returns parsed profile")
    void uploadResumeReturnsExtraction() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "resume.pdf",
                "application/pdf",
                "%PDF-1.4 Mock".getBytes()
        );

        ResumeUploadResponse response = new ResumeUploadResponse();
        response.setResumePath("/uploads/resumes/resume.pdf");
        response.setAiExtractionSucceeded(true);
        response.setSkills("Java, Python");
        response.setEducation("B.S. CS");

        when(studentService.uploadResume(eq("student@test.edu"), any())).thenReturn(response);

        mockMvc.perform(multipart("/api/student/resume").file(file).principal(auth("student@test.edu", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aiExtractionSucceeded").value(true))
                .andExpect(jsonPath("$.skills").value("Java, Python"))
                .andExpect(jsonPath("$.education").value("B.S. CS"));
    }

    @Test
    @DisplayName("GET /api/student/profile returns existing profile")
    void getProfileReturnsData() throws Exception {
        StudentProfileResponse profile = new StudentProfileResponse();
        profile.setSkills("React, Node.js");
        profile.setEducation("B.Tech");

        when(studentService.getProfile("student@test.edu")).thenReturn(profile);

        mockMvc.perform(get("/api/student/profile").principal(auth("student@test.edu", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skills").value("React, Node.js"))
                .andExpect(jsonPath("$.education").value("B.Tech"));
    }

    @Test
    @DisplayName("GET /api/student/internships performs structured search")
    void searchInternshipsReturnsPage() throws Exception {
        InternshipResponse item = new InternshipResponse();
        item.setId(10L);
        item.setTitle("Backend Engineer Intern");

        when(internshipService.search(any(InternshipSearchParams.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(item)));

        mockMvc.perform(get("/api/student/internships").param("workMode", "REMOTE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(10))
                .andExpect(jsonPath("$.content[0].title").value("Backend Engineer Intern"));
    }

    @Test
    @DisplayName("GET /api/student/internships/{id} returns single internship detail")
    void getInternshipReturnsItem() throws Exception {
        InternshipResponse item = new InternshipResponse();
        item.setId(20L);
        item.setTitle("Data Science Intern");

        when(internshipService.getById(20L)).thenReturn(item);

        mockMvc.perform(get("/api/student/internships/20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(20))
                .andExpect(jsonPath("$.title").value("Data Science Intern"));
    }
}
