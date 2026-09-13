"""
Resume section extractor — first-pass heuristic approach.

Strategy overview:
  1. Extract raw text from the PDF using pdfminer.six, which is layout-aware
     and handles multi-column resumes better than pypdf.
  2. Scan each line for known section-header keywords combined with a
     short-line heuristic (headers are rarely longer than 60 characters).
  3. Collect the text between consecutive detected headers.
  4. Return as a dict; any un-detected section gets None.

IMPORTANT — ACCURACY DISCLAIMER:
  This is a best-effort first pass based on keyword matching and line-length
  thresholds.  Accuracy varies significantly by resume format:
  - Works best with standard single-column academic / US-style text resumes.
  - Multi-column, heavily styled, or image-only (scanned) resumes often
    produce incorrect section boundaries or empty fields.
  - Scanned-image PDFs have no text layer at all — pdfminer returns empty
    string; detection is impossible without OCR (not supported here).

  TODO(measure after real evaluation): benchmark against a labelled corpus of
  real student resumes before using these extractions as reliable input for the
  SBERT recommendation phase (Phase 6).  Do NOT claim high extraction accuracy
  without empirical evidence.
"""

from __future__ import annotations

import re
from io import BytesIO
from typing import Optional

from pdfminer.high_level import extract_text


# ---------------------------------------------------------------------------
# Section detection patterns
# ---------------------------------------------------------------------------
# Each pattern matches common variants of a section header.
# Patterns are intentionally broad to reduce false negatives; short-line
# gating (MAX_HEADER_LINE_LENGTH) is the primary noise filter.

SECTION_PATTERNS: dict[str, re.Pattern[str]] = {
    "summary": re.compile(
        r"^[\d\.\-\#\*\s\•\—\:\_]*(?:professional\s+|career\s+|executive\s+|personal\s+)?(summary|objective|profile|about(?:\s+me)?|overview|biography)(?:\s*(?:statement|section))?[\s\:\-\|]*$",
        re.IGNORECASE,
    ),
    "education": re.compile(
        r"^[\d\.\-\#\*\s\•\—\:\_]*(education|academic(?: background| history| qualifications?)?|qualifications?|schooling|academics)(?:\s*(?:&|and)\s*(?:training|academics))?[\s\:\-\|]*$",
        re.IGNORECASE,
    ),
    "skills": re.compile(
        r"^[\d\.\-\#\*\s\•\—\:\_]*(?:technical\s+|core\s+|professional\s+|key\s+)?(skills?|competenc(?:ies|y)|technologies|tech stack|tools|proficiencies)(?:\s*(?:&|and)\s*(?:tools|technologies|proficiencies|competencies))?[\s\:\-\|]*$",
        re.IGNORECASE,
    ),
    "experience": re.compile(
        r"^[\d\.\-\#\*\s\•\—\:\_]*(?:work\s+|professional\s+|employment\s+|relevant\s+|industry\s+|career\s+)?(experience|employment(?: history)?|work history|internships?|practical experience)(?:\s*(?:&|and)\s*(?:internships?|work history))?[\s\:\-\|]*$",
        re.IGNORECASE,
    ),
    "projects": re.compile(
        r"^[\d\.\-\#\*\s\•\—\:\_]*(?:personal\s+|academic\s+|side\s+|key\s+|selected\s+|technical\s+)?(projects?|portfolio|project work)(?:\s*(?:&|and)\s*(?:experience|portfolio))?[\s\:\-\|]*$",
        re.IGNORECASE,
    ),
    "certifications": re.compile(
        r"^[\d\.\-\#\*\s\•\—\:\_]*(?:professional\s+|licenses?\s*(?:&|and)\s*|honors?\s*(?:&|and)\s*awards?|awards?\s*(?:&|and)\s*honors?|honors?|awards?|achievements?|certifications?\s*(?:&|and)\s*licenses?|licenses?\s*(?:&|and)\s*certifications?)?(certifications?|certificates?|licenses?|credentials?|accreditations?|awards?|achievements?)(?:\s*(?:&|and)\s*(?:licenses?|certificates?|credentials?|awards?|honors?))?[\s\:\-\|]*$",
        re.IGNORECASE,
    ),
    "interests": re.compile(
        r"^[\d\.\-\#\*\s\•\—\:\_]*(interests?|hobbies|extra.?curricular(?: activities?)?|activities|areas of interest|personal interests)(?:\s*(?:&|and)\s*(?:hobbies|interests?|activities))?[\s\:\-\|]*$",
        re.IGNORECASE,
    ),
}

# A candidate line must be no longer than this to be treated as a header.
# Body text sentences containing a keyword would typically be much longer.
MAX_HEADER_LINE_LENGTH: int = 60


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_text_from_pdf(content: bytes) -> str:
    """
    Extract all text from a PDF given as raw bytes using pdfminer.six.

    Returns:
        Extracted text, possibly empty for scanned/image-only PDFs.

    Raises:
        ValueError: if the bytes cannot be parsed as a PDF at all (e.g.
                    corrupted, encrypted without a password hint).
    """
    try:
        text = extract_text(BytesIO(content))
        return text or ""
    except Exception as exc:
        raise ValueError(f"Could not parse PDF content: {exc}") from exc


def parse_sections(text: str) -> dict[str, Optional[str]]:
    """
    Split extracted PDF text into named profile sections.

    Algorithm:
      Pass 1 — locate the line index of each section header, keeping only the
               first occurrence of each field.
      Pass 2 — collect the lines between consecutive header positions and
               join them as the section content.

    Returns:
        Dict with keys: summary, education, skills, experience, projects,
        certifications, interests.  Value is a stripped, newline-joined
        content string or None if the header was not found.

    NOTE: Content bleed between adjacent sections is possible when resumes
    lack clear whitespace between them.  This is a known limitation of the
    heuristic approach.  See module docstring for accuracy caveats.
    """
    lines = text.splitlines()
    result: dict[str, Optional[str]] = {k: None for k in SECTION_PATTERNS}

    # Pass 1 — find header positions (first occurrence wins)
    header_positions: list[tuple[int, str]] = []
    seen_fields: set[str] = set()

    for i, line in enumerate(lines):
        field = _detect_section_header(line)
        if field is not None and field not in seen_fields:
            header_positions.append((i, field))
            seen_fields.add(field)

    # Pass 2 — collect content between consecutive headers
    for idx, (start, field) in enumerate(header_positions):
        end = (
            header_positions[idx + 1][0]
            if idx + 1 < len(header_positions)
            else len(lines)
        )
        content_lines = [l.strip() for l in lines[start + 1 : end] if l.strip()]
        if content_lines:
            result[field] = "\n".join(content_lines)

    return result


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _detect_section_header(line: str) -> Optional[str]:
    """
    Return the section key if `line` looks like a section header, else None.

    A line qualifies when:
      - It is non-empty after stripping whitespace.
      - Its stripped length is ≤ MAX_HEADER_LINE_LENGTH.
      - Exactly one SECTION_PATTERNS entry matches (first match wins).
    """
    stripped = line.strip()
    if not stripped or len(stripped) > MAX_HEADER_LINE_LENGTH:
        return None
    for field, pattern in SECTION_PATTERNS.items():
        if pattern.search(stripped):
            return field
    return None
