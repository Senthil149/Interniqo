package com.internship.platform;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;

@SpringBootApplication
public class InternshipPlatformApplication {

    private static final Logger log = LoggerFactory.getLogger(InternshipPlatformApplication.class);

    public static void main(String[] args) {
        loadEnvIfPresent();
        SpringApplication.run(InternshipPlatformApplication.class, args);
    }

    /**
     * Load environment variables from a local .env file if present.
     * System environment variables always take precedence over .env file entries.
     */
    private static void loadEnvIfPresent() {
        File[] candidatePaths = new File[]{
                new File(".env"),
                new File("../.env"),
                new File("backend/.env")
        };

        for (File envFile : candidatePaths) {
            if (envFile.exists() && envFile.isFile()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(envFile, StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) {
                            continue;
                        }
                        int eqIdx = line.indexOf('=');
                        if (eqIdx > 0) {
                            String key = line.substring(0, eqIdx).trim();
                            String value = line.substring(eqIdx + 1).trim();
                            // Strip enclosing quotes if present
                            if (value.length() >= 2 && ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'")))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            // Set only if not already set in OS environment or System properties
                            if (System.getenv(key) == null && System.getProperty(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                    log.info("Loaded environment properties from {}", envFile.getPath());
                    break;
                } catch (Exception e) {
                    log.warn("Could not load environment file {}: {}", envFile.getPath(), e.getMessage());
                }
            }
        }
    }
}
