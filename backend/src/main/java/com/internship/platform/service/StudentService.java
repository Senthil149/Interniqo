package com.internship.platform.service;

import com.internship.platform.client.AiServiceClient;
import com.internship.platform.dto.ResumeExtractionResult;
import com.internship.platform.dto.ResumeUploadResponse;
import com.internship.platform.dto.StudentPreferenceRequest;
import com.internship.platform.dto.StudentPreferenceResponse;
import com.internship.platform.dto.StudentProfileResponse;
import com.internship.platform.dto.StudentProfileUpdateRequest;
import com.internship.platform.entity.Student;
import com.internship.platform.entity.StudentPreference;
import com.internship.platform.entity.User;
import com.internship.platform.exception.ApiException;
import com.internship.platform.repository.StudentPreferenceRepository;
import com.internship.platform.repository.StudentRepository;
import com.internship.platform.repository.UserRepository;
import com.internship.platform.util.SkillAnalysisUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

@Service
public class StudentService {

    private static final Logger log = LoggerFactory.getLogger(StudentService.class);

    /** Maximum accepted resume size. Enforced server-side in addition to the multipart limit. */
    private static final long MAX_RESUME_BYTES = 5L * 1024 * 1024; // 5 MB

    /** Maximum accepted profile photo size: 2 MB */
    private static final long MAX_PHOTO_BYTES = 2L * 1024 * 1024; // 2 MB

