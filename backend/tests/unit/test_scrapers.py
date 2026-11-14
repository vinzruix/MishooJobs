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

def test_occ_parser_split_grid_without_anchor_uses_jobid():
    scraper = OCCScraper()
    split_grid_html = """
    <html><body>
      <ul>
        <li class="vacancy-card mb-2" id="jobcard-21390143" data-id="21390143" data-vacancy-card="">
          <div class="vacancy-card__body" role="button" tabindex="0">
            <div class="vacancy-card__header">
              <p class="vacancy-card__company-text">Grupo Salinas</p>
            </div>
            <div class="vacancy-card__info">
              <h2 class="vacancy-card__title">Desarrollador Python Jr</h2>
              <p class="vacancy-card__salary">$ 18,000 Mensual</p>
              <p class="vacancy-card__location">
                <span>Ciudad de México</span>
                <span>Hace 2 días</span>
              </p>
            </div>
          </div>
        </li>
      </ul>
    </body></html>
    """
    vacancies = scraper.parse_html(split_grid_html)
    assert len(vacancies) == 1
    v = vacancies[0]
    assert v.title == "Desarrollador Python Jr"
    assert v.company_name == "Grupo Salinas"
    assert len(v.external_links) == 1
    assert v.external_links[0].direct_url == "https://www.occ.com.mx/empleos/?jobid=21390143"
    assert "/empleo/oferta/" not in v.external_links[0].direct_url
    assert v.salary_min == 18000.0
    assert v.published_at is not None

@pytest.mark.asyncio
async def test_occ_search_enriches_from_offer_json_endpoint(monkeypatch):
    import httpx
    scraper = OCCScraper()
    split_grid_html = """
    <html><body>
      <ul>
        <li class="vacancy-card" id="jobcard-21399716" data-id="21399716" data-vacancy-card="">
          <div class="vacancy-card__body" role="button" tabindex="0">
            <p class="vacancy-card__company-text">SER-ES</p>
            <h2 class="vacancy-card__title">DESARROLLADOR JR</h2>
            <p class="vacancy-card__salary">$ 15,000 Mensual</p>
            <p class="vacancy-card__location"><span>Monterrey, Nuevo León</span><span>Hace 4 días</span></p>
          </div>
        </li>
      </ul>
    </body></html>
    """

    async def mock_fetch_html(self, url, params=None):
        return split_grid_html

    requested_urls = []

    async def mock_get(client, url, **kwargs):
        requested_urls.append(url)
        req = httpx.Request("GET", url)
        return httpx.Response(
            200,
            json={"o": {"ld": "<p>Desarrollo backend con <strong>Python</strong>, FastAPI, Docker y SQL.</p>"}},
            request=req,
        )

    monkeypatch.setattr(OCCScraper, "fetch_html", mock_fetch_html)
    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    results = await scraper.search("desarrollador", limit=5)
    assert len(results) == 1
    v = results[0]
    assert v.external_links[0].direct_url == "https://www.occ.com.mx/empleos/?jobid=21399716"
    assert requested_urls == ["https://oferta.occ.com.mx/offer/21399716/d/j?ipo=41&iapo=1"]
    assert "FastAPI" in v.description
    assert "Python" in v.skills and "Docker" in v.skills

@pytest.mark.asyncio
async def test_occ_fetch_full_description_from_jobid_and_legacy_url(monkeypatch):
    import httpx
    scraper = OCCScraper()

    async def mock_get(client, url, **kwargs):
        req = httpx.Request("GET", url)
        if "oferta.occ.com.mx/offer/21399716/" in url:
            return httpx.Response(
                200,
                json={"o": {"ld": "<p>Vacante activa con <b>PostgreSQL</b> y <i>Git</i>.</p>"}},
                request=req,
            )
        return httpx.Response(404, request=req)

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    desc_jobid = await scraper.fetch_full_description("https://www.occ.com.mx/empleos/?jobid=21399716")
    desc_legacy = await scraper.fetch_full_description("https://www.occ.com.mx/empleo/oferta/21399716-desarrollador-jr")
    assert desc_jobid == "Vacante activa con PostgreSQL y Git ."
    assert desc_legacy == desc_jobid
