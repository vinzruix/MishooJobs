from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from mishoojobs.services.scrapers.base import AbstractBaseScraper
from mishoojobs.services.scrapers.computrabajo import ComputrabajoScraper
from mishoojobs.services.scrapers.indeed import IndeedScraper
from mishoojobs.services.scrapers.occ import OCCScraper

def test_parse_mexican_relative_date_fixed_reference():
    scraper = ComputrabajoScraper()
    ref_dt = datetime(2026, 11, 6, 12, 0, 0, tzinfo=timezone.utc)

    assert scraper.parse_mexican_relative_date("Hace 2 horas", ref_dt) == datetime(2026, 11, 6, 10, 0, 0, tzinfo=timezone.utc)
    assert scraper.parse_mexican_relative_date("Publicada hoy", ref_dt) == datetime(2026, 11, 6, 12, 0, 0, tzinfo=timezone.utc)
    assert scraper.parse_mexican_relative_date("Ayer", ref_dt) == datetime(2026, 11, 5, 12, 0, 0, tzinfo=timezone.utc)
    assert scraper.parse_mexican_relative_date("Hace 3 días", ref_dt) == datetime(2026, 11, 3, 12, 0, 0, tzinfo=timezone.utc)
    assert scraper.parse_mexican_relative_date("Hace 2 semanas", ref_dt) == datetime(2026, 10, 23, 12, 0, 0, tzinfo=timezone.utc)
    assert scraper.parse_mexican_relative_date("Hace 30 minutos", ref_dt) == datetime(2026, 11, 6, 11, 30, 0, tzinfo=timezone.utc)
    assert scraper.parse_mexican_relative_date("Hace unos momentos", ref_dt) == datetime(2026, 11, 6, 12, 0, 0, tzinfo=timezone.utc)
    assert scraper.parse_mexican_relative_date("Salario negociable", ref_dt) is None
    assert scraper.parse_mexican_relative_date(None, ref_dt) is None
    assert scraper.parse_mexican_relative_date("", ref_dt) is None

def test_parse_mexican_salary_formats():
    scraper = ComputrabajoScraper()
    assert scraper.parse_mexican_salary("$ 22,999.00 (Mensual)") == (22999.0, 22999.0, "mensual")
    assert scraper.parse_mexican_salary("$ 20,000 - $ 23,000 Mensual") == (20000.0, 23000.0, "mensual")
    assert scraper.parse_mexican_salary("Salario: $14,000 - $18,000 mensuales") == (14000.0, 18000.0, "mensual")
    assert scraper.parse_mexican_salary("$3,000 a $5,000 semanales") == (3000.0, 5000.0, "semanal")
    assert scraper.parse_mexican_salary("$10,000 Mensuales brutos") == (10000.0, 10000.0, "mensual")
    assert scraper.parse_mexican_salary("$ 21,875 Mensual") == (21875.0, 21875.0, "mensual")
    assert scraper.parse_mexican_salary("Sueldo no mostrado por la empresa") == (None, None, None)
    assert scraper.parse_mexican_salary(None) == (None, None, None)
    assert scraper.parse_mexican_salary("") == (None, None, None)

def test_computrabajo_parser(computrabajo_html):
    scraper = ComputrabajoScraper()
    vacancies = scraper.parse_html(computrabajo_html)
    assert len(vacancies) >= 2
    v1 = vacancies[0]
    assert "Python Junior" in v1.title
    assert "Tech Solutions" in v1.company_name
    assert "Guadalajara" in v1.location_city or "Jalisco" in v1.location_state or "JAL" in v1.location_state
    assert len(v1.external_links) == 1
    assert "computrabajo.com" in v1.external_links[0].direct_url
    assert v1.published_at is not None

def test_indeed_parser(indeed_html):
    scraper = IndeedScraper()
    vacancies = scraper.parse_html(indeed_html)
    assert len(vacancies) >= 2
    v1 = vacancies[0]
    assert "Junior Backend" in v1.title or "Python" in v1.title
    assert "Tech Solutions" in v1.company_name
    assert len(v1.external_links) == 1
    assert "indeed.com" in v1.external_links[0].direct_url
    assert v1.published_at is not None
    assert len(v1.description) > 20
    assert "Python" in v1.skills

