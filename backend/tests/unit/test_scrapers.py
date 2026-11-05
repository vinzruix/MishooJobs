import pytest
from mishoojobs.services.scrapers.computrabajo import ComputrabajoScraper
from mishoojobs.services.scrapers.indeed import IndeedScraper
from mishoojobs.services.scrapers.occ import OCCScraper

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

def test_indeed_parser(indeed_html):
    scraper = IndeedScraper()
    vacancies = scraper.parse_html(indeed_html)
    assert len(vacancies) >= 2
    v1 = vacancies[0]
    assert "Junior Backend" in v1.title or "Python" in v1.title
    assert "Tech Solutions" in v1.company_name
    assert len(v1.external_links) == 1
    assert "indeed.com" in v1.external_links[0].direct_url

def test_occ_parser(occ_html):
    scraper = OCCScraper()
    vacancies = scraper.parse_html(occ_html)
    assert len(vacancies) >= 2
    v1 = vacancies[0]
    assert "Programador Junior" in v1.title or "Python" in v1.title
    assert "DataTech" in v1.company_name
    assert len(v1.external_links) == 1
    assert "occ.com.mx" in v1.external_links[0].direct_url
