package com.internship.platform.controller;

import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    @GetMapping("/me")
    public Map<String, String> me(Authentication authentication) {
        return Map.of(
                "role", "STUDENT",
                "email", authentication.getName());
    }
}
