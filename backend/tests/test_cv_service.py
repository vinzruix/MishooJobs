import io
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import yaml
from fastapi.testclient import TestClient
from pypdf import PdfWriter

from mishoojobs.api.main import app
from mishoojobs.schemas.master_profile import MasterProfileSchema
from mishoojobs.services.agy_ai_client import AgyAIClient

FIXTURES_DIR = Path(__file__).parent / "fixtures"

client = TestClient(app)


@pytest.fixture
def sample_master_profile_yaml() -> str:
    with open(FIXTURES_DIR / "sample_master_profile.yml", "r", encoding="utf-8") as f:
        return f.read()


@pytest.fixture
def sample_resume_md() -> str:
    with open(FIXTURES_DIR / "sample_resume.md", "r", encoding="utf-8") as f:
        return f.read()


@pytest.fixture
def sample_master_profile_dict(sample_master_profile_yaml: str) -> dict:
    return yaml.safe_load(sample_master_profile_yaml)


def create_minimal_pdf_bytes(text: str = "Santiago Mendoza Ruiz - Desarrollador Backend Junior") -> bytes:
    """Helper to create minimal valid PDF bytes for testing."""
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    # We can write minimal metadata or mock PdfReader text extraction
    stream = io.BytesIO()
    writer.write(stream)
    return stream.getvalue()


@pytest.mark.asyncio
async def test_agy_ai_client_parse_resume_to_yaml(sample_master_profile_dict: dict):
    """Test AgyAIClient.parse_resume_to_yaml structuring raw text into canonical YAML."""
    ai_client = AgyAIClient()
    mock_response = {
        "response": sample_master_profile_dict
    }

    with patch.object(ai_client, "_run_cli_subprocess", new_callable=AsyncMock) as mock_run:
        mock_run.return_value = (f"```json\n{yaml.dump(sample_master_profile_dict)}\n```", "")
        # Or mock json response
        import json
        mock_run.return_value = (json.dumps(mock_response), "")

        yaml_out, warnings = await ai_client.parse_resume_to_yaml("Curriculum Vitae de Santiago Mendoza...")
        assert isinstance(yaml_out, str)
        assert "Santiago Mendoza Ruiz" in yaml_out
        assert "personal_info:" in yaml_out

        parsed = yaml.safe_load(yaml_out)
        validated = MasterProfileSchema.model_validate(parsed)
        assert validated.personal_info.full_name == "Santiago Mendoza Ruiz"
        assert len(validated.tech.backend) > 0


def test_parse_resume_endpoint_markdown_file(sample_resume_md: str, sample_master_profile_dict: dict):
    """Test POST /cv/parse-resume with Markdown file upload."""
    with patch.object(AgyAIClient, "parse_resume_to_yaml", new_callable=AsyncMock) as mock_parse:
        mock_parse.return_value = (yaml.dump(sample_master_profile_dict, sort_keys=False), [])

        response = client.post(
            "/cv/parse-resume",
            files={"file": ("resume.md", sample_resume_md.encode("utf-8"), "text/markdown")},
        )
        assert response.status_code == 200
        data = response.json()
        assert "yaml_content" in data
        assert "warnings" in data
        assert "Santiago Mendoza Ruiz" in data["yaml_content"]


