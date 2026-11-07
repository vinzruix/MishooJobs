import asyncio
import json
import re
from typing import Any, Dict, List
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
        "DESCRIPCIÓN DE LA VACANTE:\n"
        "{job_description}\n\n"
        "INSTRUCCIONES DE EVALUACIÓN:\n"
        "1. Calcula un puntaje de compatibilidad real del 0 al 100 evaluando qué porcentaje de los requisitos técnicos esenciales cubre el candidato.\n"
        "2. Identifica las habilidades del candidato que coinciden exactamente o estrechamente con la vacante.\n"
        "3. Identifica las habilidades faltantes críticas (skill gaps) que la vacante solicita explícitamente y el candidato no posee.\n"
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
    ) -> Dict[str, Any]:
        """Runs the agy CLI as an asynchronous subprocess and returns structured evaluation."""
        prompt = (
            self.PROMPT_TEMPLATE
            .replace("{candidate_skills_json}", json.dumps(candidate_skills, ensure_ascii=False))
            .replace("{target_role}", target_role)
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
