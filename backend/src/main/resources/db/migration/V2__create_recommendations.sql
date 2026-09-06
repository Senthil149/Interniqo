-- Recommendations table: persists cosine similarity scores and ranks for student recommendations
-- Used for evaluation, ranking persistence, and historical audit.
CREATE TABLE recommendations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    internship_id BIGINT NOT NULL,
    similarity_score DOUBLE NOT NULL,
    ranking INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_recommendations_student_id (student_id),
    INDEX idx_recommendations_internship_id (internship_id),
    CONSTRAINT fk_recommendations_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_recommendations_internship FOREIGN KEY (internship_id) REFERENCES internships (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
