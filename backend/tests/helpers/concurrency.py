"""Helpers to drive *real* concurrent transactions in tests.

These are only meaningful against MySQL (InnoDB row locks); on SQLite
``SELECT ... FOR UPDATE`` is a no-op, so the tests that use them are marked
``mysql_only`` and skipped by default.

Each worker gets its **own Session** (hence its own DB connection/transaction)
and they are released simultaneously through a ``threading.Barrier`` to maximise
contention on the locked row.
"""
from __future__ import annotations

import threading
from typing import Any, Callable

from sqlalchemy.orm import Session


def run_concurrently(
    *,
    session_factory: Callable[[], Session],
    worker: Callable[[Session], Any],
    n_threads: int,
    timeout: float = 30.0,
) -> list[Any]:
    """Run ``worker(session)`` in ``n_threads`` threads at the same instant.

    Returns a list with each worker's return value, or the exception instance it
    raised (so callers can assert on both successes and failures).
    """
    barrier = threading.Barrier(n_threads)
    results: list[Any] = [None] * n_threads

    def _runner(index: int) -> None:
        session = session_factory()
        try:
            barrier.wait(timeout=timeout)
            results[index] = worker(session)
        except Exception as exc:  # noqa: BLE001 - we want to inspect failures
            results[index] = exc
        finally:
            session.close()

    threads = [threading.Thread(target=_runner, args=(i,)) for i in range(n_threads)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=timeout)

    return results
