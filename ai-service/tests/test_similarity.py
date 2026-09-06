"""
Unit and integration tests for SBERT embedding and semantic matching.

Validates:
1. Semantic sanity: Two clearly similar texts score higher cosine similarity
   than two clearly dissimilar ones.
2. /embed endpoint: Returns a 384-dimensional SBERT vector for input text.
3. /match endpoint: Pure similarity ranking sorted descending by raw cosine
   similarity score, obeying design rules #1 (pure similarity) and #2 (raw score signal).
"""

import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.matcher import compute_embedding, compute_matches, get_model
from sentence_transformers import util


class TestSemanticSimilarity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Warm up the model once for the test suite
        cls.model = get_model()
        cls.client = TestClient(app)

    def test_semantic_sanity_similar_vs_dissimilar(self):
        """
        Confidence test: Two clearly similar texts MUST score significantly higher
        than two clearly dissimilar texts using the loaded SBERT model.
        """
        resume_text = (
            "Software engineer with extensive experience in Java, Spring Boot, "
            "MySQL relational databases, and designing scalable REST APIs."
        )

        similar_internship = (
            "Backend Java Developer Intern. Responsible for building RESTful microservices "
            "using Spring Boot, Hibernate, and SQL databases."
        )

        dissimilar_internship = (
            "Pastry Chef Apprentice. Seeking an enthusiastic baker to assist with sourdough "
            "bread fermentation, croissant lamination, and cake decoration."
        )

        # Compute embeddings
        resume_vec = self.model.encode(resume_text, convert_to_tensor=True, normalize_embeddings=True)
        similar_vec = self.model.encode(similar_internship, convert_to_tensor=True, normalize_embeddings=True)
        dissimilar_vec = self.model.encode(dissimilar_internship, convert_to_tensor=True, normalize_embeddings=True)

        similar_score = float(util.cos_sim(resume_vec, similar_vec).item())
        dissimilar_score = float(util.cos_sim(resume_vec, dissimilar_vec).item())

        # Assertions
        self.assertGreater(
            similar_score,
            dissimilar_score,
            f"Similar text score ({similar_score:.4f}) must be higher than dissimilar score ({dissimilar_score:.4f})",
        )

        # Ensure a healthy, distinct margin of separation (typically > 0.4 difference)
        margin = similar_score - dissimilar_score
        self.assertGreater(
            margin,
            0.3,
            f"Expected a substantial semantic gap (>0.3), but got margin {margin:.4f}",
        )

    def test_embed_endpoint_success(self):
        """POST /embed returns a 384-dimensional vector of floats."""
        payload = {"text": "Frontend developer skilled in React, TypeScript, and modern CSS."}
        response = self.client.post("/embed", json=payload)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("embedding", data)
        self.assertIn("dimensions", data)
        self.assertEqual(data["dimensions"], 384)
        self.assertEqual(len(data["embedding"]), 384)
        self.assertTrue(all(isinstance(val, float) for val in data["embedding"]))

    def test_embed_endpoint_empty_text(self):
        """POST /embed with empty or blank text returns 422 Unprocessable Entity."""
        response = self.client.post("/embed", json={"text": "   "})
        self.assertEqual(response.status_code, 422)

    def test_match_endpoint_sorting_and_ranking(self):
        """
        POST /match returns matches sorted descending by cosine similarity score,
        with similar internships ranking above dissimilar ones.
        """
        payload = {
            "resume": (
                "Data Science student skilled in Python, PyTorch, pandas, "
                "machine learning algorithms, and natural language processing."
            ),
            "internships": [
                {
                    "id": "job-culinary",
                    "title": "Sous Chef Intern",
                    "description": "Prepare ingredients, oversee prep station, and assist head chef with French cuisine.",
                },
                {
                    "id": "job-ml",
                    "title": "Machine Learning Research Intern",
                    "description": "Develop and fine-tune NLP models, evaluate transformers using PyTorch, and clean datasets.",
                },
                {
                    "id": "job-general-it",
                    "title": "IT Helpdesk Support",
                    "description": "Troubleshoot hardware issues, configure printers, and manage Windows desktop accounts.",
                },
            ],
        }

        response = self.client.post("/match", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertTrue(data.get("sorted"))
        matches = data.get("matches", [])
        self.assertEqual(len(matches), 3)

        # ML job should rank first (#1)
        self.assertEqual(matches[0]["id"], "job-ml")
        # Culinary job should rank last (#3)
        self.assertEqual(matches[2]["id"], "job-culinary")

        # Verify scores are sorted strictly descending
        scores = [m["similarity_score"] for m in matches]
        self.assertEqual(scores, sorted(scores, reverse=True))

        # Check raw cosine similarity bounds: within [-1.0, 1.0]
        for m in matches:
            score = m["similarity_score"]
            self.assertIsInstance(score, float)
            self.assertGreaterEqual(score, -1.0)
            self.assertLessEqual(score, 1.0)

    def test_match_endpoint_structured_resume_dict(self):
        """POST /match accepts structured dictionary representing resume sections."""
        structured_resume = {
            "skills": "Python, FastAPI, Docker, PostgreSQL",
            "experience": "Built microservices and REST APIs for web applications.",
            "education": "B.S. in Computer Science",
        }

        payload = {
            "resume": structured_resume,
            "internships": [
                {
                    "id": 1,
                    "title": "Backend Python Intern",
                    "description": "Build high-performance REST APIs with FastAPI and Docker.",
                },
                {
                    "id": 2,
                    "title": "Graphic Design Intern",
                    "description": "Create marketing banners, flyers, and illustrations in Adobe Photoshop.",
                },
            ],
        }

        response = self.client.post("/match", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        matches = data["matches"]

        self.assertEqual(matches[0]["id"], 1)
        self.assertEqual(matches[1]["id"], 2)
        self.assertGreater(matches[0]["similarity_score"], matches[1]["similarity_score"])

    def test_match_endpoint_empty_internships(self):
        """POST /match with an empty list of internships returns an empty matches array."""
        payload = {
            "resume": "Software engineer",
            "internships": [],
        }
        response = self.client.post("/match", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["matches"], [])


if __name__ == "__main__":
    unittest.main()
