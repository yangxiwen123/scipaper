# SCI Writer — 论文写作辅助系统

A wizard-based SCI paper writing assistant built with a traditional software architecture (template engine + rule engine + automation workflow). No AI/LLM dependency.

## Architecture

```
Frontend (React 18 + Ant Design)  →  Backend (Python FastAPI)  →  PostgreSQL 15 + Redis
                                        ↓
                              LaTeX (xelatex) → PDF
                              python-docx     → .docx
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend dev)
- Python 3.12+ (for backend dev)

### Full Stack (Docker)

```bash
# Start all services (PostgreSQL, Redis, LanguageTool, Backend, Celery)
docker-compose up -d

# Seed the database with phrasebank and journal templates
docker-compose exec backend python -m seed_data.run_seed

# The API is available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Backend Only (Dev)

```bash
cd backend
pip install -r requirements.txt
python -m seed_data.run_seed
uvicorn app.main:app --reload --port 8000
```

### Frontend Only (Dev)

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/papers` | Create a new paper |
| GET | `/api/papers/{id}/sections` | List paper sections |
| PUT | `/api/papers/{id}/sections/{name}` | Update section content |
| GET | `/api/phrasebank/categories` | Get phrase category tree |
| GET | `/api/phrasebank/search` | Search academic phrases |
| POST | `/api/phrasebank/assemble` | Fill phrase template slots |
| POST | `/api/references/import` | Import BibTeX/RIS references |
| POST | `/api/export/compile/{id}` | Export to PDF/LaTeX/Word |
| POST | `/api/export/validate/{id}` | Pre-export validation check |

## Project Structure

```
sci-writer/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI route handlers
│   │   ├── engines/        # Core engines (LaTeX, DOCX, Numbering, Citation)
│   │   ├── parsers/        # BibTeX/RIS reference importers
│   │   ├── services/       # Business logic (Phrase, Export, Validation)
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   └── core/           # Config, database, Celery setup
│   ├── seed_data/          # Phrasebank & journal template seed data
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Wizard/         # PaperWizard stepper
│       │   ├── StepForm/       # SectionEditor
│       │   ├── PhraseBrowser/  # Academic phrase library
│       │   └── ExportPreview/  # Export/download modal
│       ├── stores/             # Zustand state management
│       └── api/                # API client layer
├── templates/              # LaTeX Jinja2 templates per journal
│   ├── ieee/
│   ├── elsevier/
│   └── generic/
└── docker-compose.yml
```

## Key Features (MVP)

1. **Wizard UI**: 7-step guided paper writing (Abstract → Conclusion)
2. **Academic Phrasebank**: 30 curated sentence templates across all SCI sections
3. **LaTeX/PDF Export**: Automatic compilation with IEEE/Elsevier/Springer/Nature templates
4. **BibTeX/RIS Import**: Parse and manage references with cross-citation linking
5. **Validation Engine**: Multi-level completeness checks (field, section, paper)
6. **Citation Formatter**: Support for IEEE, APA, Vancouver, Nature, MLA styles

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Ant Design 5, Zustand |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 |
| Database | PostgreSQL 15 (JSONB for structured content) |
| Cache | Redis 7 |
| Task Queue | Celery |
| Typesetting | TeX Live (xelatex), python-docx, Pandoc |
| Grammar Check | LanguageTool (local Docker) |