    private static final String PDF_CONTENT_TYPE = "application/pdf";

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
    );

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StudentPreferenceRepository studentPreferenceRepository;
    private final AiServiceClient aiServiceClient;
    private final String uploadDir;
    private final String photoUploadDir;

    @org.springframework.beans.factory.annotation.Autowired
    public StudentService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            StudentPreferenceRepository studentPreferenceRepository,
            AiServiceClient aiServiceClient,
            @Value("${app.upload.dir}") String uploadDir,
            @Value("${app.upload.photo-dir:uploads/photos}") String photoUploadDir) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.studentPreferenceRepository = studentPreferenceRepository;
        this.aiServiceClient = aiServiceClient;
        this.uploadDir = uploadDir;
        this.photoUploadDir = photoUploadDir;
    }

    public StudentService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            StudentPreferenceRepository studentPreferenceRepository,
            AiServiceClient aiServiceClient,
            String uploadDir) {
        this(userRepository, studentRepository, studentPreferenceRepository, aiServiceClient, uploadDir, "uploads/photos");
    }

    public StudentService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            AiServiceClient aiServiceClient,
            String uploadDir) {
        this(userRepository, studentRepository, null, aiServiceClient, uploadDir, "uploads/photos");
    }

    // ── Resume upload ─────────────────────────────────────────────────────────

    @Transactional
    public ResumeUploadResponse uploadResume(String email, MultipartFile file) {
        validateResumeFile(file);
        Student student = resolveStudent(email);

        String storedPath = storeResumeFile(file, student.getId());
        student.setResumePath(storedPath);

        byte[] pdfBytes = readBytes(file);
        String originalFilename = file.getOriginalFilename() != null
                ? file.getOriginalFilename() : "resume.pdf";

        Optional<ResumeExtractionResult> extraction =
                aiServiceClient.extractResume(pdfBytes, originalFilename);

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

    // ── Profile read & update ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StudentProfileResponse getProfile(String email) {
        return StudentProfileResponse.from(resolveStudent(email));
    }

    @Transactional
    public StudentProfileResponse updateProfile(String email, StudentProfileUpdateRequest request) {
        Student student = resolveStudent(email);

        if (request.getName() != null && !request.getName().isBlank()) {
            student.getUser().setName(request.getName().trim());
            userRepository.save(student.getUser());
        }

        if (request.getProfessionalHeadline() != null) {
            student.setProfessionalHeadline(request.getProfessionalHeadline().trim());
        }
        if (request.getLocation() != null) {
            student.setLocation(request.getLocation().trim());
        }
        if (request.getCollege() != null) {
            student.setCollege(request.getCollege().trim());
        }
        if (request.getBio() != null) {
            student.setBio(request.getBio().trim());
        }

        if (request.getSkills() != null) {
            Set<String> cleanSkills = new LinkedHashSet<>();
            for (String s : request.getSkills()) {
                if (s != null && !s.isBlank()) {
                    String norm = SkillAnalysisUtil.normalizeSkill(s.trim());
                    if (!norm.isEmpty()) {
                        cleanSkills.add(norm);
                    }
                }
            }
            student.setSkills(String.join(", ", cleanSkills));
        }

        if (request.getGithubUrl() != null) {
            student.setGithubUrl(normalizeUrl(request.getGithubUrl()));
        }
        if (request.getLinkedinUrl() != null) {
            student.setLinkedinUrl(normalizeUrl(request.getLinkedinUrl()));
        }
        if (request.getPortfolioUrl() != null) {
            student.setPortfolioUrl(normalizeUrl(request.getPortfolioUrl()));
        }

        Student saved = studentRepository.save(student);
        return StudentProfileResponse.from(saved);
    }

    // ── Profile photo management ──────────────────────────────────────────────

    @Transactional
    public StudentProfileResponse uploadProfilePhoto(String email, MultipartFile file) {
        validatePhotoFile(file);
        Student student = resolveStudent(email);

        // Delete old photo file if present
        deletePhotoFileQuietly(student.getProfilePhotoPath());

        // Store new photo file
        String ext = getFileExtension(file.getOriginalFilename());
        if (ext.isEmpty()) ext = ".jpg";
        String filename = "photo_student_" + student.getId() + "_" + System.currentTimeMillis() + ext;

        try {
            Path dir = Paths.get(photoUploadDir);
            Files.createDirectories(dir);
            Path dest = dir.resolve(filename);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            student.setProfilePhotoPath(dest.toAbsolutePath().toString());
            student.setProfilePhotoUrl("/api/photos/" + filename);
            Student saved = studentRepository.save(student);

            log.info("Uploaded profile photo for student {}: {}", student.getId(), dest.toAbsolutePath());
            return StudentProfileResponse.from(saved);
        } catch (IOException ex) {
            log.error("Failed to store profile photo for student {}: {}", student.getId(), ex.getMessage());
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store profile photo — please try again");
        }
    }

    @Transactional
    public StudentProfileResponse removeProfilePhoto(String email) {
        Student student = resolveStudent(email);
        deletePhotoFileQuietly(student.getProfilePhotoPath());
        student.setProfilePhotoPath(null);
        student.setProfilePhotoUrl(null);
        Student saved = studentRepository.save(student);
        return StudentProfileResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> getProfilePhotoResource(String email) {
        Student student = resolveStudent(email);
        if (student.getProfilePhotoPath() == null || student.getProfilePhotoPath().isBlank()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "No profile photo uploaded");
        }
        Path path = Paths.get(student.getProfilePhotoPath());
        if (!Files.exists(path)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Profile photo file not found on disk");
        }
        return ResponseEntity.ok()
                .contentType(detectMediaType(path))
                .body(new FileSystemResource(path));
    }

    public ResponseEntity<Resource> getPublicPhotoResource(String filename) {
        if (filename == null || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid photo filename");
        }
        Path photoDir = Paths.get(photoUploadDir).toAbsolutePath().normalize();
        Path file = photoDir.resolve(filename).normalize();
        if (!file.startsWith(photoDir) || !Files.exists(file)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Photo not found");
        }
        return ResponseEntity.ok()
                .contentType(detectMediaType(file))
                .body(new FileSystemResource(file));
    }

    // ── Resume download & view ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> getResumeResource(String email) {
        Student student = resolveStudent(email);
        if (student.getResumePath() == null || student.getResumePath().isBlank()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "No resume uploaded yet");
        }
        Path path = Paths.get(student.getResumePath());
        if (!Files.exists(path)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Resume file not found on disk");
        }
        String filename = path.getFileName().toString();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(new FileSystemResource(path));
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

    private void validateResumeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Resume file is required");
        }
        String contentType = file.getContentType();
        String name = file.getOriginalFilename();
        if (!PDF_CONTENT_TYPE.equals(contentType)
                || name == null
                || !name.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Only PDF files are accepted (content-type: application/pdf, extension: .pdf)");
        }
        if (file.getSize() > MAX_RESUME_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Resume file must be 5 MB or smaller");
        }
    }

    private void validatePhotoFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Photo file is required");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Only common image files are accepted (JPEG, PNG, WEBP, GIF)");
        }
        String name = file.getOriginalFilename();
        String ext = getFileExtension(name).toLowerCase(Locale.ROOT);
        if (!ext.equals(".jpg") && !ext.equals(".jpeg") && !ext.equals(".png")
                && !ext.equals(".webp") && !ext.equals(".gif")) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Only image extensions are supported (.jpg, .jpeg, .png, .webp, .gif)");
        }
        if (file.getSize() > MAX_PHOTO_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Profile photo must be 2 MB or smaller");
        }
    }

    private String getFileExtension(String name) {
        if (name == null || !name.contains(".")) return "";
        return name.substring(name.lastIndexOf('.'));
    }

    private void deletePhotoFileQuietly(String pathStr) {
        if (pathStr != null && !pathStr.isBlank()) {
            try {
                Path path = Paths.get(pathStr);
                Files.deleteIfExists(path);
            } catch (Exception e) {
                log.warn("Could not delete photo file {}: {}", pathStr, e.getMessage());
            }
        }
    }

    private MediaType detectMediaType(Path path) {
        String filename = path.getFileName().toString().toLowerCase(Locale.ROOT);
        if (filename.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (filename.endsWith(".gif")) return MediaType.IMAGE_GIF;
        if (filename.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        return MediaType.IMAGE_JPEG;
    }

    private String normalizeUrl(String url) {
        if (url == null || url.isBlank()) return null;
        String trimmed = url.trim();
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            return "https://" + trimmed;
        }
        return trimmed;
    }

    private Student resolveStudent(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        return studentRepository.findByUser(user)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN,
                        "No student profile associated with this account"));
    }

    private String storeResumeFile(MultipartFile file, Long studentId) {
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
