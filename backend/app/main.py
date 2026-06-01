from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.modules.auth.routes import router as auth_router
from app.modules.users.routes import router as users_router
from app.modules.patients.routes import router as patients_router
from app.modules.medical_records.routes import router as medical_records_router
from app.modules.appointments.routes import router as appointments_router
from app.modules.procedures.routes import router as procedures_router
from app.modules.finance.routes import router as finance_router
from app.modules.inventory.routes import router as inventory_router
from app.modules.reports.routes import router as reports_router
from app.shared.exceptions import AppException


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        debug=settings.app_debug,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
    )

    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

    @app.get("/", tags=["health"])
    async def root() -> dict:
        return {
            "name": settings.app_name,
            "version": app.version,
            "status": "ok",
        }

    @app.get("/health", tags=["health"])
    async def health() -> dict:
        return {"status": "ok"}

    api_prefix = settings.api_v1_prefix
    app.include_router(auth_router, prefix=api_prefix)
    app.include_router(users_router, prefix=api_prefix)
    app.include_router(patients_router, prefix=api_prefix)
    app.include_router(medical_records_router, prefix=api_prefix)
    app.include_router(appointments_router, prefix=api_prefix)
    app.include_router(procedures_router, prefix=api_prefix)
    app.include_router(finance_router, prefix=api_prefix)
    app.include_router(inventory_router, prefix=api_prefix)
    app.include_router(reports_router, prefix=api_prefix)

    return app


app = create_app()
