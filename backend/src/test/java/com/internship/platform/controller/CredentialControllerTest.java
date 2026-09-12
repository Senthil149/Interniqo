package com.internship.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internship.platform.dto.CredentialResponse;
import com.internship.platform.dto.IssueCredentialRequest;
import com.internship.platform.dto.PublicVerifyResponse;
import com.internship.platform.dto.PublicVerifyResponse.VerificationStatus;
import com.internship.platform.service.CredentialService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = CredentialController.class)
@AutoConfigureMockMvc(addFilters = false)
class CredentialControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CredentialService credentialService;

    private UsernamePasswordAuthenticationToken auth(String email, String role) {
        return new UsernamePasswordAuthenticationToken(
                email,
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }

    @Test
    @DisplayName("POST /api/credentials/issue issues blockchain credential for completed internship")
    void issueCredentialReturnsCreated() throws Exception {
        IssueCredentialRequest request = new IssueCredentialRequest();
        request.setApplicationId(101L);

        CredentialResponse response = new CredentialResponse();
        response.setCredentialId("CRED-ABC123456789");
        response.setHash("sha256_mock_hash");
        response.setBlockchainTx("0xdeadbeef123");
        response.setCompletionDate(LocalDate.now());

        when(credentialService.issueCredential(any(IssueCredentialRequest.class), eq("careers@acme.com")))
                .thenReturn(response);

        mockMvc.perform(post("/api/credentials/issue")
                        .principal(auth("careers@acme.com", "COMPANY"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.credentialId").value("CRED-ABC123456789"))
                .andExpect(jsonPath("$.blockchainTx").value("0xdeadbeef123"));
    }

    @Test
    @DisplayName("GET /api/credentials/verify/{credentialId} publicly verifies credential")
    void verifyCredentialPublicAccess() throws Exception {
        PublicVerifyResponse response = new PublicVerifyResponse();
        response.setStatus(VerificationStatus.VERIFIED);
        response.setHashMatch(true);
        response.setMessage("Credential successfully verified against the blockchain registry.");

        when(credentialService.verifyCredential("CRED-ABC123456789")).thenReturn(response);

        mockMvc.perform(get("/api/credentials/verify/CRED-ABC123456789"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VERIFIED"))
                .andExpect(jsonPath("$.hashMatch").value(true));
    }

    @Test
    @DisplayName("GET /api/credentials/my returns user credentials")
    void getMyCredentialsStudent() throws Exception {
        CredentialResponse response = new CredentialResponse();
        response.setCredentialId("CRED-STUDENT-01");

        when(credentialService.getStudentCredentials("student@test.edu")).thenReturn(List.of(response));

        mockMvc.perform(get("/api/credentials/my").principal(auth("student@test.edu", "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].credentialId").value("CRED-STUDENT-01"));
    }

    @Test
    @DisplayName("GET /api/credentials/{credentialId} returns credential detail")
    void getCredentialById() throws Exception {
        CredentialResponse response = new CredentialResponse();
        response.setCredentialId("CRED-ABC123456789");

        when(credentialService.getCredentialById("CRED-ABC123456789")).thenReturn(response);

        mockMvc.perform(get("/api/credentials/CRED-ABC123456789"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.credentialId").value("CRED-ABC123456789"));
    }
}
