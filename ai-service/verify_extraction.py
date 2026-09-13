import json
import re
from pdfminer.high_level import extract_text
from app.extractor import parse_sections as new_parse_sections

# Old patterns for before/after comparison
OLD_PATTERNS = {
    "skills": re.compile(r"\b(skills?|technical skills?|core competenc(?:ies|y)|technologies|tech stack|tools)\b", re.IGNORECASE),
    "education": re.compile(r"\b(education|academic(?: background| qualifications?)?|qualifications?|schooling)\b", re.IGNORECASE),
    "experience": re.compile(r"\b(experience|work experience|professional experience|employment(?: history)?|internships?)\b", re.IGNORECASE),
    "projects": re.compile(r"\b(projects?|personal projects?|academic projects?|side projects?|portfolio)\b", re.IGNORECASE),
    "certifications": re.compile(r"\b(certifications?|certificates?|achievements?|awards?|licenses?|credentials?)\b", re.IGNORECASE),
    "interests": re.compile(r"\b(interests?|hobbies|extra.?curricular(?: activities?)?|activities)\b", re.IGNORECASE),
}

def old_detect(line):
    s = line.strip()
    if not s or len(s) > 60:
        return None
    for f, p in OLD_PATTERNS.items():
        if p.search(s):
            return f
    return None

def old_parse_sections(text):
    lines = text.splitlines()
    result = {k: None for k in OLD_PATTERNS}
    header_positions = []
    seen = set()
    for i, line in enumerate(lines):
        f = old_detect(line)
        if f is not None and f not in seen:
            header_positions.append((i, f))
            seen.add(f)
    for idx, (start, f) in enumerate(header_positions):
        end = header_positions[idx + 1][0] if idx + 1 < len(header_positions) else len(lines)
        cl = [l.strip() for l in lines[start + 1 : end] if l.strip()]
        if cl:
            result[f] = "\n".join(cl)
    return result

# 1. Test resume_alex.pdf with OLD vs NEW
text_alex = extract_text("d:/internship/internship-platform/resume_alex.pdf")
print("=" * 70)
print("EXTRACTED RAW TEXT (resume_alex.pdf):")
print("=" * 70)
print(text_alex.strip())

print("\n" + "=" * 70)
print("BEFORE (OLD EXTRACTOR LOGIC):")
print("=" * 70)
before_alex = old_parse_sections(text_alex)
print(json.dumps(before_alex, indent=2))

print("\n" + "=" * 70)
print("AFTER (NEW EXTRACTOR LOGIC):")
print("=" * 70)
after_alex = new_parse_sections(text_alex)
print(json.dumps(after_alex, indent=2))

# 2. Test resume_maya.pdf with NEW
text_maya = extract_text("d:/internship/internship-platform/resume_maya.pdf")
print("\n" + "=" * 70)
print("AFTER (NEW EXTRACTOR LOGIC on resume_maya.pdf):")
print("=" * 70)
after_maya = new_parse_sections(text_maya)
print(json.dumps(after_maya, indent=2))
