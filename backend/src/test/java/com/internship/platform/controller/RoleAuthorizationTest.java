package com.internship.platform.controller;

import com.internship.platform.config.SecurityConfig;
import com.internship.platform.security.JwtAuthEntryPoint;
import com.internship.platform.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = StudentController.class)
@Import({SecurityConfig.class, JwtAuthEntryPoint.class})
class RoleAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    void studentEndpointRejectsAnonymous() throws Exception {
        mockMvc.perform(get("/api/student/me")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void studentEndpointAllowsStudent() throws Exception {
        mockMvc.perform(get("/api/student/me")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "COMPANY")
    void studentEndpointRejectsCompany() throws Exception {
        mockMvc.perform(get("/api/student/me")).andExpect(status().isForbidden());
    }
}
