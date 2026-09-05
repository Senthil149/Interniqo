-- Core schema for Interniqo. InnoDB so foreign keys are enforced.

CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE students (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    education TEXT,
    skills TEXT,
    projects TEXT,
    experience TEXT,
    certifications TEXT,
    interests TEXT,
    resume_path VARCHAR(1024),
    PRIMARY KEY (id),
    UNIQUE KEY uk_students_user_id (user_id),
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE companies (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(512),
    country VARCHAR(128),
    email VARCHAR(255) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY uk_companies_user_id (user_id),
    CONSTRAINT fk_companies_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_preferences (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    country VARCHAR(128),
    location VARCHAR(255),
    work_mode VARCHAR(64),
    duration VARCHAR(64),
    minimum_stipend DECIMAL(12, 2),
    currency VARCHAR(8),
    visa_required BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    INDEX idx_student_preferences_student_id (student_id),
    CONSTRAINT fk_student_preferences_student FOREIGN KEY (student_id) REFERENCES students (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE internships (
    id BIGINT NOT NULL AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    required_skills TEXT,
    country VARCHAR(128) NOT NULL,
    city VARCHAR(128),
    work_mode VARCHAR(64) NOT NULL,
    duration VARCHAR(64),
    stipend DECIMAL(12, 2),
    currency VARCHAR(8),
    eligibility TEXT,
    visa_information TEXT,
    deadline DATE,
    status VARCHAR(32) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_internships_company_id (company_id),
    -- Used on every recommendation search (hard filters before SBERT ranking).
    INDEX idx_internships_country_work_mode_status (country, work_mode, status),
    CONSTRAINT fk_internships_company FOREIGN KEY (company_id) REFERENCES companies (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE applications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    internship_id BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL,
    applied_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_applications_student_id (student_id),
    INDEX idx_applications_internship_id (internship_id),
    CONSTRAINT fk_applications_student FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_applications_internship FOREIGN KEY (internship_id) REFERENCES internships (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE risk_assessments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    internship_id BIGINT NOT NULL,
    score INT NOT NULL,
    level VARCHAR(16) NOT NULL,
    reasons TEXT,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_risk_assessments_internship_id (internship_id),
    CONSTRAINT fk_risk_assessments_internship FOREIGN KEY (internship_id) REFERENCES internships (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_id and company_id are both nullable on purpose. Do not add a CHECK (XOR) here:
-- verification is owned by either a user or a company depending on the flow, and the
-- exclusive-owner rule is validated in EmailVerificationService so callers get a
-- domain error instead of a raw SQL constraint failure. See that class for the full why.
CREATE TABLE email_verifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NULL,
    company_id BIGINT NULL,
    token VARCHAR(255) NOT NULL,
    expiry DATETIME(6) NOT NULL,
    verified_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_email_verifications_token (token),
    INDEX idx_email_verifications_user_id (user_id),
    INDEX idx_email_verifications_company_id (company_id),
    CONSTRAINT fk_email_verifications_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_email_verifications_company FOREIGN KEY (company_id) REFERENCES companies (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE credentials (
    id BIGINT NOT NULL AUTO_INCREMENT,
    credential_id VARCHAR(64) NOT NULL,
    student_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    internship_id BIGINT NOT NULL,
    completion_date DATE NOT NULL,
    hash VARCHAR(128) NOT NULL,
    blockchain_tx VARCHAR(128),
    PRIMARY KEY (id),
    UNIQUE KEY uk_credentials_credential_id (credential_id),
    INDEX idx_credentials_student_id (student_id),
    INDEX idx_credentials_company_id (company_id),
    INDEX idx_credentials_internship_id (internship_id),
    CONSTRAINT fk_credentials_student FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_credentials_company FOREIGN KEY (company_id) REFERENCES companies (id),
    CONSTRAINT fk_credentials_internship FOREIGN KEY (internship_id) REFERENCES internships (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE blockchain_records (
    id BIGINT NOT NULL AUTO_INCREMENT,
    credential_id BIGINT NOT NULL,
    transaction_hash VARCHAR(128) NOT NULL,
    contract_address VARCHAR(128) NOT NULL,
    network VARCHAR(64) NOT NULL,
    timestamp DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_blockchain_records_credential_id (credential_id),
    CONSTRAINT fk_blockchain_records_credential FOREIGN KEY (credential_id) REFERENCES credentials (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
