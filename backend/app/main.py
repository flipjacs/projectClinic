from pathlib import Path

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import get_logger, setup_logging
from app.database.connection import get_db
from app.modules.auth.routes import router as auth_router
from app.modules.users.routes import router as users_router
from app.modules.patients.routes import router as patients_router
from app.modules.medical_records.routes import router as medical_records_router
from app.modules.appointments.routes import router as appointments_router
from app.modules.procedures.routes import router as procedures_router
from app.modules.finance.routes import router as finance_router
from app.modules.inventory.routes import router as inventory_router
from app.modules.reports.routes import router as reports_router
from app.modules.settings.routes import router as settings_router
from app.modules.settings.security_routes import router as security_settings_router
from app.modules.settings.appearance_routes import router as appearance_settings_router
from app.shared.exceptions import AppException
from app.shared.request_context import RequestContextMiddleware

logger = get_logger("app")


class SecureStaticFiles(StaticFiles):
    """StaticFiles com cabeçalhos que neutralizam conteúdo ativo.

    Mesmo que um SVG malicioso escapasse da validação de upload, ``sandbox`` +
    ``default-src 'none'`` impedem execução de script, e ``nosniff`` evita
    confusão de MIME. Os logos são consumidos via ``<img>``, que não executa
    scripts de SVG — isto é a segunda camada.
    """

    async def get_response(self, path, scope):  # noqa: ANN001
        response = await super().get_response(path, scope)
        response.headers["Content-Security-Policy"] = "default-src 'none'; sandbox"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response


def create_app() -> FastAPI:
    setup_logging("DEBUG" if settings.app_debug else "INFO")

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        debug=settings.app_debug,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
    )

    # Captura IP/User-Agent/request_id por request (audit + correlação de logs).
    app.add_middleware(RequestContextMiddleware)

    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.on_event("startup")
    async def _on_startup() -> None:
        logger.info(
            "Aplicação iniciada: app_env=%s debug=%s db_driver=%s",
            settings.app_env,
            settings.app_debug,
            settings.db_driver,
        )

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        # Exceções de domínio carregam mensagens seguras (sem stack trace).
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        # Erro inesperado: loga o detalhe no servidor (com request_id) e devolve
        # uma mensagem genérica — NUNCA expõe stack trace ao cliente.
        logger.exception("Erro inesperado em %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Erro interno do servidor"},
        )

    @app.get("/", tags=["health"])
    async def root() -> dict:
        return {
            "name": settings.app_name,
            "version": app.version,
            "status": "ok",
        }

    @app.get("/health", tags=["health"])
    async def health() -> dict:
        """Liveness: a aplicação está de pé (não toca o banco)."""
        return {"status": "ok"}

    @app.get("/ready", tags=["health"])
    def ready(db: Session = Depends(get_db)) -> JSONResponse:
        """Readiness: verifica conectividade com o banco de forma leve."""
        try:
            db.execute(text("SELECT 1"))
        except Exception:  # noqa: BLE001
            logger.warning("Readiness check falhou: banco indisponível")
            return JSONResponse(
                status_code=503,
                content={"status": "unavailable", "database": "down"},
            )
        return JSONResponse(status_code=200, content={"status": "ready", "database": "up"})

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
    app.include_router(settings_router, prefix=api_prefix)
    app.include_router(security_settings_router, prefix=api_prefix)
    app.include_router(appearance_settings_router, prefix=api_prefix)

    # Arquivos enviados (logos da clínica). Servidos como estáticos; o banco
    # guarda apenas o caminho relativo, nunca o binário. Cabeçalhos de defesa
    # em profundidade impedem execução de conteúdo ativo (ex.: SVG com script).
    media_root = Path(settings.media_dir)
    media_root.mkdir(parents=True, exist_ok=True)
    app.mount(
        settings.media_url_path,
        SecureStaticFiles(directory=str(media_root)),
        name="media",
    )

    return app


app = create_app()
