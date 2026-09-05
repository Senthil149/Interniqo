from fastapi import FastAPI

app = FastAPI(title="Internship AI Service")


@app.get("/health")
def health():
    return {"service": "ai-service", "status": "ok"}
