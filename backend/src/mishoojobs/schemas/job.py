from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

class DatabaseStatus(str, Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"

class AgyCliStatus(str, Enum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"

class HealthStatusResponse(BaseModel):
    status: str = Field(default="ok", example="ok")
    database: DatabaseStatus = Field(default=DatabaseStatus.CONNECTED)
    agy_cli: AgyCliStatus = Field(default=AgyCliStatus.AVAILABLE)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ErrorResponse(BaseModel):
    error: str = Field(..., description="High-level error code or summary")
    message: str = Field(..., description="Human-readable error details")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Optional diagnostic details")

class PortalName(str, Enum):
    COMPUTRABAJO = "computrabajo"
    INDEED = "indeed"
    OCC = "occ"

class PortalScraperStatus(str, Enum):
    SEARCHING = "searching"
    COMPLETED = "completed"
    TIMEOUT = "timeout"
    BLOCKED = "blocked"
    ERROR = "error"

class PortalStatusEvent(BaseModel):
    portal: PortalName
    status: PortalScraperStatus
    count: int = Field(default=0, ge=0)
    message: Optional[str] = None
    duration_ms: Optional[int] = 0

class ModalityEnum(str, Enum):
    ALL = "all"
    REMOTO = "remoto"
    HIBRIDO = "hibrido"
    PRESENCIAL = "presencial"

class CategoryEnum(str, Enum):
    ALL = "all"
    BECARIO = "becario"
    PRACTICAS = "practicas"
    RESIDENCIAS = "residencias"
    SERVICIO_SOCIAL = "servicio_social"
    DUALIDAD = "dualidad"
    TRAINEE = "trainee"
    JUNIOR = "junior"

class SalaryPeriodEnum(str, Enum):
    SEMANAL = "semanal"
    QUINCENAL = "quincenal"
    MENSUAL = "mensual"
    ANUAL = "anual"

class MexicanStateEnum(str, Enum):
    CDMX = "CDMX"
    JAL = "JAL"
    NL = "NL"
    EDO_MEX = "EDO_MEX"
    PUE = "PUE"
    QRO = "QRO"
    GTO = "GTO"
    YUC = "YUC"
    COAH = "COAH"
    CHIH = "CHIH"
    BC = "BC"
    BCS = "BCS"
    SON = "SON"
    SIN = "SIN"
    NAY = "NAY"
    COL = "COL"
    MICH = "MICH"
    GRO = "GRO"
    OAX = "OAX"
    CHIS = "CHIS"
    VER = "VER"
    TAB = "TAB"
    CAMP = "CAMP"
    QR = "QR"
    TLAX = "TLAX"
    MOR = "MOR"
    HGO = "HGO"
    SLP = "SLP"
    ZAC = "ZAC"
    AGS = "AGS"
    DGO = "DGO"
    TAMP = "TAMP"
    REMOTO = "REMOTO"
    MEXICO = "MEXICO"

class ExternalLinkDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    portal_name: PortalName
    direct_url: str
    is_active: bool = True
    http_status_code: Optional[int] = Field(default=200, lt=400)
    verified_at: Optional[datetime] = None

from mishoojobs.schemas.scam import RiskLevelEnum, ScamReportResponse

class VacancyDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    fingerprint: str = Field(..., pattern=r"^[a-f0-9]{16,64}$")
    title: str = Field(..., max_length=255)
    company_name: str = Field(..., max_length=255)
    location_city: Optional[str] = Field(default=None, max_length=100)
    location_state: str = Field(..., max_length=50)
    modality: str = Field(default="presencial")
    category: str = Field(default="junior")
    salary_min: Optional[float] = Field(default=None, ge=0)
    salary_max: Optional[float] = Field(default=None, ge=0)
    salary_period: Optional[SalaryPeriodEnum] = None
    currency: str = Field(default="MXN")
    description: str = Field(..., alias="description_clean")
    skills: List[str] = Field(default_factory=list, alias="skills_extracted")
    published_at: Optional[datetime] = Field(
        default=None,
        description="Original publication timestamp in UTC. Null if unparseable or missing from portal."
    )
    external_links: List[ExternalLinkDTO] = Field(default_factory=list)
    scam_report: Optional[ScamReportResponse] = None
    heuristic_fit_score: Optional[int] = Field(default=None, ge=0, le=100)
    first_discovered_at: Optional[datetime] = None
    last_verified_at: Optional[datetime] = None

    @field_validator("currency")
    @classmethod
    def enforce_mxn(cls, v: str) -> str:
        if v.upper() != "MXN":
            raise ValueError("MishooJobs strictly requires MXN currency per Constitution Principle II")
        return "MXN"

class SearchParams(BaseModel):
    query: str = Field(..., min_length=2, max_length=100)
    location: Optional[str] = Field(default="México")
    modality: ModalityEnum = Field(default=ModalityEnum.ALL)
    category: CategoryEnum = Field(default=CategoryEnum.ALL)
    limit_per_portal: int = Field(default=15, ge=1, le=15)
