from __future__ import annotations

import re
import secrets
from pathlib import Path
from typing import Final

from app.core.config import settings
from app.shared.exceptions import ValidationError

# Padrões de conteúdo ativo perigoso em SVG (XSS). Rejeitamos no upload; a
# defesa em profundidade fica no serving (CSP sandbox + nosniff em /media).
_SVG_DANGEROUS: Final[list[re.Pattern[bytes]]] = [
    re.compile(rb"<script", re.IGNORECASE),
    re.compile(rb"<foreignObject", re.IGNORECASE),
    re.compile(rb"<!ENTITY", re.IGNORECASE),          # XXE / entity expansion
    re.compile(rb"on\w+\s*=", re.IGNORECASE),          # onload=, onclick=, ...
    re.compile(rb"javascript:", re.IGNORECASE),
    re.compile(rb"(xlink:)?href\s*=\s*[\"']?\s*(javascript|data):", re.IGNORECASE),
]

# MIME permitidos e a extensão canônica de cada um.
_ALLOWED: Final[dict[str, str]] = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
}

# Assinaturas (magic bytes) para conferência de conteúdo — não confiar só no
# Content-Type declarado pelo cliente.
_MAGIC: Final[list[tuple[bytes, str]]] = [
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"\xff\xd8\xff", "image/jpeg"),
]

_CLINIC_SUBDIR: Final[str] = "clinic"


def _media_root() -> Path:
    root = Path(settings.media_dir)
    (root / _CLINIC_SUBDIR).mkdir(parents=True, exist_ok=True)
    return root


def _sniff_matches(content: bytes, declared: str) -> bool:
    """Confere o conteúdo real contra o tipo declarado.

    PNG/JPEG têm assinatura estável. WebP começa com ``RIFF....WEBP``. SVG é
    texto: exigimos que contenha ``<svg``. Falha fechada em divergência.
    """
    if declared == "image/webp":
        return content[:4] == b"RIFF" and content[8:12] == b"WEBP"
    if declared == "image/svg+xml":
        head = content[:1024].lstrip().lower()
        return b"<svg" in head or head.startswith(b"<?xml")
    for signature, mime in _MAGIC:
        if content.startswith(signature):
            return mime == declared
    return False


def _svg_is_safe(content: bytes) -> bool:
    """Rejeita SVGs com conteúdo ativo (script, handlers, javascript:, XXE)."""
    return not any(pattern.search(content) for pattern in _SVG_DANGEROUS)


def save_logo(content: bytes, content_type: str) -> str:
    """Valida e grava um logo, devolvendo o **caminho relativo** salvo.

    Regras: tipo permitido (por Content-Type e por magic bytes), tamanho
    máximo, nome aleatório (nunca sobrescreve). Nunca grava blob no banco.
    """
    mime = (content_type or "").split(";")[0].strip().lower()
    if mime not in _ALLOWED:
        raise ValidationError("Formato inválido. Use PNG, JPG, WebP ou SVG.")
    if not content:
        raise ValidationError("Arquivo vazio.")
    if len(content) > settings.max_logo_bytes:
        raise ValidationError("A imagem deve ter no máximo 2 MB.")
    if not _sniff_matches(content, mime):
        raise ValidationError("O conteúdo do arquivo não corresponde ao formato informado.")
    if mime == "image/svg+xml" and not _svg_is_safe(content):
        raise ValidationError(
            "SVG com conteúdo ativo não é permitido. Envie um SVG sem scripts."
        )

    ext = _ALLOWED[mime]
    filename = f"{secrets.token_hex(16)}{ext}"
    rel_path = f"{_CLINIC_SUBDIR}/{filename}"
    dest = _media_root() / rel_path
    # Nome aleatório de 32 hex torna colisão desprezível; ainda assim, nunca
    # sobrescreve um arquivo existente.
    if dest.exists():  # pragma: no cover - praticamente inatingível
        raise ValidationError("Falha ao gerar nome de arquivo. Tente novamente.")
    dest.write_bytes(content)
    return rel_path


def delete_logo(rel_path: str | None) -> None:
    """Remove um arquivo de logo com segurança (dentro do diretório de mídia)."""
    if not rel_path:
        return
    root = _media_root().resolve()
    target = (root / rel_path).resolve()
    # Defesa contra path traversal: só remove dentro da raiz de mídia.
    if root not in target.parents:
        return
    target.unlink(missing_ok=True)
