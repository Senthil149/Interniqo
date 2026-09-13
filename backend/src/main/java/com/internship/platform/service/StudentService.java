package com.internship.platform.service;

import com.internship.platform.client.AiServiceClient;
import com.internship.platform.dto.ResumeExtractionResult;
import com.internship.platform.dto.ResumeUploadResponse;
import com.internship.platform.dto.StudentPreferenceRequest;
import com.internship.platform.dto.StudentPreferenceResponse;
import com.internship.platform.dto.StudentProfileResponse;
import com.internship.platform.entity.Student;
import com.internship.platform.entity.StudentPreference;
import com.internship.platform.entity.User;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.StudentPreferenceRepository;
import com.internship.platform.repository.StudentRepository;
import com.internship.platform.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

@Service
public class StudentService {

    private static final Logger log = LoggerFactory.getLogger(StudentService.class);

    /** Maximum accepted resume size. Enforced server-side in addition to the multipart limit. */
    private static final long MAX_RESUME_BYTES = 5L * 1024 * 1024; // 5 MB

    private static final String PDF_CONTENT_TYPE = "application/pdf";

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StudentPreferenceRepository studentPreferenceRepository;
    private final AiServiceClient aiServiceClient;
    private final String uploadDir;

    @org.springframework.beans.factory.annotation.Autowired
    public StudentService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            StudentPreferenceRepository studentPreferenceRepository,
            AiServiceClient aiServiceClient,
            @Value("${app.upload.dir}") String uploadDir) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.studentPreferenceRepository = studentPreferenceRepository;
        this.aiServiceClient = aiServiceClient;
        this.uploadDir = uploadDir;
    }

    public StudentService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            AiServiceClient aiServiceClient,
            String uploadDir) {
        this(userRepository, studentRepository, null, aiServiceClient, uploadDir);
    }

    // ── Resume upload ─────────────────────────────────────────────────────────

    /**
     * Validate and store the uploaded PDF, then call the AI service to extract
     * structured profile sections.
     *
     * Upload always succeeds if the file is valid — even when the AI service is
     * down.  In that case {@code aiExtractionSucceeded} is {@code false} and all
     * extracted fields are {@code null}. The student's {@code resumePath} is
     * updated regardless.
     *
     * Per design rule #5: the actual text extraction happens inside the Python AI
     * service over HTTP. This method never parses PDF bytes internally.
     */
    @Transactional
    public ResumeUploadResponse uploadResume(String email, MultipartFile file) {
        validateFile(file);
        Student student = resolveStudent(email);

        // 1. Persist file to local storage; update resumePath on entity
        String storedPath = storeFile(file, student.getId());
        student.setResumePath(storedPath);

        // 2. Call AI service — design rule #5: stays a separate HTTP service.
        //    AiServiceClient returns Optional.empty() on any failure.
        byte[] pdfBytes = readBytes(file);
        String originalFilename = file.getOriginalFilename() != null
                ? file.getOriginalFilename() : "resume.pdf";

        Optional<ResumeExtractionResult> extraction =
                aiServiceClient.extractResume(pdfBytes, originalFilename);

        // 3. Update extracted profile fields.
        //    All fields are overwritten with new extraction values (including null) so
        //    the stored profile always reflects the most recently uploaded resume.
        extraction.ifPresent(r -> {
            student.setSummary(r.getSummary());
            student.setSkills(r.getSkills());
            student.setEducation(r.getEducation());
            student.setExperience(r.getExperience());
            student.setProjects(r.getProjects());
            student.setCertifications(r.getCertifications());
            student.setInterests(r.getInterests());
        });

        studentRepository.save(student);

        return buildUploadResponse(student, extraction.isPresent(), extraction.orElse(null));
    }

    // ── Profile read ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StudentProfileResponse getProfile(String email) {
        return StudentProfileResponse.from(resolveStudent(email));
    }

    // ── Preferences Management ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StudentPreferenceResponse getPreferences(String email) {
        Student student = resolveStudent(email);
        StudentPreference pref = studentPreferenceRepository.findByStudent(student)
                .orElseGet(() -> {
                    StudentPreference def = new StudentPreference();
                    def.setStudent(student);
                    return def;
                });
        return StudentPreferenceResponse.from(pref);
    }

    @Transactional
    public StudentPreferenceResponse updatePreferences(String email, StudentPreferenceRequest request) {
        Student student = resolveStudent(email);
        StudentPreference pref = studentPreferenceRepository.findByStudent(student)
                .orElseGet(() -> {
                    StudentPreference p = new StudentPreference();
                    p.setStudent(student);
                    return p;
                });

        if (request.getCountry() != null) pref.setCountry(request.getCountry().trim());
        if (request.getPreferredCountries() != null) pref.setPreferredCountries(request.getPreferredCountries().trim());
        if (request.getLocation() != null) pref.setLocation(request.getLocation().trim());
        if (request.getWorkMode() != null) pref.setWorkMode(request.getWorkMode().trim());
        if (request.getDuration() != null) pref.setDuration(request.getDuration().trim());
        if (request.getMinimumStipend() != null) pref.setMinimumStipend(request.getMinimumStipend());
        if (request.getCurrency() != null) pref.setCurrency(request.getCurrency().trim());
        if (request.getVisaRequired() != null) pref.setVisaRequired(request.getVisaRequired());
        if (request.getRelocationPreference() != null) pref.setRelocationPreference(request.getRelocationPreference());

        StudentPreference saved = studentPreferenceRepository.save(pref);
        return StudentPreferenceResponse.from(saved);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Resume file is required");
        }
        String contentType = file.getContentType();
        String name = file.getOriginalFilename();
        if (!PDF_CONTENT_TYPE.equals(contentType)
                || name == null
                || !name.toLowerCase().endsWith(".pdf")) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Only PDF files are accepted (content-type: application/pdf, extension: .pdf)");
        }
        if (file.getSize() > MAX_RESUME_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Resume file must be 5 MB or smaller");
        }
    }

    private Student resolveStudent(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        return studentRepository.findByUser(user)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN,
                        "No student profile associated with this account"));
    }

    private String storeFile(MultipartFile file, Long studentId) {
        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            String filename = "student_" + studentId + "_" + System.currentTimeMillis() + ".pdf";
            Path dest = dir.resolve(filename);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored resume: {}", dest.toAbsolutePath());
            return dest.toAbsolutePath().toString();
        } catch (IOException ex) {
            log.error("Failed to store resume for student {}: {}", studentId, ex.getMessage());
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to store resume file — please try again");
        }
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to read uploaded file");
        }
    }

    private ResumeUploadResponse buildUploadResponse(Student student, boolean aiSucceeded,
            ResumeExtractionResult extraction) {
        ResumeUploadResponse response = new ResumeUploadResponse();
        response.setResumePath(student.getResumePath());
        response.setAiExtractionSucceeded(aiSucceeded);
        if (extraction != null) {
            response.setSummary(extraction.getSummary());
            response.setSkills(extraction.getSkills());
            response.setEducation(extraction.getEducation());
            response.setExperience(extraction.getExperience());
            response.setProjects(extraction.getProjects());
            response.setCertifications(extraction.getCertifications());
            response.setInterests(extraction.getInterests());
        }
        return response;
    }
}