def test_parse_resume_endpoint_yaml_file(sample_master_profile_yaml: str):
    """Test POST /cv/parse-resume with direct valid YAML upload."""
    response = client.post(
        "/cv/parse-resume",
        files={"file": ("profile.yml", sample_master_profile_yaml.encode("utf-8"), "application/x-yaml")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "yaml_content" in data
    assert "Santiago Mendoza Ruiz" in data["yaml_content"]


def test_parse_resume_endpoint_pdf_file(sample_master_profile_dict: dict):
    """Test POST /cv/parse-resume with PDF file upload."""
    pdf_bytes = create_minimal_pdf_bytes()

    with patch("pypdf.PdfReader") as mock_pdf_reader:
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "Santiago Mendoza Ruiz - Desarrollador Backend Junior"
        mock_reader_instance = mock_pdf_reader.return_value
        mock_reader_instance.pages = [mock_page]

        with patch.object(AgyAIClient, "parse_resume_to_yaml", new_callable=AsyncMock) as mock_parse:
            mock_parse.return_value = (yaml.dump(sample_master_profile_dict, sort_keys=False), [])

            response = client.post(
                "/cv/parse-resume",
                files={"file": ("resume.pdf", pdf_bytes, "application/pdf")},
            )
            assert response.status_code == 200
            data = response.json()
            assert "yaml_content" in data


def test_parse_resume_endpoint_unsupported_file_format():
    """Test POST /cv/parse-resume rejects unsupported file formats."""
    response = client.post(
        "/cv/parse-resume",
        files={"file": ("resume.docx", b"PK...", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert response.status_code == 400
    assert "Formato de archivo no soportado" in response.json()["detail"]


def test_parse_resume_endpoint_timeout():
    """Test POST /cv/parse-resume returns 504 on agy CLI timeout."""
    with patch.object(AgyAIClient, "parse_resume_to_yaml", new_callable=AsyncMock) as mock_parse:
        mock_parse.side_effect = TimeoutError("agy CLI timed out")

        response = client.post(
            "/cv/parse-resume",
            files={"file": ("resume.md", b"# Santiago Mendoza - CV completo de prueba", "text/markdown")},
        )
        assert response.status_code == 504


def test_generate_tailored_cv_success(sample_master_profile_dict: dict):
    """Test POST /cv/generate-tailored returns valid single-page CV response."""
    mock_cv_content = {
        "header": {
            "full_name": "Santiago Mendoza Ruiz",
            "headline": "Desarrollador Backend Junior",
            "email": "santiago@ejemplo.com",
            "phone": "+52 55 1234 5678",
            "location": "Ciudad de México",
            "links": [{"label": "GitHub", "url": "https://github.com/smendoza"}],
            "about_me": "Desarrollador enfocado en Python y APIs REST.",
        },
        "skills_categorized": {
            "Backend": ["Python", "FastAPI"],
            "Bases de Datos": ["PostgreSQL"],
        },
        "languages": [{"language": "Español", "level": "Nativo"}],
        "experience": [
            {
                "company": "FinTech Soluciones MX",
                "role": "Becario Backend",
                "period": "Ene 2024 - Presente",
                "highlights": ["Implementé 6 endpoints REST reduciendo latencia."],
            }
        ],
        "projects": [
            {
                "name": "MishooJobs Core",
                "description": "Agregador de empleo",
                "technologies": ["Python", "FastAPI"],
                "highlights": ["Desarrollé scrapers en tiempo real."],
            }
        ],
        "education": [
            {
                "institution": "UNAM",
                "degree": "Ingeniería en Computación",
                "period": "2021 - 2025",
            }
        ],
        "certificates": [{"name": "AWS CCP", "issuer": "AWS", "date": "2024"}],
        "logros_academicos": [{"title": "Hackathon 1er Lugar", "organization": "Tec", "date": "2023", "description": "Fintech"}],
    }

    with patch.object(AgyAIClient, "generate_tailored_cv", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = {
            "content": mock_cv_content,
            "ats_match_score": 92,
            "word_count": 280,
            "curation_notes": "Seleccionadas experiencias de Python y FastAPI.",
        }

        payload = {
            "master_profile": sample_master_profile_dict,
            "vacancy_title": "Desarrollador Backend Junior",
            "vacancy_company": "Mercado Libre",
            "job_description": "Buscamos desarrollador Python con FastAPI y PostgreSQL.",
            "desired_skills": ["Python", "FastAPI", "PostgreSQL"],
            "language": "es",
        }

        response = client.post("/cv/generate-tailored", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["ats_match_score"] == 92
        assert data["word_count"] <= 500
        assert data["content"]["header"]["full_name"] == "Santiago Mendoza Ruiz"


def test_generate_tailored_cv_incomplete_profile_raises_422():
    """Test POST /cv/generate-tailored rejects incomplete profiles (<1 experience/project or <2 skills)."""
    incomplete_profile_no_exp = {
        "personal_info": {"full_name": "Test", "headline": "Dev", "email": "a@b.com", "phone": "123", "location": "MX", "photo": False},
        "about_me": "Bio",
        "tech": {"backend": ["Python", "Django"]},
        "languages": [],
        "experience": [],
        "projects": [],
        "education": [],
        "certificates": [],
        "logros_academicos": [],
    }

    payload = {
        "master_profile": incomplete_profile_no_exp,
        "vacancy_title": "Junior Dev",
        "vacancy_company": "Co",
        "job_description": "Python dev",
    }
    response = client.post("/cv/generate-tailored", json=payload)
    assert response.status_code == 422
    assert "experiencia" in response.json()["detail"].lower()

    incomplete_profile_no_skills = {
        "personal_info": {"full_name": "Test", "headline": "Dev", "email": "a@b.com", "phone": "123", "location": "MX", "photo": False},
        "about_me": "Bio",
        "tech": {"backend": ["Python"]},
        "languages": [],
        "experience": [{"company": "A", "role": "Dev", "start_date": "2024", "end_date": "2024", "current": False, "highlights": ["h1"]}],
        "projects": [],
        "education": [],
        "certificates": [],
        "logros_academicos": [],
    }
    payload2 = {
        "master_profile": incomplete_profile_no_skills,
        "vacancy_title": "Junior Dev",
        "vacancy_company": "Co",
        "job_description": "Python dev",
    }
    response2 = client.post("/cv/generate-tailored", json=payload2)
    assert response2.status_code == 422
    assert "habilidades" in response2.json()["detail"].lower()


def test_generate_role_cv_success(sample_master_profile_dict: dict):
    """Test POST /cv/generate-role returns valid role archetype CV response."""
    mock_cv_content = {
        "header": {
            "full_name": "Santiago Mendoza Ruiz",
            "headline": "AI Engineer",
            "email": "santiago@ejemplo.com",
            "phone": "+52 55 1234 5678",
            "location": "Ciudad de México",
            "links": [{"label": "GitHub", "url": "https://github.com/smendoza"}],
            "about_me": "Desarrollador enfocado en Python, IA y datos.",
        },
        "skills_categorized": {
            "AI / Data": ["Pandas", "PyTorch"],
            "Backend": ["Python", "FastAPI"],
        },
        "languages": [{"language": "Español", "level": "Nativo"}],
        "experience": [
            {
                "company": "FinTech Soluciones MX",
                "role": "Becario Backend",
                "period": "Ene 2024 - Presente",
                "highlights": ["Construí modelos y APIs."],
            }
        ],
        "projects": [
            {
                "name": "MishooJobs Core",
                "description": "Agregador con IA",
                "technologies": ["Python", "FastAPI"],
                "highlights": ["Pipeline de datos."],
            }
        ],
        "education": [
            {
                "institution": "UNAM",
                "degree": "Ingeniería en Computación",
                "period": "2021 - 2025",
            }
        ],
        "certificates": [],
        "logros_academicos": [],
    }

    with patch.object(AgyAIClient, "generate_role_cv", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = {
            "content": mock_cv_content,
            "ats_match_score": 90,
            "word_count": 220,
            "curation_notes": "Priorizadas tecnologías de Python e IA.",
        }

        payload = {
            "master_profile": sample_master_profile_dict,
            "target_role_title": "AI Engineer",
            "focus_tags": ["Python", "PyTorch", "Pandas"],
            "language": "es",
        }

        response = client.post("/cv/generate-role", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["ats_match_score"] == 90
        assert data["word_count"] <= 500
        assert data["content"]["header"]["headline"] == "AI Engineer"


def test_generate_role_cv_incomplete_profile_raises_422():
    """Test POST /cv/generate-role rejects incomplete profiles."""
    incomplete_profile = {
        "personal_info": {"full_name": "Test", "headline": "Dev", "email": "a@b.com", "phone": "123", "location": "MX", "photo": False},
        "about_me": "Bio",
        "tech": {"backend": ["Python"]},
        "languages": [],
        "experience": [],
        "projects": [],
        "education": [],
        "certificates": [],
        "logros_academicos": [],
    }

    payload = {
        "master_profile": incomplete_profile,
        "target_role_title": "Frontend Developer",
    }
    response = client.post("/cv/generate-role", json=payload)
    assert response.status_code == 422
