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
    assert len(merged[0].external_links) == 2
    assert merged[0].salary_min == 12000.0
    assert merged[0].salary_max == 18000.0
