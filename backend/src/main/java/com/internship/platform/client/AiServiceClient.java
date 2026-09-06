package com.internship.platform.client;

import com.internship.platform.dto.ResumeExtractionResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.boot.web.client.ClientHttpRequestFactories;
import org.springframework.boot.web.client.ClientHttpRequestFactorySettings;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Optional;

/**
 * HTTP client for the Python AI microservice.
 *
 * Design rule #5 compliance: all PDF text extraction and NLP processing happen
 * inside the Python service. This client only sends the file over HTTP and
 * deserialises the JSON response — it never processes PDF bytes internally.
 *
 * Failure contract: if the AI service is unreachable, returns an unexpected
 * HTTP status, or times out, the method returns {@link Optional#empty()} and
 * logs a warning.  Callers MUST NOT fail the user-facing request solely
 * because the AI service is temporarily unavailable — the resume upload should
 * still succeed and the student can re-trigger extraction later.
 */
@Component
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);

    /** Connection timeout — AI service should be on localhost/LAN, 5 s is generous. */
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
    /**
     * Read timeout — PDF extraction can be slow for large documents, but 30 s should
     * be more than enough for a typical student resume.
     */
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(30);

    private final RestClient restClient;

    public AiServiceClient(@Value("${app.ai-service.url}") String aiServiceUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(aiServiceUrl)
                .requestFactory(
                        ClientHttpRequestFactories.get(
                                ClientHttpRequestFactorySettings.DEFAULTS
                                        .withConnectTimeout(CONNECT_TIMEOUT)
                                        .withReadTimeout(READ_TIMEOUT)))
                .build();
    }

    /**
     * POST the PDF bytes to the AI service's {@code /extract-resume} endpoint.
     *
     * @param pdfBytes  raw bytes of the uploaded PDF
     * @param filename  original filename — forwarded as the multipart part's filename
     * @return          extraction result wrapped in {@link Optional}, or
     *                  {@link Optional#empty()} if the service is unavailable / errors
     */
    public Optional<ResumeExtractionResult> extractResume(byte[] pdfBytes, String filename) {
        try {
            // Wrap bytes as a named resource so the multipart part carries the filename.
            ByteArrayResource fileResource = new ByteArrayResource(pdfBytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);

            ResumeExtractionResult result = restClient.post()
                    .uri("/extract-resume")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(ResumeExtractionResult.class);

            return Optional.ofNullable(result);

        } catch (Exception ex) {
            // Swallow any exception — network error, timeout, 4xx/5xx from AI service.
            // The upload endpoint logs and returns aiExtractionSucceeded=false instead of
            // propagating a 500 to the student.
            log.warn("AI service /extract-resume unavailable — extraction skipped for '{}': {}",
                    filename, ex.getMessage());
            return Optional.empty();
        }
    }
}
