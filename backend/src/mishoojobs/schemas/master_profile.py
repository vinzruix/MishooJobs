from pydantic import BaseModel, Field


class PersonalInfoSchema(BaseModel):
    full_name: str
    headline: str
    email: str
    phone: str
    location: str
    website: str | None = None
    github: str | None = None
    linkedin: str | None = None
    photo: bool = False


class CategorizedTechStackSchema(BaseModel):
    backend: list[str] = Field(default_factory=list)
    frontend: list[str] = Field(default_factory=list)
    databases: list[str] = Field(default_factory=list)
    messaging_distributed: list[str] = Field(default_factory=list)
    ai_data: list[str] = Field(default_factory=list)
    devops_cloud: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)


class LanguageItemSchema(BaseModel):
    language: str
    level: str


class ExperienceItemSchema(BaseModel):
    company: str
    role: str
    location: str | None = None
    start_date: str
    end_date: str
    current: bool = False
    highlights: list[str] = Field(default_factory=list)


class ProjectItemSchema(BaseModel):
    name: str
    description: str
    technologies: list[str] = Field(default_factory=list)
    link: str | None = None
    highlights: list[str] = Field(default_factory=list)


class EducationItemSchema(BaseModel):
    institution: str
    degree: str
    field: str
    start_date: str
    end_date: str
    gpa: str | None = None
    current: bool = False


class CertificateItemSchema(BaseModel):
    name: str
    issuer: str
    issue_date: str
    expiry_date: str | None = None
    credential_id: str | None = None
    url: str | None = None


class LogroAcademicoItemSchema(BaseModel):
    title: str
    organization: str
    date: str
    description: str


class MasterProfileSchema(BaseModel):
    personal_info: PersonalInfoSchema
    about_me: str
    tech: CategorizedTechStackSchema
    languages: list[LanguageItemSchema] = Field(default_factory=list)
    experience: list[ExperienceItemSchema] = Field(default_factory=list)
    projects: list[ProjectItemSchema] = Field(default_factory=list)
    education: list[EducationItemSchema] = Field(default_factory=list)
    certificates: list[CertificateItemSchema] = Field(default_factory=list)
    logros_academicos: list[LogroAcademicoItemSchema] = Field(default_factory=list)
