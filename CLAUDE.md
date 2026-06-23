# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言规则

**永远使用中文回复**。所有注释、文档、commit message、UI 文案均使用中文。

## Project Identity

SCI Writer — a zero-AI, traditional-software-architecture SCI paper writing assistant for non-academics. Template engine + rule engine + wizard UI + auto-typesetting pipeline. Competition entry for the Trae Creativity Contest.

## Dev Commands

```bash
# Frontend (standalone mode works without backend)
cd frontend && npm run dev          # http://localhost:3000
cd frontend && npx tsc --noEmit     # TypeScript type check

# Backend (requires PostgreSQL running)
cd backend
pip install -r requirements.txt
python -m seed_data.run_seed        # seed phrasebank + journal templates
uvicorn app.main:app --reload --port 8000   # http://localhost:8000/docs

# Full stack via Docker
docker-compose up -d                # postgres + redis + languagetool + backend + celery
docker-compose exec backend python -m seed_data.run_seed
```

## Git & Environment

- 项目位于 `D:\CodeProject\scipaper`
- **必须使用 SSH push**：`git remote set-url origin git@github.com:yangxiwen123/scipaper.git`。HTTPS 443 端口在本地网络被阻断。
- 提交前运行 `npx tsc --noEmit` 确保零 TypeScript 错误。
- `competition.html` 是参赛技术方案书，每次架构变更后需同步更新。

## Architecture (the non-obvious parts)

### The Document AST is the spine of the system

All export formats share a single pipeline: `PostgreSQL JSONB → DocumentAST → Compiler → Output`. Adding a new export format only requires a new Compiler class that reads the same AST.

- `backend/app/engines/document_ast.py` — 12 frozen dataclass types: `DocumentAST`, `Section`, `Paragraph`, `TextRun`, `CitationRun`, `FigureRef`, `TableRef`, `EquationRef`, `PhraseSlotRun`, `FigureElement`, `TableElement`, `EquationElement`
- Every Run subtype has `from_dict(d)` / `to_dict()` for JSONB round-trips
- `run_from_dict(d)` is the factory dispatcher — recognizes the `"type"` discriminator in JSONB and constructs the correct frozen dataclass
- `ASTBuilder.build()` constructs the full tree from database records
- `PaperSection.to_ast_section()` and `update_from_ast_section()` are the direct DB↔AST bridges on the model

### Frontend has two mutually exclusive modes

Controlled by `paperStore.isStandalone`:
- **Standalone** (`createStandalonePaper()`): All state in `localStorage`, zero backend dependency. Used for demo and competition judging. The "Start Writing Now" button on the home screen enters this mode.
- **Connected** (`createPaper()`): Syncs with FastAPI backend via REST API. Used for full pipeline (LaTeX/PDF export).

The Zustand store (`paperStore.ts`) is the single source of truth in both modes. `updateSectionContent()` checks `isStandalone` to decide whether to call `saveToStorage()` or `api.updateSection()`.

### Structured section schemas replace blank textareas

`frontend/src/data/sectionSchemas.ts` defines 26 labeled sub-fields across 6 SCI sections. This is the core UX innovation — users see "fill in the blank" forms instead of empty pages.

Section content is stored as `content_json._fieldValues: Record<string, string>` (field key → user text). The `StructuredSectionEditor` recovers field values on mount via `recoverFieldValues()`, which checks `_fieldValues` first and falls back to parsing old paragraph-based content.

### Phrasebank is a template engine, not text generation

89 hand-authored templates in `backend/seed_data/phrasebank_seed.py`. Each template has:
- `template_text` with `{slot_name}` placeholders
- `slots` JSONB defining type (`text`/`number`/`select`), required flag, hint, and options
- `PhraseAssembler.fill()` validates slot types before substitution and raises `SlotValidationError` on failure

### BibTeX/RIS parser is hand-written, no dependencies

`backend/app/parsers/reference_importer.py` — zero external parser libraries.

Key design decisions:
- `_find_bibtex_entry_spans()` tracks brace depth (not regex) for nested values in titles with math mode
- `_parse_author_string()` returns `AuthorName` dataclasses and handles: `"Smith, John"`, `"John Smith"`, corporate `"{Org Name}"`, particles (van, der, von), suffixes (Jr., III), and mixed formats within the same string
- `detect_format()` auto-recognizes BibTeX vs RIS

### Citation formatter is five independent implementations

`backend/app/engines/citation_formatter.py` — each style (IEEE, APA 7th, Vancouver, Nature, MLA 9th) has its own dedicated method. Author name normalization differs per style (IEEE uses `"J. K."`, Vancouver uses `"JK"`, APA uses `"Author, A. A."`).

## Key Files for Common Tasks

| Task | Files to touch |
|------|---------------|
| Change how a section's form fields look | `frontend/src/data/sectionSchemas.ts` → `StructuredSectionEditor.tsx` |
| Add a new phrasebank template | `backend/seed_data/phrasebank_seed.py` (add dict to list) |
| Add a validation rule | `backend/app/services/validation_service.py` (`DEFAULT_VALIDATION_RULES` list) |
| Add a citation style | `backend/app/engines/citation_formatter.py` (add `_format_xxx` + `_format_authors_xxx`) |
| Add a journal export template | `templates/<publisher>/main.tex.j2` + `backend/seed_data/journal_templates_seed.py` |
| Change how section data is stored in DB | `backend/app/models/paper.py` (`PaperSection.content_json` schema docstring) |
| Modify the wizard step flow | `frontend/src/stores/paperStore.ts` (`SECTION_ORDER`, `SECTION_LABELS`) |
| Change the standalone/localStorage persistence | `frontend/src/stores/paperStore.ts` (`saveToStorage` / `loadFromStorage`) |

## Data Flow: User writes text → Export

```
StructuredSectionEditor (fieldValues)
  → paperStore.updateSectionContent() 
    → content_json._fieldValues updated
    → localStorage (standalone) or PUT /api/papers/{id}/sections/{name} (connected)
    
On export:
  → ExportService.export()
    → CitationFormatter.format_all()   # format references
    → NumberingEngine.assign_numbers() # auto-number figures/tables/equations
    → ASTBuilder.build()               # JSONB → DocumentAST
    → LaTeXCompiler.compile_to_pdf()   # AST → .tex → xelatex → .pdf
    → or DocxCompiler.compile()        # AST → python-docx → .docx
```

## Environment Notes

All dev tools are installed on this machine:
- Python 3.12.10: `C:\Users\Admin1\AppData\Local\Programs\Python\Python312\python.exe`
- Node.js v24.16.0
- MiKTeX 25.12: `C:\Users\Admin1\AppData\Local\Programs\MiKTeX\miktex\bin\x64\xelatex.exe`
- Docker Desktop 29.5.3
- Pandoc 3.10
- PATH additions may require a fresh terminal to take effect

The project is a local git repo at `D:\CodeProject\scipaper`. Remote: `https://github.com/yangxiwen123/scipaper`.
