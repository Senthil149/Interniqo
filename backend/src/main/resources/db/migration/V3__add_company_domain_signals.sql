-- Migration V3: Add company domain quality and website match signals
ALTER TABLE companies
    ADD COLUMN personal_email BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN website_domain_match BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill personal_email for existing records using common free/personal email providers
UPDATE companies
SET personal_email = TRUE
WHERE LOWER(email) LIKE '%@gmail.com'
   OR LOWER(email) LIKE '%@googlemail.com'
   OR LOWER(email) LIKE '%@yahoo.com'
   OR LOWER(email) LIKE '%@ymail.com'
   OR LOWER(email) LIKE '%@outlook.com'
   OR LOWER(email) LIKE '%@hotmail.com'
   OR LOWER(email) LIKE '%@live.com'
   OR LOWER(email) LIKE '%@msn.com'
   OR LOWER(email) LIKE '%@icloud.com'
   OR LOWER(email) LIKE '%@me.com'
   OR LOWER(email) LIKE '%@mac.com'
   OR LOWER(email) LIKE '%@aol.com'
   OR LOWER(email) LIKE '%@protonmail.com'
   OR LOWER(email) LIKE '%@proton.me'
   OR LOWER(email) LIKE '%@zoho.com'
   OR LOWER(email) LIKE '%@mail.com'
   OR LOWER(email) LIKE '%@gmx.com'
   OR LOWER(email) LIKE '%@fastmail.com';
