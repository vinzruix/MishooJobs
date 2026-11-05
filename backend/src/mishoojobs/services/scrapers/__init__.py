"""Scrapers package."""
from mishoojobs.services.scrapers.base import AbstractBaseScraper
from mishoojobs.services.scrapers.computrabajo import ComputrabajoScraper
from mishoojobs.services.scrapers.indeed import IndeedScraper
from mishoojobs.services.scrapers.occ import OCCScraper

__all__ = ["AbstractBaseScraper", "ComputrabajoScraper", "IndeedScraper", "OCCScraper"]
