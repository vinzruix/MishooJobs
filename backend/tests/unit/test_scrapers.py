from datetime import datetime, timezone
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
