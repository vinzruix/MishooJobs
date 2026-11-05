import shutil
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "MishooJobs API"
    app_version: str = "0.1.0"
    environment: str = Field(default="development", description="Runtime environment")
    
    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://localhost:5432/mishoojobs_db",
        description="Async SQLAlchemy database URL",
    )
    
    # CORS
    cors_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"],
        description="Allowed CORS origins",
    )
    
    # Antigravity CLI
    agy_cli_path: str = Field(
        default_factory=lambda: shutil.which("agy") or "/Users/yairtejedahotmail.com/.local/bin/agy",
        description="Path to local agy CLI binary",
    )
    agy_timeout_seconds: float = Field(default=8.0, description="Max execution time for agy CLI evaluation")
    
    # Scrapers & Verifiers
    scraper_timeout_seconds: float = Field(default=8.0, description="Per-portal scraper timeout")
    verifier_timeout_seconds: float = Field(default=2.5, description="Per-link verification timeout")
    verifier_concurrency: int = Field(default=15, description="Max concurrent in-flight HTTP HEAD checks")
    max_vacancies_per_portal: int = Field(default=15, description="Upper bound of vacancies fetched per portal")

settings = Settings()
