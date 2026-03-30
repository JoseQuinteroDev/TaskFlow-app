"""Backward-compatible ASGI entrypoint.

Use `app.main:app` for production deployments.
"""

from app.main import app
