import re
from typing import Optional

SECTION_PATTERNS: dict[str, re.Pattern[str]] = {
    'summary': re.compile(
        r'^[\d\.\-\#\*\s\•\—\:\_]*(?:professional\s+|career\s+|executive\s+|personal\s+)?(summary|objective|profile|about(?:\s+me)?|overview|biography)(?:\s*(?:statement|section))?[\s\:\-\|]*$',
        re.IGNORECASE,
    ),
    'education': re.compile(
        r'^[\d\.\-\#\*\s\•\—\:\_]*(education|academic(?: background| history| qualifications?)?|qualifications?|schooling|academics)(?:\s*(?:&|and)\s*(?:training|academics))?[\s\:\-\|]*$',
        re.IGNORECASE,
    ),
    'skills': re.compile(
        r'^[\d\.\-\#\*\s\•\—\:\_]*(?:technical\s+|core\s+|professional\s+|key\s+)?(skills?|competenc(?:ies|y)|technologies|tech stack|tools|proficiencies)(?:\s*(?:&|and)\s*(?:tools|technologies|proficiencies|competencies))?[\s\:\-\|]*$',
        re.IGNORECASE,
    ),
    'experience': re.compile(
        r'^[\d\.\-\#\*\s\•\—\:\_]*(?:work\s+|professional\s+|employment\s+|relevant\s+|industry\s+|career\s+)?(experience|employment(?: history)?|work history|internships?|practical experience)(?:\s*(?:&|and)\s*(?:internships?|work history))?[\s\:\-\|]*$',
        re.IGNORECASE,
    ),
    'projects': re.compile(
        r'^[\d\.\-\#\*\s\•\—\:\_]*(?:personal\s+|academic\s+|side\s+|key\s+|selected\s+|technical\s+)?(projects?|portfolio|project work)(?:\s*(?:&|and)\s*(?:experience|portfolio))?[\s\:\-\|]*$',
        re.IGNORECASE,
    ),
    'certifications': re.compile(
        r'^[\d\.\-\#\*\s\•\—\:\_]*(?:professional\s+|licenses?\s*(?:&|and)\s*|honors?\s*(?:&|and)\s*awards?|awards?\s*(?:&|and)\s*honors?|honors?|awards?|achievements?|certifications?\s*(?:&|and)\s*licenses?|licenses?\s*(?:&|and)\s*certifications?)?(certifications?|certificates?|licenses?|credentials?|accreditations?|awards?|achievements?)(?:\s*(?:&|and)\s*(?:licenses?|certificates?|credentials?|awards?|honors?))?[\s\:\-\|]*$',
        re.IGNORECASE,
    ),
    'interests': re.compile(
        r'^[\d\.\-\#\*\s\•\—\:\_]*(interests?|hobbies|extra.?curricular(?: activities?)?|activities|areas of interest|personal interests)(?:\s*(?:&|and)\s*(?:hobbies|interests?|activities))?[\s\:\-\|]*$',
        re.IGNORECASE,
    ),
}

MAX_HEADER_LINE_LENGTH = 60

def _detect_section_header(line: str) -> Optional[str]:
    stripped = line.strip()
    if not stripped or len(stripped) > MAX_HEADER_LINE_LENGTH:
        return None
    for field, pattern in SECTION_PATTERNS.items():
        if pattern.search(stripped):
            return field
    return None

def parse_sections(text: str) -> dict[str, Optional[str]]:
    lines = text.splitlines()
    result: dict[str, Optional[str]] = {k: None for k in SECTION_PATTERNS}

    header_positions: list[tuple[int, str]] = []
    seen_fields: set[str] = set()

    for i, line in enumerate(lines):
        field = _detect_section_header(line)
        if field is not None and field not in seen_fields:
            header_positions.append((i, field))
            seen_fields.add(field)

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

# Resume 2: Different order (Skills first, Interests before Certifications, Objective instead of Summary)
resume2 = '''
Maya Lin
maya@mit.edu

CAREER OBJECTIVE:
Detail-oriented software engineer with internship experience seeking full-time roles in distributed backend engineering.

TECHNICAL SKILLS:
- Languages: C++, Rust, Python, SQL
- Technologies: Docker, gRPC, Redis, PostgreSQL

PROJECTS:
- High-Performance Key-Value Store in Rust
- Distributed Consensus Engine (Raft implementation)

WORK EXPERIENCE:
Software Engineer Intern at Datadog (Summer 2024)
- Optimized telemetry pipeline reducing CPU overhead by 20%
- Wrote integration tools and automated tests

EDUCATION:
Massachusetts Institute of Technology (MIT)
Bachelor of Science in Electrical Engineering and Computer Science, 2024

INTERESTS & ACTIVITIES:
- ACM Programming Competition Team Captain
- Rock Climbing & Bouldering Club organizer
- Amateur astronomy and astrophotography

CERTIFICATIONS & LICENSES:
- HashiCorp Certified: Terraform Associate
- AWS Certified SysOps Administrator
'''

res2 = parse_sections(resume2)
import json
print("--- RESUME 2 PARSE RESULT ---")
print(json.dumps(res2, indent=2))

assert res2['summary'].startswith('Detail-oriented')
assert 'C++, Rust' in res2['skills']
assert 'Key-Value Store' in res2['projects']
assert 'Datadog' in res2['experience']
assert 'MIT' in res2['education']
assert 'ACM Programming' in res2['interests']
assert 'Terraform Associate' in res2['certifications']
print("\nAll assertions PASSED for resume 2!")
