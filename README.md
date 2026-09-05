# AI-Powered Internship Recommendation and Verification System

Monorepo skeleton for a college major project. Four local services:

| Service | Stack | Default URL | Health check |
| --- | --- | --- | --- |
| Frontend | React + Vite + Tailwind CSS + React Router + Axios | http://localhost:5173 | http://localhost:5173/health |
| Backend | Spring Boot (Maven, Java 17) | http://localhost:8080 | http://localhost:8080/health |
| AI service | FastAPI + Sentence-BERT (not loaded yet) | http://localhost:8000 | http://localhost:8000/health |
| Blockchain | Hardhat JSON-RPC | http://127.0.0.1:8545 | `npm run health` in `blockchain/` (requires the node) |

This phase is a start-up skeleton only. No recommendation, risk, email, or credential logic is implemented yet.

## Prerequisites

- Node.js 20+
- Java 17 and Maven 3.9+
- Python 3.11+ (3.13 is fine)
- npm

## 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and http://localhost:5173/health.

## 2. Backend

```bash
cd backend
mvn spring-boot:run
```

```bash
curl http://localhost:8080/health
```

Expected: `{"service":"backend","status":"ok"}`.

## 3. AI service

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

On macOS/Linux, activate with `source venv/bin/activate` instead.

```bash
curl http://localhost:8000/health
```

Expected: `{"service":"ai-service","status":"ok"}`.

`sentence-transformers` is listed so later phases can call `/extract-resume`, `/embed`, and `/match`. The health endpoint does not load the SBERT model.

## 4. Blockchain

```bash
cd blockchain
npm install
npx hardhat compile
npm run node
```

In a second terminal (node must already be running):

```bash
cd blockchain
npm run health
```

Expected JSON includes `"service":"blockchain"` and `"status":"ok"`. The JSON-RPC endpoint is http://127.0.0.1:8545. `contracts/` is empty until a later phase.

## Suggested local ports

- 5173 — frontend (Vite)
- 8080 — Spring Boot
- 8000 — FastAPI
- 8545 — Hardhat

## Repository layout

```
internship-platform/
  frontend/
  backend/
  ai-service/
  blockchain/
  docs/
```
