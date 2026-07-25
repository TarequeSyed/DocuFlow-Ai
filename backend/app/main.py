from typing import Any

from fastapi import FastAPI, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.demo import router as demo_router
from app.api.v1.documents import router as documents_router
from app.api.v1.extractions import router as extractions_router
from app.api.v1.graph import router as graph_router
from app.api.v1.reconciliation import router as reconciliation_router
from app.api.v1.schemas import router as schemas_router
from app.api.v1.search import router as search_router
from app.api.v1.timeline import router as timeline_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.logging import get_logger, setup_logging
from app.providers.embeddings.factory import EmbeddingProviderFactory

# Trigger structured logging setup
setup_logging()
logger = get_logger("docuflow-backend")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="An AI-powered Document Intelligence Platform API",
    version="1.0.0",
)

app.include_router(documents_router, prefix="/api/v1")
app.include_router(schemas_router, prefix="/api/v1")
app.include_router(extractions_router, prefix="/api/v1")
app.include_router(graph_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(reconciliation_router, prefix="/api/v1")
app.include_router(timeline_router, prefix="/api/v1")
app.include_router(demo_router, prefix="/api/v1")

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Any, exc: RequestValidationError
) -> JSONResponse:
    """
    Format FastAPI validation errors into standard API.md envelope.
    """
    details = []
    for error in exc.errors():
        details.append(
            {
                "loc": list(error.get("loc", [])),
                "msg": error.get("msg", ""),
                "type": error.get("type", ""),
            }
        )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed for target properties.",
                "details": details,
            }
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Any, exc: StarletteHTTPException
) -> JSONResponse:
    """
    Format standard HTTPExceptions into standard API.md envelope.
    """
    code = "HTTP_ERROR"
    if exc.status_code == status.HTTP_404_NOT_FOUND:
        code = "NOT_FOUND"
    elif exc.status_code == status.HTTP_403_FORBIDDEN:
        code = "FORBIDDEN"
    elif exc.status_code == status.HTTP_401_UNAUTHORIZED:
        code = "UNAUTHORIZED"
    elif exc.status_code == status.HTTP_400_BAD_REQUEST:
        code = "BAD_REQUEST"

    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": code, "message": str(exc.detail), "details": []}},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Any, exc: Exception) -> JSONResponse:
    """
    Fallback general exception handler to avoid exposing raw stack traces.
    """
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred on the server.",
                "details": [],
            }
        },
    )


@app.on_event("startup")
async def startup_event() -> None:
    """
    Triggers on backend launch. Validates configuration, checks DB pools
    connectivity, and verifies that the embedding provider loads successfully.
    """
    logger.info("Verifying system configuration...")

    # 1. Verify embedding provider initialization
    try:
        provider = EmbeddingProviderFactory.get_provider()
        logger.info(
            f"Embedding Provider loaded successfully: {provider.__class__.__name__}"
        )
    except Exception as e:
        logger.critical(f"Failed to load embedding provider: {e}", exc_info=True)
        raise e

    # 2. Verify database connectivity
    logger.info("Verifying database connection pool...")
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        logger.info("Database connection verified successfully.")
    except Exception as e:
        logger.critical(f"Database connection pool check failed: {e}", exc_info=True)
        raise e


@app.get("/", tags=["General"])
async def read_root() -> dict[str, str]:
    """
    Branding and welcome index route.
    """
    logger.info("Welcome route accessed.")
    return {
        "project": settings.PROJECT_NAME,
        "description": "An AI-powered Document Intelligence Platform",
        "status": "online",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health", tags=["General"])
async def health_check() -> dict[str, Any]:
    """
    Detailed health check querying database connection status.
    """
    logger.info("Health check endpoint queried.")

    # Check DB status
    db_status = "connected"
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Health check DB probe failed: {e}")
        db_status = f"failed: {e}"

    try:
        provider = EmbeddingProviderFactory.get_provider()
        provider_name = provider.__class__.__name__
    except Exception as e:
        provider_name = f"ERROR: {e}"

    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "services": {"api": "healthy", "database": db_status},
        "embeddings": {
            "active_provider": settings.EMBEDDING_PROVIDER,
            "provider_class": provider_name,
            "model_name": (
                settings.FASTEMBED_MODEL
                if settings.EMBEDDING_PROVIDER == "fastembed"
                else settings.OPENAI_EMBEDDING_MODEL
            ),
        },
    }
