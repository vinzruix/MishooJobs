from mishoojobs.services.deduplicator import CrossPortalDeduplicator
from mishoojobs.schemas.job import VacancyDTO, ExternalLinkDTO, PortalName

def test_fingerprint_normalization():
    dedup = CrossPortalDeduplicator()
    fp1 = dedup.generate_fingerprint("Tech Solutions México", "Desarrollador Python Junior", "Jalisco")
    fp2 = dedup.generate_fingerprint("tech solutions mexico", "DESARROLLADOR PYTHON JUNIOR", "JAL")
    assert fp1 == fp2
    assert len(fp1) == 64

def test_cross_portal_deduplication_merge():
    dedup = CrossPortalDeduplicator()
    v1 = VacancyDTO(
        fingerprint=dedup.generate_fingerprint("Tech Solutions México", "Desarrollador Python Junior", "Jalisco"),
        title="Desarrollador Python Junior",
        company_name="Tech Solutions México",
        location_state="JAL",
        description_clean="Python dev job description",
        salary_min=12000.0,
        salary_max=16000.0,
        external_links=[
            ExternalLinkDTO(portal_name=PortalName.COMPUTRABAJO, direct_url="https://mx.computrabajo.com/1", is_active=True)
        ],
    )
    v2 = VacancyDTO(
        fingerprint=dedup.generate_fingerprint("tech solutions mexico", "desarrollador python junior", "jal"),
        title="Desarrollador Python Junior",
        company_name="Tech Solutions Mexico",
        location_state="JAL",
        description_clean="Python dev job description from indeed",
        salary_min=14000.0,
        salary_max=18000.0,
        external_links=[
            ExternalLinkDTO(portal_name=PortalName.INDEED, direct_url="https://mx.indeed.com/viewjob?jk=2", is_active=True)
        ],
    )

    merged, summary = dedup.deduplicate_batch([v1, v2])
    assert len(merged) == 1
    assert summary.duplicates_merged == 1
    assert summary.total_extracted == 2
    assert summary.unique_vacancies == 1
    assert len(merged[0].external_links) == 2
    assert merged[0].salary_min == 12000.0
    assert merged[0].salary_max == 18000.0

def test_generic_company_fingerprint_disambiguation():
    dedup = CrossPortalDeduplicator()
    # Different URLs for confidential companies produce distinct fingerprints
    fp1 = dedup.generate_fingerprint("Empresa Confidencial", "Desarrollador Python", "MEXICO", disambiguator="https://mx.computrabajo.com/oferta/1")
    fp2 = dedup.generate_fingerprint("Empresa Confidencial", "Desarrollador Python", "MEXICO", disambiguator="https://mx.computrabajo.com/oferta/2")
    assert fp1 != fp2

    # Same URL produces identical fingerprint
    fp1_again = dedup.generate_fingerprint("Empresa Confidencial", "Desarrollador Python", "MEXICO", disambiguator="https://mx.computrabajo.com/oferta/1#extra")
    assert fp1 == fp1_again

    # Non-confidential company ignores disambiguator to allow cross-portal deduplication
    fp_real_1 = dedup.generate_fingerprint("Softtek", "Desarrollador Python", "CDMX", disambiguator="https://mx.computrabajo.com/oferta/3")
    fp_real_2 = dedup.generate_fingerprint("Softtek", "Desarrollador Python", "CDMX", disambiguator="https://mx.indeed.com/viewjob?jk=4")
    assert fp_real_1 == fp_real_2

def test_confidential_vacancies_not_falsely_merged():
    dedup = CrossPortalDeduplicator()
    v1 = VacancyDTO(
        fingerprint="a" * 64,
        title="Desarrollador Python Junior",
        company_name="Empresa Confidencial",
        location_state="MEXICO",
        description_clean="Job 1 description",
        external_links=[ExternalLinkDTO(portal_name=PortalName.COMPUTRABAJO, direct_url="https://mx.computrabajo.com/1", is_active=True)],
    )
    v2 = VacancyDTO(
        fingerprint="b" * 64,
        title="Desarrollador Python Junior",
        company_name="Empresa Confidencial",
        location_state="MEXICO",
        description_clean="Job 2 description",
        external_links=[ExternalLinkDTO(portal_name=PortalName.COMPUTRABAJO, direct_url="https://mx.computrabajo.com/2", is_active=True)],
    )
    merged, summary = dedup.deduplicate_batch([v1, v2])
    # Must preserve both distinct confidential listings
    assert len(merged) == 2
    assert summary.duplicates_merged == 0
    assert summary.total_extracted == 2
    assert summary.unique_vacancies == 2
    assert merged[0].fingerprint != merged[1].fingerprint
