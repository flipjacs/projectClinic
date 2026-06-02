"""Contexto de request acessível fora dos handlers (para o audit log).

Em vez de propagar ``Request`` por toda a cadeia service → repository, expomos
o IP de origem e o User-Agent via ``ContextVar`` populada por um middleware.
Assim o ``AuditLogService`` consegue enriquecer cada registro sem que cada rota
precise repassar esses dados manualmente.

A ``ContextVar`` é segura para concorrência: cada request (inclusive sob
``asyncio``) enxerga seu próprio valor.
"""
from __future__ import annotations

import uuid
from contextvars import ContextVar
from dataclasses import dataclass
from typing import Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.types import ASGIApp

from app.core.logging import request_id_var


@dataclass(frozen=True)
class RequestInfo:
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_id: Optional[str] = None


_request_info: ContextVar[RequestInfo] = ContextVar(
    "request_info", default=RequestInfo()
)


def get_request_info() -> RequestInfo:
    return _request_info.get()


def set_request_info(info: RequestInfo):
    return _request_info.set(info)


def reset_request_info(token) -> None:
    _request_info.reset(token)


def _client_ip(request: Request) -> Optional[str]:
    # Respeita proxies comuns sem confiar cegamente: pega o primeiro IP da
    # cadeia X-Forwarded-For quando presente, senão o peer direto.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Popula a ContextVar com IP/User-Agent no início de cada request."""

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        # Reusa um X-Request-ID vindo de um proxy/gateway, ou gera um novo.
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
        info = RequestInfo(
            ip_address=_client_ip(request),
            user_agent=request.headers.get("user-agent"),
            request_id=request_id,
        )
        token = set_request_info(info)
        log_token = request_id_var.set(request_id)
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            reset_request_info(token)
            request_id_var.reset(log_token)
