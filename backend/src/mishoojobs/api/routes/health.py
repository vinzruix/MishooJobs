import os
import shutil
from datetime import datetime, timezone
from fastapi import APIRouter
from sqlalchemy import text

from mishoojobs.config import settings
from mishoojobs.database import engine
from mishoojobs.schemas.job import AgyCliStatus, DatabaseStatus, HealthStatusResponse

router = APIRouter(prefix="", tags=["Health"])

@router.get("/health", response_model=HealthStatusResponse)
async def get_health_status() -> HealthStatusResponse:
    """Returns service health status, validating database connectivity and agy CLI availability."""
    db_status = DatabaseStatus.CONNECTED
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_status = DatabaseStatus.DISCONNECTED

    agy_status = AgyCliStatus.UNAVAILABLE
    cli_path = settings.agy_cli_path
    if shutil.which(cli_path) or (os.path.exists(cli_path) and os.access(cli_path, os.X_OK)):
        agy_status = AgyCliStatus.AVAILABLE

    overall = "ok" if db_status == DatabaseStatus.CONNECTED else "degraded"

    return HealthStatusResponse(
        status=overall,
        database=db_status,
        agy_cli=agy_status,
        timestamp=datetime.now(timezone.utc),
    )
