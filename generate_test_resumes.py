def create_pdf(filename, sections):
    stream_lines = ["BT", "/F1 12 Tf", "72 750 Td"]
    y_offset = -20
    first = True
    for header, content in sections:
        if not first:
            stream_lines.append(f"0 -25 Td")
        else:
            first = False
        # Header
        stream_lines.append(f"({header}) Tj")
        for line in content.split("\n"):
            clean_line = line.replace("(", "\\(").replace(")", "\\)")
            stream_lines.append("0 -18 Td")
            stream_lines.append(f"({clean_line}) Tj")
    stream_lines.append("ET")
    stream_content = "\n".join(stream_lines).encode("latin1")
    length = len(stream_content)

    pdf = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length {length} >>
stream
""".encode("latin1") + stream_content + f"""
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000236 00000 n 
0000000300 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
500
%%EOF""".encode("latin1")

    with open(filename, "wb") as f:
        f.write(pdf)
    print(f"Created {filename}")

# Resume 1: Alex Morgan (Standard ordering with Summary at top)
sections_alex = [
    ("SUMMARY", "Senior Computer Science student with 2 years of experience in distributed systems.\nPassionate about building scalable backend microservices."),
    ("EDUCATION", "Stanford University - B.S. in Computer Science, Expected June 2025"),
    ("TECHNICAL SKILLS", "Languages: Python, Java, Go, TypeScript, SQL\nFrameworks & Tools: Spring Boot, React, FastAPI, Docker, Kubernetes, AWS"),
    ("PROFESSIONAL EXPERIENCE", "Software Engineering Intern at Stripe - Built distributed transaction logging service.\nImproved throughput by 35% across payment gateways."),
    ("PROJECTS", "Internship Intelligence Platform - SBERT semantic matching with automated risk scoring."),
    ("CERTIFICATIONS", "AWS Certified Solutions Architect - Associate\nCertified Kubernetes Application Developer (CKAD)"),
    ("INTERESTS", "Open source contributing, Competitive programming (Codeforces 1800), Chess, Hiking"),
]

# Resume 2: Maya Lin (Different ordering: Objective, Skills, Projects, Experience, Education, Interests, Certifications)
sections_maya = [
    ("CAREER OBJECTIVE", "Detail-oriented software engineer with internship experience seeking full-time roles in distributed backend engineering."),
    ("TECHNICAL SKILLS", "Languages: C++, Rust, Python, SQL\nTechnologies: Docker, gRPC, Redis, PostgreSQL"),
    ("PROJECTS", "High-Performance Key-Value Store in Rust\nDistributed Consensus Engine (Raft implementation)"),
    ("WORK EXPERIENCE", "Software Engineer Intern at Datadog - Optimized telemetry pipeline reducing CPU overhead by 20%.\nWrote integration tools and automated tests."),
    ("EDUCATION", "Massachusetts Institute of Technology (MIT) - B.S. in EECS, 2024"),
    ("INTERESTS & ACTIVITIES", "ACM Programming Competition Team Captain\nRock Climbing and Bouldering Club organizer\nAmateur astrophotography"),
    ("CERTIFICATIONS & LICENSES", "HashiCorp Certified: Terraform Associate\nAWS Certified SysOps Administrator"),
]

create_pdf("d:/internship/internship-platform/resume_alex.pdf", sections_alex)
create_pdf("d:/internship/internship-platform/resume_maya.pdf", sections_maya)
