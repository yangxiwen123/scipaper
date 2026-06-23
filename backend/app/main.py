"""
SCI Writer — FastAPI Application Entry Point.
A wizard-based SCI paper writing assistant with phrasebank and auto-formatting.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db

# Import API routers
from app.api.papers import router as papers_router
from app.api.phrasebank import router as phrasebank_router
from app.api.references import router as references_router
from app.api.export import router as export_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown events."""
    # Startup: initialize database tables
    await init_db()
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="SCI论文写作辅助系统 — 引导式写作 + 句型库 + 自动排版",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(papers_router)
app.include_router(phrasebank_router)
app.include_router(references_router)
app.include_router(export_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}
