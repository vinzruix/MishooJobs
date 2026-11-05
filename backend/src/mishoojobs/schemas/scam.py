from enum import Enum
from typing import List
from pydantic import BaseModel, ConfigDict, Field

class RiskLevelEnum(str, Enum):
    SAFE = "safe"
    WARNING = "warning"
    CRITICAL = "critical"

class ScamCategoryEnum(str, Enum):
    MLM_SCHEME = "MLM_SCHEME"
    CANDIDATE_FEE = "CANDIDATE_FEE"
    COMMISSION_ONLY = "COMMISSION_ONLY"
    UNPAID_LABOR = "UNPAID_LABOR"
    FOREIGN_VISA_RESTRICTION = "FOREIGN_VISA_RESTRICTION"

class ScamReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    risk_level: RiskLevelEnum = Field(..., description="Classification level: safe, warning, or critical")
    risk_categories: List[str] = Field(default_factory=list, description="Triggered scam violation categories")
    matched_indicators: List[str] = Field(default_factory=list, description="Specific matching phrases detected")
    badge_label: str = Field(..., description="High-contrast display badge in Mexican Spanish")
    explanation: str = Field(..., description="Plain-language educational context for early-career candidates")
