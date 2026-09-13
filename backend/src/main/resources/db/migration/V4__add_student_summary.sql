-- Migration V4: Add summary column to students table for extracted resume summary/objective
ALTER TABLE students
    ADD COLUMN summary TEXT NULL;
