package com.internship.platform.controller;

import com.internship.platform.service.StudentService;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/photos")
public class PublicPhotoController {

    private final StudentService studentService;

    public PublicPhotoController(StudentService studentService) {
        this.studentService = studentService;
    }

    /**
     * Public endpoint to render student profile photos in <img> tags.
     */
    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getPhoto(@PathVariable String filename) {
        return studentService.getPublicPhotoResource(filename);
    }
}
