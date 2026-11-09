import asyncio
import json
import re
from typing import Any, Dict, List, Optional, Tuple
import yaml

from mishoojobs.config import settings
from mishoojobs.schemas.master_profile import MasterProfileSchema


def count_cv_words(content: Dict[str, Any]) -> int:
    """Recursively counts words in all string fields of a CV content structure."""
    total = 0
    if isinstance(content, str):
        return len(content.split())
    elif isinstance(content, dict):
        for v in content.values():
            total += count_cv_words(v)
    elif isinstance(content, list):
        for item in content:
            total += count_cv_words(item)
    return total


class AgyAIClient:
    """Orchestrates Tier 2 deep AI evaluations, resume parsing, and CV generation via local agy CLI with zero external paid API keys."""

    PROMPT_TEMPLATE = (
        "Eres MishooJobs AI, un mentor senior de software y analista de empleo en México enfocado en estudiantes y desarrolladores junior.\n"
        "Evalúa la compatibilidad entre el perfil del candidato y la vacante laboral descrita abajo.\n\n"
        "PERFIL DEL CANDIDATO (HABILIDADES REPORTADAS):\n"
        "{candidate_skills_json}\n\n"
        "ROL OBJETIVO:\n"
        "{target_role}\n\n"
        "HABILIDADES DESEADAS / REQUERIDAS POR LA VACANTE:\n"
        "{desired_skills_json}\n\n"
        "DESCRIPCIÓN DE LA VACANTE:\n"
        "{job_description}\n\n"
        "INSTRUCCIONES DE EVALUACIÓN:\n"
        "1. Calcula un puntaje de compatibilidad real del 0 al 100 evaluando qué porcentaje de las habilidades deseadas/requeridas y requisitos técnicos de la vacante cubre el candidato.\n"
        "2. Identifica las habilidades del candidato que coinciden exactamente o estrechamente con las habilidades requeridas por la vacante y su descripción.\n"
        "3. Identifica las habilidades faltantes críticas (skill gaps) que la vacante solicita o requiere explícitamente y el candidato no posee.\n"
        "4. Proporciona un resumen de preparación (role_readiness_summary) conciso, honesto y constructivo en español mexicano.\n"
        "5. Ofrece un consejo accionable (actionable_advice) con un proyecto o recurso concreto para subsanar los skill gaps.\n\n"
        "RESPONDE ESTRICTAMENTE EN FORMATO JSON CON ESTA ESTRUCTURA:\n"
        "{\n"
        '  "fit_score": <numero entero 0-100>,\n'
        '  "fit_tier": "<high | moderate | low>",\n'
        '  "matched_skills": ["<habilidad 1>", "<habilidad 2>"],\n'
        '  "missing_skills": ["<brecha 1>", "<brecha 2>"],\n'
        '  "role_readiness_summary": "<texto explicativo>",\n'
        '  "actionable_advice": "<recomendacion concreta>"\n'
        "}"
    )

    AUDIT_PROMPT_TEMPLATE = (
        "Eres MishooJobs AI, un auditor y analista de empleo en tecnología en México.\n"
        "Tu objetivo es realizar una auditoría de experiencia requerida sobre la siguiente vacante para determinar si califica como un auténtico 'Primer Empleo Real (0 Exp)', identificar discrepancias ('Fake Junior') o su nivel de experiencia real.\n\n"
        "TÍTULO DE LA VACANTE:\n"
        "{title}\n\n"
        "EMPRESA:\n"
        "{company_name}\n\n"
        "DESCRIPCIÓN DE LA VACANTE:\n"
        "{job_description}\n\n"
        "INSTRUCCIONES DE AUDITORÍA:\n"
        "1. Analiza el título y la descripción completa para extraer los años mínimos de experiencia laboral comercial previa requeridos (years_required_min: entero >= 0).\n"
        "2. Clasifica el nivel de experiencia (seniority_level) estrictamente entre: 'pasantia', 'primer_empleo', 'junior', 'mid', 'senior'.\n"
        "   - 'pasantia': Prácticas profesionales, residencias o servicio social para estudiantes en curso.\n"
        "   - 'primer_empleo': Empleo formal pagado por nómina que NO exige ninguna experiencia laboral previa (estrictamente 0 años requeridos).\n"
        "   - 'junior': Puestos de entrada que solicitan 1 año de experiencia (o hasta 2 años si es afín).\n"
        "   - 'mid': Puestos que requieren entre 2 y 4 años de experiencia.\n"
        "   - 'senior': Puestos que requieren 5 o más años de experiencia laboral, arquitectos de software o tech leads.\n"
        "3. Determina 'is_real_first_job': estrictamente true si years_required_min == 0 y es un empleo formal remunerado (no pasantía estudiantil sin goce de sueldo ni esquema piramidal).\n"
        "4. Determina 'has_discrepancy': true si el título dice Junior, Jr, Trainee o Practicante pero el cuerpo exige 2 o más años de experiencia (reclasificando a 'mid' o 'senior').\n"
        "5. Redacta una explicación concisa y justificada en español mexicano (reasoning).\n\n"
        "RESPONDE ESTRICTAMENTE EN FORMATO JSON CON ESTA ESTRUCTURA:\n"
        "{\n"
        '  "seniority_level": "<pasantia | primer_empleo | junior | mid | senior>",\n'
        '  "years_required_min": <numero entero >= 0>,\n'
        '  "is_real_first_job": <true | false>,\n'
        '  "has_discrepancy": <true | false>,\n'
        '  "reasoning": "<explicacion breve en espanol>"\n'
        "}"
    )

    PARSE_RESUME_PROMPT_TEMPLATE = (
        "Eres MishooJobs AI, un especialista en estructuración de perfiles técnicos y de ingeniería para estudiantes y juniors en México.\n"
        "Tu objetivo es analizar el texto del currículum proporcionado y estructurarlo estrictamente según el esquema canónico del Perfil Maestro (Master Career Knowledge Base) de MishooJobs.\n\n"
        "TEXTO DEL CURRÍCULUM:\n"
        "{raw_resume_text}\n\n"
        "INSTRUCCIONES DE ESTRUCTURACIÓN:\n"
        "1. Extrae personal_info: full_name, headline, email, phone, location, website, github, linkedin, photo (boolean, default true).\n"
        "2. Extrae about_me: resumen profesional conciso destacando metas y enfoque técnico.\n"
        "3. Categoriza tech en: backend, frontend, databases, messaging_distributed, ai_data, devops_cloud, tools.\n"
        "4. Extrae languages: lista de objetos con language y level (ej: Nativo, B2 - Intermedio Avanzado, C1 - Profesional).\n"
        "5. Extrae experience: lista de objetos con company, role, location, start_date, end_date, current (bool), highlights (viñetas con logros y acciones técnicas).\n"
        "6. Extrae projects: lista de objetos con name, description, technologies (lista de strings), link, highlights.\n"
        "7. Extrae education: lista de objetos con institution, degree, field, start_date, end_date, gpa, current (bool).\n"
        "8. Extrae certificates: lista de objetos con name, issuer, issue_date, expiry_date, credential_id, url.\n"
        "9. Extrae logros_academicos: lista de objetos con title, organization, date, description.\n\n"
        "RESPONDE ESTRICTAMENTE EN FORMATO JSON CON ESTA ESTRUCTURA:\n"
        "{\n"
        '  "personal_info": {\n'
        '    "full_name": "...",\n'
        '    "headline": "...",\n'
        '    "email": "...",\n'
        '    "phone": "...",\n'
        '    "location": "...",\n'
        '    "website": "...",\n'
        '    "github": "...",\n'
        '    "linkedin": "...",\n'
        '    "photo": true\n'
        "  },\n"
        '  "about_me": "...",\n'
        '  "tech": {\n'
        '    "backend": [...],\n'
        '    "frontend": [...],\n'
        '    "databases": [...],\n'
        '    "messaging_distributed": [...],\n'
        '    "ai_data": [...],\n'
        '    "devops_cloud": [...],\n'
        '    "tools": [...]\n'
        "  },\n"
        '  "languages": [ {"language": "...", "level": "..."} ],\n'
        '  "experience": [ {"company": "...", "role": "...", "location": "...", "start_date": "...", "end_date": "...", "current": false, "highlights": [...]} ],\n'
        '  "projects": [ {"name": "...", "description": "...", "technologies": [...], "link": "...", "highlights": [...]} ],\n'
        '  "education": [ {"institution": "...", "degree": "...", "field": "...", "start_date": "...", "end_date": "...", "gpa": "...", "current": false} ],\n'
        '  "certificates": [ {"name": "...", "issuer": "...", "issue_date": "..."} ],\n'
        '  "logros_academicos": [ {"title": "...", "organization": "...", "date": "...", "description": "..."} ]\n'
        "}"
    )

    TAILORED_CV_PROMPT_TEMPLATE = (
        "Eres MishooJobs AI, un experto en reclutamiento técnico y optimización de CVs ATS para ingeniería de software en México.\n"
        "Tu tarea es generar un currículum vitae de alto impacto adaptado a una vacante específica, basado ÚNICAMENTE en el Perfil Maestro del candidato.\n\n"
        "REGLAS CRÍTICAS DE INTEGRIDAD (ESCUDO ANTI-ALUCINACIÓN):\n"
        "1. NO inventes empresas, métricas no proporcionadas, fechas ni tecnologías que el candidato no tenga en su Perfil Maestro.\n"
        "2. Aplica el método STAR (Verbo de acción + Situación/Tarea + Resultado) en cada viñeta.\n"
        "3. Límite estricto de 1 PÁGINA (máximo 500 palabras en total).\n"
        "4. Selecciona las 2 a 4 experiencias más relevantes y los 2 a 3 proyectos más afines a la vacante.\n"
        "5. Idioma objetivo: {language_label}.\n\n"
        "PERFIL MAESTRO DEL CANDIDATO:\n"
        "{master_profile_json}\n\n"
        "DETALLES DE LA VACANTE OBJETIVO:\n"
        "Título: {vacancy_title}\n"
        "Empresa: {vacancy_company}\n"
        "Habilidades Deseadas: {desired_skills_json}\n"
        "Descripción:\n{job_description}\n\n"
        "RESPONDE ESTRICTAMENTE EN FORMATO JSON CON ESTA ESTRUCTURA:\n"
        "{\n"
        '  "ats_match_score": <entero 0-100>,\n'
        '  "curation_notes": "<explicación breve de por qué se seleccionaron estas experiencias y proyectos>",\n'
        '  "content": {\n'
        '    "header": {\n'
        '      "full_name": "...",\n'
        '      "headline": "...",\n'
        '      "email": "...",\n'
        '      "phone": "...",\n'
        '      "location": "...",\n'
        '      "links": [ {"label": "GitHub", "url": "..."}, {"label": "LinkedIn", "url": "..."} ],\n'
        '      "about_me": "..."\n'
        "    },\n"
        '    "skills_categorized": {\n'
        '      "Backend": [...],\n'
        '      "Frontend": [...],\n'
        '      "Bases de Datos": [...],\n'
        '      "Herramientas & Cloud": [...]\n'
        "    },\n"
        '    "languages": [ {"language": "...", "level": "..."} ],\n'
        '    "experience": [\n'
        '      {\n'
        '        "company": "...",\n'
        '        "role": "...",\n'
        '        "location": "...",\n'
        '        "period": "Ene 2024 - Presente",\n'
        '        "highlights": ["..."]\n'
        "      }\n"
        "    ],\n"
        '    "projects": [\n'
        '      {\n'
        '        "name": "...",\n'
        '        "description": "...",\n'
        '        "technologies": [...],\n'
        '        "link": "...",\n'
        '        "highlights": ["..."]\n'
        "      }\n"
        "    ],\n"
        '    "education": [\n'
        '      {\n'
        '        "institution": "...",\n'
        '        "degree": "...",\n'
        '        "period": "...",\n'
        '        "details": "..."\n'
        "      }\n"
        "    ],\n"
        '    "certificates": [ {"name": "...", "issuer": "...", "date": "..."} ],\n'
        '    "logros_academicos": [ {"title": "...", "organization": "...", "date": "...", "description": "..."} ]\n'
        "  }\n"
        "}"
    )

    ROLE_CV_PROMPT_TEMPLATE = (
        "Eres MishooJobs AI, un experto en reclutamiento técnico y optimización de CVs ATS para ingeniería de software en México.\n"
        "Tu tarea es generar un currículum vitae base (Role Archetype) enfocado en un rol objetivo general y etiquetas de enfoque, basado ÚNICAMENTE en el Perfil Maestro del candidato.\n\n"
        "REGLAS CRÍTICAS DE INTEGRIDAD (ESCUDO ANTI-ALUCINACIÓN):\n"
        "1. NO inventes empresas, métricas no proporcionadas, fechas ni tecnologías que el candidato no tenga en su Perfil Maestro.\n"
        "2. Aplica el método STAR (Verbo de acción + Situación/Tarea + Resultado) en cada viñeta.\n"
        "3. Límite estricto de 1 PÁGINA (máximo 500 palabras en total).\n"
        "4. Selecciona y prioriza experiencias y proyectos orientados a destacar las tecnologías del rol objetivo y etiquetas de enfoque.\n"
        "5. Idioma objetivo: {language_label}.\n\n"
        "PERFIL MAESTRO DEL CANDIDATO:\n"
        "{master_profile_json}\n\n"
        "ROL OBJETIVO:\n"
        "Título: {target_role_title}\n"
        "Etiquetas de Enfoque: {focus_tags_json}\n\n"
        "RESPONDE ESTRICTAMENTE EN FORMATO JSON CON ESTA ESTRUCTURA:\n"
        "{\n"
        '  "ats_match_score": <entero 0-100>,\n'
        '  "curation_notes": "<explicación breve de la selección y enfoque>",\n'
        '  "content": {\n'
        '    "header": {\n'
        '      "full_name": "...",\n'
        '      "headline": "...",\n'
        '      "email": "...",\n'
        '      "phone": "...",\n'
        '      "location": "...",\n'
        '      "links": [ {"label": "GitHub", "url": "..."}, {"label": "LinkedIn", "url": "..."} ],\n'
        '      "about_me": "..."\n'
        "    },\n"
        '    "skills_categorized": {\n'
        '      "Backend": [...],\n'
        '      "Frontend": [...],\n'
        '      "Bases de Datos": [...],\n'
        '      "Herramientas & Cloud": [...]\n'
        "    },\n"
        '    "languages": [ {"language": "...", "level": "..."} ],\n'
        '    "experience": [\n'
        '      {\n'
        '        "company": "...",\n'
        '        "role": "...",\n'
        '        "location": "...",\n'
        '        "period": "Ene 2024 - Presente",\n'
        '        "highlights": ["..."]\n'
        "      }\n"
        "    ],\n"
        '    "projects": [\n'
        '      {\n'
        '        "name": "...",\n'
        '        "description": "...",\n'
        '        "technologies": [...],\n'
        '        "link": "...",\n'
        '        "highlights": ["..."]\n'
        "      }\n"
        "    ],\n"
        '    "education": [\n'
        '      {\n'
        '        "institution": "...",\n'
        '        "degree": "...",\n'
        '        "period": "...",\n'
        '        "details": "..."\n'
        "      }\n"
        "    ],\n"
        '    "certificates": [ {"name": "...", "issuer": "...", "date": "..."} ],\n'
        '    "logros_academicos": [ {"title": "...", "organization": "...", "date": "...", "description": "..."} ]\n'
        "  }\n"
        "}"
    )

    def __init__(self, executable_path: str = settings.agy_cli_path, timeout: float = settings.agy_timeout_seconds):
        self.executable_path = executable_path
        self.timeout = timeout

    async def _run_cli_subprocess(self, prompt: str) -> Tuple[str, str]:
        """Runs the agy CLI as an asynchronous subprocess and returns (stdout, stderr)."""
        cmd = [
            self.executable_path,
            "--print",
            prompt,
            "--output-format",
            "json",
            "--disable-slash-commands",
        ]

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=self.timeout)
        except asyncio.TimeoutError:
            try:
                proc.kill()
            except ProcessLookupError:
                pass
            raise TimeoutError(f"agy CLI timed out after {self.timeout}s")

        if proc.returncode != 0:
            err_msg = stderr.decode("utf-8", errors="replace")
            raise RuntimeError(f"agy CLI failed with exit code {proc.returncode}: {err_msg}")

        return stdout.decode("utf-8", errors="replace"), stderr.decode("utf-8", errors="replace")

    @staticmethod
    def extract_json_from_output(raw_output: str) -> Dict[str, Any]:
        """Strips markdown code blocks, CLI wrappers, or logs to extract valid JSON."""
        content_to_parse = raw_output.strip()
        try:
            envelope = json.loads(content_to_parse)
            if isinstance(envelope, dict):
                if "response" in envelope:
                    res = envelope["response"]
                    if isinstance(res, dict):
                        return res
                    elif isinstance(res, str):
                        content_to_parse = res.strip()
                elif "fit_score" in envelope or "content" in envelope or "personal_info" in envelope:
                    return envelope
        except json.JSONDecodeError:
            pass

        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", content_to_parse, re.DOTALL)
        if match:
            clean_str = match.group(1)
        else:
            first_brace = content_to_parse.find("{")
            last_brace = content_to_parse.rfind("}")
            if first_brace != -1 and last_brace != -1:
                clean_str = content_to_parse[first_brace : last_brace + 1]
            else:
                clean_str = content_to_parse

        return json.loads(clean_str)

    @staticmethod
    def clean_json_output(raw_output: str) -> Dict[str, Any]:
        """Cleans evaluation JSON output."""
        parsed = AgyAIClient.extract_json_from_output(raw_output)

        score = int(parsed.get("fit_score", 50))
        tier = parsed.get("fit_tier")
        if tier not in ["high", "moderate", "low"]:
            if score >= 80:
                tier = "high"
            elif score >= 50:
                tier = "moderate"
            else:
                tier = "low"
            parsed["fit_tier"] = tier

        parsed["fit_score"] = score
        parsed["matched_skills"] = list(parsed.get("matched_skills", []))
        parsed["missing_skills"] = list(parsed.get("missing_skills", []))
        parsed["role_readiness_summary"] = str(parsed.get("role_readiness_summary", "Evaluación completada."))
        parsed["actionable_advice"] = str(parsed.get("actionable_advice", "Continúa fortaleciendo tus proyectos prácticos."))
        return parsed

    async def run_evaluation(
        self,
        target_role: str,
        candidate_skills: List[str],
        job_description: str,
        desired_skills: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Runs the agy CLI as an asynchronous subprocess and returns structured evaluation."""
        desired_skills_list = desired_skills or []
        prompt = (
            self.PROMPT_TEMPLATE
            .replace("{candidate_skills_json}", json.dumps(candidate_skills, ensure_ascii=False))
            .replace("{target_role}", target_role)
            .replace("{desired_skills_json}", json.dumps(desired_skills_list, ensure_ascii=False))
            .replace("{job_description}", job_description[:2500])
        )

        stdout, _ = await self._run_cli_subprocess(prompt)
        return self.clean_json_output(stdout)

    @staticmethod
    def clean_seniority_audit_output(raw_output: str) -> Dict[str, Any]:
        """Strips markdown code blocks, CLI wrappers, or logs to extract valid seniority audit JSON."""
        parsed = AgyAIClient.extract_json_from_output(raw_output)

        level = str(parsed.get("seniority_level", "junior")).lower().strip()
        if level not in ["pasantia", "primer_empleo", "junior", "mid", "senior"]:
            level = "junior"

        years = int(parsed.get("years_required_min", 0))
        if years < 0:
            years = 0

        is_real = bool(parsed.get("is_real_first_job", False))
        if years > 0:
            is_real = False

        has_disc = bool(parsed.get("has_discrepancy", False))
        reasoning = str(parsed.get("reasoning", "Auditoría de experiencia completada."))

        return {
            "seniority_level": level,
            "years_required_min": years,
            "is_real_first_job": is_real,
            "has_discrepancy": has_disc,
            "reasoning": reasoning,
        }

    async def run_seniority_audit(
        self,
        title: str,
        company_name: str,
        job_description: str,
    ) -> Dict[str, Any]:
        """Runs the agy CLI as an asynchronous subprocess for deep seniority auditing."""
        prompt = (
            self.AUDIT_PROMPT_TEMPLATE
            .replace("{title}", title)
            .replace("{company_name}", company_name)
            .replace("{job_description}", job_description[:2500])
        )

        stdout, _ = await self._run_cli_subprocess(prompt)
        return self.clean_seniority_audit_output(stdout)

    async def parse_resume_to_yaml(self, raw_resume_text: str) -> Tuple[str, List[str]]:
        """Maps raw unformatted text into canonical Master Profile YAML via agy CLI."""
        warnings: List[str] = []
        prompt = self.PARSE_RESUME_PROMPT_TEMPLATE.replace("{raw_resume_text}", raw_resume_text[:4000])

        stdout, _ = await self._run_cli_subprocess(prompt)
        parsed = self.extract_json_from_output(stdout)

        # Validate against MasterProfileSchema
        try:
            validated = MasterProfileSchema.model_validate(parsed)
        except Exception as e:
            warnings.append(f"Validación estricta adaptada: {e}")
            # Ensure essential keys exist
            if "personal_info" not in parsed:
                parsed["personal_info"] = {
                    "full_name": "Candidato",
                    "headline": "Desarrollador Junior",
                    "email": "candidato@ejemplo.com",
                    "phone": "+52",
                    "location": "México",
                    "photo": True,
                }
            if "about_me" not in parsed:
                parsed["about_me"] = ""
            if "tech" not in parsed:
                parsed["tech"] = {k: [] for k in ["backend", "frontend", "databases", "messaging_distributed", "ai_data", "devops_cloud", "tools"]}
            for key in ["languages", "experience", "projects", "education", "certificates", "logros_academicos"]:
                if key not in parsed:
                    parsed[key] = []
            validated = MasterProfileSchema.model_validate(parsed)

        yaml_content = yaml.dump(
            validated.model_dump(),
            sort_keys=False,
            allow_unicode=True,
            default_flow_style=False,
        )
        return yaml_content, warnings

    async def generate_tailored_cv(
        self,
        master_profile: Dict[str, Any],
        vacancy_title: str,
        vacancy_company: str,
        job_description: str,
        desired_skills: Optional[List[str]] = None,
        language: str = "es",
    ) -> Dict[str, Any]:
        """Generates a vacancy-tailored single-page CV (max 500 words) using agy CLI."""
        language_label = "Español Mexicano" if language == "es" else "Inglés (English)"
        desired_skills_list = desired_skills or []

        prompt = (
            self.TAILORED_CV_PROMPT_TEMPLATE
            .replace("{language_label}", language_label)
            .replace("{master_profile_json}", json.dumps(master_profile, ensure_ascii=False))
            .replace("{vacancy_title}", vacancy_title)
            .replace("{vacancy_company}", vacancy_company)
            .replace("{desired_skills_json}", json.dumps(desired_skills_list, ensure_ascii=False))
            .replace("{job_description}", job_description[:2500])
        )

        stdout, _ = await self._run_cli_subprocess(prompt)
        parsed = self.extract_json_from_output(stdout)

        content = parsed.get("content", {})
        score = int(parsed.get("ats_match_score", 85))
        score = max(0, min(100, score))
        curation_notes = parsed.get("curation_notes")

        word_count = count_cv_words(content)

        return {
            "content": content,
            "ats_match_score": score,
            "word_count": word_count,
            "curation_notes": curation_notes,
        }

    async def generate_role_cv(
        self,
        master_profile: Dict[str, Any],
        target_role_title: str,
        focus_tags: Optional[List[str]] = None,
        language: str = "es",
    ) -> Dict[str, Any]:
        """Generates a role archetype single-page CV (max 500 words) using agy CLI."""
        language_label = "Español Mexicano" if language == "es" else "Inglés (English)"
        focus_tags_list = focus_tags or []

        prompt = (
            self.ROLE_CV_PROMPT_TEMPLATE
            .replace("{language_label}", language_label)
            .replace("{master_profile_json}", json.dumps(master_profile, ensure_ascii=False))
            .replace("{target_role_title}", target_role_title)
            .replace("{focus_tags_json}", json.dumps(focus_tags_list, ensure_ascii=False))
        )

        stdout, _ = await self._run_cli_subprocess(prompt)
        parsed = self.extract_json_from_output(stdout)

        content = parsed.get("content", {})
        score = int(parsed.get("ats_match_score", 90))
        score = max(0, min(100, score))
        curation_notes = parsed.get("curation_notes")

        word_count = count_cv_words(content)

        return {
            "content": content,
            "ats_match_score": score,
            "word_count": word_count,
            "curation_notes": curation_notes,
        }
