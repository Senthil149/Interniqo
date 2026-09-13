-- Migration V7: Add simple student profile fields
ALTER TABLE students
    ADD COLUMN professional_headline VARCHAR(255) NULL,
    ADD COLUMN location VARCHAR(255) NULL,
    ADD COLUMN college VARCHAR(255) NULL,
    ADD COLUMN bio TEXT NULL,
    ADD COLUMN profile_photo_url VARCHAR(1024) NULL,
    ADD COLUMN profile_photo_path VARCHAR(1024) NULL,
    ADD COLUMN github_url VARCHAR(512) NULL,
    ADD COLUMN linkedin_url VARCHAR(512) NULL,
    ADD COLUMN portfolio_url VARCHAR(512) NULL;
