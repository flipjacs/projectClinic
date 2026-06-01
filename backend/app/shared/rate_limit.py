from __future__ import annotations

from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, status


class FixedWindowRateLimiter:
    """Rate limiter simples por processo.

    É suficiente para proteger o ambiente atual e os testes locais. Em produção
    com múltiplas réplicas, substitua por backend compartilhado como Redis.
    """

    def __init__(self, *, max_attempts: int, window_seconds: int) -> None:
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._attempts: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def _prune(self, key: str, now: float) -> deque[float]:
        attempts = self._attempts[key]
        cutoff = now - self.window_seconds
        while attempts and attempts[0] <= cutoff:
            attempts.popleft()
        return attempts

    def check(self, key: str) -> None:
        now = monotonic()
        with self._lock:
            attempts = self._prune(key, now)
            if len(attempts) >= self.max_attempts:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Muitas tentativas de login. Tente novamente mais tarde.",
                )

    def register_failure(self, key: str) -> None:
        now = monotonic()
        with self._lock:
            attempts = self._prune(key, now)
            attempts.append(now)

    def reset(self, key: str) -> None:
        with self._lock:
            self._attempts.pop(key, None)