def test_indeed_parser_mosaic_json():
    scraper = IndeedScraper()
    html_mosaic = """
    <html><body>
    <script id="mosaic-data">
    window.mosaic.providerData["mosaic-provider-jobcards"] = {
        "metaData": {
            "mosaicProviderJobCardsModel": {
                "results": [
                    {
                        "jobkey": "testjk123",
                        "title": "Desarrollador Python Trainee",
                        "company": "Empresa Innovadora",
                        "formattedLocation": "Ciudad de México, CDMX",
                        "snippet": "Únete a nuestro equipo como <b>Desarrollador Python</b>.",
                        "jobCardRequirementsModel": {
                            "jobOnlyRequirements": [{"label": "Python"}, {"label": "Git"}]
                        },
                        "extractedSalary": {"min": 18000, "max": 22000, "type": "monthly"},
                        "pubDate": 1700000000000
                    }
                ]
            }
        }
    };
    </script>
    </body></html>
    """
    vacs = scraper.parse_html(html_mosaic)
    assert len(vacs) == 1
    v = vacs[0]
    assert v.title == "Desarrollador Python Trainee"
    assert v.company_name == "Empresa Innovadora"
    assert "Python" in v.skills
    assert "Requisitos clave" in v.description
    assert v.salary_min == 18000
    assert v.salary_period == "mensual"

def test_occ_parser(occ_html):
    scraper = OCCScraper()
    vacancies = scraper.parse_html(occ_html)
    assert len(vacancies) >= 2
    v1 = vacancies[0]
    assert "Programador Junior" in v1.title or "Python" in v1.title
    assert "DataTech" in v1.company_name
    assert len(v1.external_links) == 1
    assert "occ.com.mx" in v1.external_links[0].direct_url
    assert v1.published_at is not None
    assert len(v1.description) > 20
    assert "Python" in v1.skills

@pytest.mark.asyncio
async def test_indeed_search_mocked_curl_cffi():
    scraper = IndeedScraper()
    mock_session = AsyncMock()
    mock_resp_search = MagicMock()
    mock_resp_search.status_code = 200
    mock_resp_search.text = """<html><body><script id="mosaic-data">
    window.mosaic.providerData["mosaic-provider-jobcards"] = {
        "metaData": {
            "mosaicProviderJobCardsModel": {
                "results": [
                    {
                        "jobkey": "jk_mock_123",
                        "title": "Desarrollador Python Jr",
                        "company": "Tech Corp",
                        "formattedLocation": "CDMX",
                        "snippet": "Short initial snippet",
                        "pubDate": 1700000000000
                    }
                ]
            }
        }
    };
    </script></body></html>"""

    mock_resp_rpc = MagicMock()
    mock_resp_rpc.status_code = 200
    mock_resp_rpc.json.return_value = {
        "jk_mock_123": "<p>Full enriched job description with Python, Django, and Git details.</p>"
    }

    mock_session.get.side_effect = [mock_resp_search, mock_resp_rpc]
    mock_session_cls = MagicMock()
    mock_session_cls.return_value.__aenter__.return_value = mock_session

    with patch("curl_cffi.requests.AsyncSession", mock_session_cls):
        results = await scraper.search("python")
        assert len(results) == 1
        v = results[0]
        assert v.title == "Desarrollador Python Jr"
        assert "Full enriched job description" in v.description
        assert "Django" in v.skills or "Python" in v.skills
        mock_session_cls.assert_called_with(impersonate="chrome")

@pytest.mark.asyncio
async def test_indeed_fetch_full_description_mocked():
    scraper = IndeedScraper()
    mock_session = AsyncMock()
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "jk_desc_456": "<div>Descripción completa de vacante con requerimientos y prestaciones</div>"
    }
    mock_session.get.return_value = mock_resp
    mock_session_cls = MagicMock()
    mock_session_cls.return_value.__aenter__.return_value = mock_session

    with patch("curl_cffi.requests.AsyncSession", mock_session_cls):
        desc = await scraper.fetch_full_description("https://mx.indeed.com/viewjob?jk=jk_desc_456")
        assert desc == "Descripción completa de vacante con requerimientos y prestaciones"
        mock_session_cls.assert_called_with(impersonate="chrome")

@pytest.mark.asyncio
async def test_indeed_search_retry_on_initial_failure(indeed_html):
    scraper = IndeedScraper()
    mock_session_1 = AsyncMock()
    mock_session_1.get.side_effect = Exception("Cold-start handshake timeout")

    mock_session_2 = AsyncMock()
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.text = indeed_html
    mock_session_2.get.return_value = mock_resp

    sessions = [mock_session_1, mock_session_2]
    mock_session_cls = MagicMock()
    mock_session_cls.return_value.__aenter__.side_effect = sessions

    with patch("curl_cffi.requests.AsyncSession", mock_session_cls), patch("asyncio.sleep", AsyncMock()):
        results = await scraper.search("python", limit=5)
        assert len(results) > 0
        assert mock_session_cls.call_count == 2
