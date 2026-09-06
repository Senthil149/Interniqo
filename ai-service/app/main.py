"""
Internship AI Microservice — FastAPI application entry point.

Design rule #5: this service is called over HTTP by Spring Boot.
No extraction or ML logic lives inside the Spring Boot process.

Endpoints:
  GET  /health          — liveness probe
  POST /extract-resume  — accept a PDF, return structured profile sections
"""
from fastapi import FastAPI, File, HTTPException, UploadFile

from app.extractor import extract_text_from_pdf, parse_sections

app = FastAPI(title="Internship AI Service")

# Content-types that browsers / HTTP clients may send for PDF uploads.
# application/octet-stream is a common fallback when the client does not
# inspect the file before uploading.
_ACCEPTED_PDF_TYPES = {"application/pdf", "application/octet-stream"}


@app.get("/health")
def health():
    return {"service": "ai-service", "status": "ok"}


@app.post("/extract-resume")
async def extract_resume(file: UploadFile = File(...)):
    """
    Accept a PDF resume and return structured profile section text.

    This extraction is a first-pass heuristic — accuracy varies by resume
    format.  See app/extractor.py for full accuracy caveats.

    TODO(measure after real evaluation): track precision/recall of section
    detection against a labelled resume corpus before relying on these
    outputs downstream.

    Returns:
        JSON object with nullable string fields:
          skills, education, experience, projects, certifications, interests.
        Additional '_note' key when no text layer is found (scanned PDF).

    Raises:
        400 if the uploaded file is not a PDF.
        422 if the PDF cannot be parsed at all (corrupt / encrypted).
    """
    # Validate type
    if file.content_type not in _ACCEPTED_PDF_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Only PDF files are accepted. Received content-type: {file.content_type}",
        )
    filename = file.filename or ""
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="File must have a .pdf extension.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=422, detail="Uploaded file is empty.")

    # Extract text — raises ValueError for malformed PDFs
    try:
        text = extract_text_from_pdf(content)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # Scanned/image-only PDFs have no text layer; pdfminer returns empty string.
    # OCR is not supported in this version.
    if not text.strip():
        return {
            "skills": None,
            "education": None,
            "experience": None,
            "projects": None,
            "certifications": None,
            "interests": None,
            "_note": (
                "No extractable text found. The PDF may be a scanned image. "
                "OCR is not supported in this version."
            ),
        }

    sections = parse_sections(text)
    return sections
