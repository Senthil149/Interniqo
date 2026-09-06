package com.internship.platform.security;

import com.internship.platform.entity.User;
import com.internship.platform.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private User user;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService("test-only-jwt-secret-key-must-be-32b", 60_000, 120_000);
        user = new User();
        user.setId(1L);
        user.setEmail("student@example.com");
        user.setName("Ada");
        user.setRole(UserRole.STUDENT);
        user.setPasswordHash("unused");
    }

    @Test
    void accessTokenCarriesEmailAndRole() {
        String token = jwtService.createAccessToken(user);

        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.isAccessToken(token)).isTrue();
        assertThat(jwtService.isRefreshToken(token)).isFalse();
        assertThat(jwtService.extractEmail(token)).isEqualTo("student@example.com");
        assertThat(jwtService.extractRole(token)).isEqualTo(UserRole.STUDENT);
    }

    @Test
    void refreshTokenIsDistinctFromAccessToken() {
        String refresh = jwtService.createRefreshToken(user);

        assertThat(jwtService.isRefreshToken(refresh)).isTrue();
        assertThat(jwtService.isAccessToken(refresh)).isFalse();
    }
}
