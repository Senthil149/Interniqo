"""
Sentence-BERT embedding and similarity matching module.

Model Choice:
  We load 'all-MiniLM-L6-v2' from sentence-transformers.
  - Generates 384-dimensional dense embeddings.
  - Very lightweight (~80 MB) with fast CPU inference times, making it ideal
    for local microservice execution in development and testing.
  - Well-established benchmark performance for semantic textual similarity (STS).
  - Note on resume extraction: the existing /extract-resume endpoint in app/extractor.py
    uses layout-aware heuristic text parsing (pdfminer.six) without an ML model.
    Thus, all-MiniLM-L6-v2 is initialized here as the foundational embedding model
    for all vector generation and semantic matching.

Design Rule Compliance:
  - Rule #1: This is a pure similarity service. No hard filtering (country,
    work_mode, duration, stipend, eligibility, visa) or business logic is
    applied here. Hard filters are executed in Spring Boot before calling /match.
  - Rule #2: Returns the raw cosine similarity score (typically between 0.0 and 1.0
    for normalized text vectors, or [-1.0, 1.0] generally) as a ranking signal.
    It is never transformed into a percentage match or probability.
"""

from __future__ import annotations

import logging
from typing import Any, Optional, Union
from sentence_transformers import SentenceTransformer, util

logger = logging.getLogger(__name__)

# Model identifier
MODEL_NAME = "all-MiniLM-L6-v2"

# Global cached model instance (loaded once on demand / at startup)
_model: Optional[SentenceTransformer] = None


def get_model() -> SentenceTransformer:
    """
    Retrieve or lazily initialize the shared SentenceTransformer singleton.

    Ensures the ~80 MB model weights are loaded once in memory and reused
    across requests rather than instantiated repeatedly.
    """
    global _model
    if _model is None:
        logger.info("Loading sentence-transformers model '%s'...", MODEL_NAME)
        _model = SentenceTransformer(MODEL_NAME)
        logger.info("Model '%s' loaded successfully.", MODEL_NAME)
    return _model


def format_resume_text(resume: Union[str, dict[str, Any]]) -> str:
    """
    Format a resume representation into a single string for embedding.

    Accepts either a raw string or a structured dictionary (such as the output
    from /extract-resume: skills, education, experience, projects, etc.).
    """
    if isinstance(resume, str):
        return resume.strip()
    if isinstance(resume, dict):
        parts: list[str] = []
        for key, value in resume.items():
            if value and isinstance(value, str) and value.strip():
                # Avoid internal metadata fields like '_note'
                if not key.startswith("_"):
                    parts.append(f"{key.capitalize()}:\n{value.strip()}")
        return "\n\n".join(parts)
    return str(resume).strip()


def compute_embedding(text: str) -> list[float]:
    """
    Encode input text into an SBERT vector.

    Returns:
        List of 384 floating-point numbers representing the dense embedding.
    """
    model = get_model()
    # encode returns a numpy array or torch Tensor; convert to list of python floats
    vector = model.encode(text, convert_to_tensor=False, normalize_embeddings=True)
    return vector.tolist()


def compute_matches(
    resume_representation: Union[str, dict[str, Any]],
    internships: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Compute raw cosine similarity between a resume and a list of internships.

    Each internship dict must contain:
      - 'id': int or str identifier
      - 'description': str internship description
      - optional 'title': str internship title

    Returns:
        List of dicts: [{'id': ..., 'similarity_score': float}, ...]
        SORTED in descending order of similarity_score (highest cosine similarity first).
        Raw cosine similarity is used as a ranking signal (per design rule #2).
        No hard filtering is performed here (per design rule #1).
    """
    if not internships:
        return []

    resume_text = format_resume_text(resume_representation)
    if not resume_text:
        # If resume text is completely empty, return zero similarity for all
        return [{"id": item["id"], "similarity_score": 0.0} for item in internships]

    model = get_model()

    # Prepare internship texts (combine title + description if title present)
    internship_texts: list[str] = []
    for item in internships:
        title = item.get("title")
        description = item.get("description", "")
        if title and title.strip():
            internship_texts.append(f"{title.strip()}\n{description.strip()}")
        else:
            internship_texts.append(description.strip())

    # Encode both resume and internship descriptions with L2 normalization
    resume_vec = model.encode(resume_text, convert_to_tensor=True, normalize_embeddings=True)
    internship_vecs = model.encode(internship_texts, convert_to_tensor=True, normalize_embeddings=True)

    # Compute cosine similarity matrix: shape (1, N)
    cosine_scores = util.cos_sim(resume_vec, internship_vecs)[0]

    # Build results list with raw cosine similarity score
    results: list[dict[str, Any]] = []
    for i, item in enumerate(internships):
        score = float(cosine_scores[i].item())
        results.append({
            "id": item["id"],
            "similarity_score": score,
        })

    # Sort descending by similarity score (highest similarity first)
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return results
