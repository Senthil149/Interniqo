-- Migration V6: Add cross-border matching fields and company persistent verification status

-- 1. Add international attributes to internships
ALTER TABLE internships
    ADD COLUMN visa_required BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN relocation_required BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add student cross-border preferences
ALTER TABLE student_preferences
    ADD COLUMN relocation_preference BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN preferred_countries TEXT NULL;

-- 3. Add persistent verification status to companies
ALTER TABLE companies
    ADD COLUMN verification_status VARCHAR(32) NOT NULL DEFAULT 'UNVERIFIED';

-- 4. Backfill existing verified companies
UPDATE companies
SET verification_status = 'EMAIL_VERIFIED'
WHERE email_verified = TRUE;
