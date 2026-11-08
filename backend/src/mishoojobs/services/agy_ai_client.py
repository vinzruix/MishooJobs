import asyncio
import json
import re
from typing import Any, Dict, List, Optional
from mishoojobs.config import settings

class AgyAIClient:
    """Orchestrates Tier 2 deep AI evaluations via local agy CLI with zero external paid API keys."""

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

    def __init__(self, executable_path: str = settings.agy_cli_path, timeout: float = settings.agy_timeout_seconds):
        self.executable_path = executable_path
        self.timeout = timeout

    @staticmethod
    def clean_json_output(raw_output: str) -> Dict[str, Any]:
        """Strips markdown code blocks, CLI wrappers, or logs to extract valid JSON."""
        content_to_parse = raw_output.strip()
        try:
            envelope = json.loads(content_to_parse)
            if isinstance(envelope, dict):
                if "response" in envelope and isinstance(envelope["response"], str):
                    content_to_parse = envelope["response"].strip()
                elif "fit_score" in envelope:
                    # Direct dictionary already parsed
                    pass
        except json.JSONDecodeError:
            pass

        # Find JSON block enclosed in ```json ... ``` or first { to last }
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

        parsed = json.loads(clean_str)

        # Normalize fit_tier if needed
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
            raise TimeoutError(f"agy CLI evaluation timed out after {self.timeout}s")

        if proc.returncode != 0:
            err_msg = stderr.decode("utf-8", errors="replace")
            raise RuntimeError(f"agy CLI failed with exit code {proc.returncode}: {err_msg}")

        out_str = stdout.decode("utf-8", errors="replace")
        return self.clean_json_output(out_str)

    @staticmethod
    def clean_seniority_audit_output(raw_output: str) -> Dict[str, Any]:
        """Strips markdown code blocks, CLI wrappers, or logs to extract valid seniority audit JSON."""
        content_to_parse = raw_output.strip()
        try:
            envelope = json.loads(content_to_parse)
            if isinstance(envelope, dict):
                if "response" in envelope and isinstance(envelope["response"], str):
                    content_to_parse = envelope["response"].strip()
                elif "seniority_level" in envelope:
                    pass
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

        parsed = json.loads(clean_str)

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
            raise TimeoutError(f"agy CLI seniority audit timed out after {self.timeout}s")

        if proc.returncode != 0:
            err_msg = stderr.decode("utf-8", errors="replace")
            raise RuntimeError(f"agy CLI failed with exit code {proc.returncode}: {err_msg}")

        out_str = stdout.decode("utf-8", errors="replace")
        return self.clean_seniority_audit_output(out_str)
