from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from mishoojobs.api.routes.health import router as health_router
from mishoojobs.api.routes.jobs import router as jobs_router
from mishoojobs.api.routes.vacancies import router as vacancies_router
from mishoojobs.config import settings
from mishoojobs.schemas.job import ErrorResponse

def create_app() -> FastAPI:
    """Factory function for creating the FastAPI application instance."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="MishooJobs - Real-Time Mexican Junior Job Discovery & Verification Platform",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Security & XSS protection middleware
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    # Global Exception Handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error="InternalServerError",
                message=str(exc) if settings.environment != "production" else "Ha ocurrido un error interno.",
            ).model_dump(),
        )

    # Include Routes
    app.include_router(health_router, prefix="/api/v1")
    app.include_router(jobs_router, prefix="/api/v1")
    app.include_router(vacancies_router, prefix="/api/v1")

    return app

app = create_app()
