-- Add attempt counter to email_verifications to protect 6-digit OTPs against brute-force guessing
ALTER TABLE email_verifications ADD COLUMN attempts INT NOT NULL DEFAULT 0;
