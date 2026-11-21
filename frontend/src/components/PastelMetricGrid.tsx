import React from "react";
import { DollarSign, MapPin, Briefcase, Award } from "lucide-react";
import type { JobVacancy, PastelMetricItem } from "../types/job";

export interface PastelMetricGridProps {
  vacancy: JobVacancy;
  fitScore?: number | null;
  metrics?: PastelMetricItem[];
}

export function buildPastelMetrics(vacancy: JobVacancy, fitScore?: number | null): PastelMetricItem[] {
  // 1. Salary
  let salaryValue = "A convenir";
  let salarySubtext = "Sueldo no publicado";

  const period = vacancy.salary_period ? `/${vacancy.salary_period}` : "/mes";
  if (vacancy.salary_min && vacancy.salary_max && vacancy.salary_min !== vacancy.salary_max) {
    salaryValue = `$${vacancy.salary_min.toLocaleString("es-MX")} - $${vacancy.salary_max.toLocaleString("es-MX")} ${vacancy.currency || "MXN"}${period}`;
    salarySubtext = "Rango salarial";
  } else if (vacancy.salary_min || vacancy.salary_max) {
    const amount = (vacancy.salary_min || vacancy.salary_max)!;
    salaryValue = `$${amount.toLocaleString("es-MX")} ${vacancy.currency || "MXN"}${period}`;
    salarySubtext = "Sueldo base";
  }

  // 2. Modality
  const rawModality = (vacancy.modality || "presencial").toLowerCase();
  let modalityValue = "Presencial";
  let modalitySubtext = "En sitio";

  if (rawModality === "remoto") {
    modalityValue = "Remoto";
    modalitySubtext = "100% Home Office";
  } else if (rawModality === "hibrido" || rawModality === "híbrido") {
    modalityValue = "Híbrido";
    modalitySubtext = "Modalidad mixta";
  }

  // 3. Experience / Match
  let expValue = "Sin especificar";
  let expSubtext = "No detallada en vacante";

  const isExpUnknown =
    vacancy.years_required_min == null ||
    (vacancy.years_required_min === 0 &&
      !vacancy.is_real_first_job &&
      vacancy.seniority_level === "junior" &&
      (vacancy.reasoning?.includes("sin años especificados") || vacancy.reasoning?.includes("requisitos abiertos")));

  if (fitScore != null) {
    expValue = `${fitScore}% Match`;
    expSubtext = "Compatibilidad";
  } else if (isExpUnknown) {
    expValue = "Sin especificar";
    expSubtext = "No detallada en vacante";
  } else if (vacancy.years_required_min === 0) {
    expValue = "0 años";
    expSubtext = "Sin experiencia previa";
  } else if (vacancy.years_required_min === 1) {
    expValue = "1 año";
    expSubtext = "Experiencia mín.";
  } else if (vacancy.years_required_min && vacancy.years_required_min > 1) {
    expValue = `${vacancy.years_required_min} años`;
    expSubtext = "Experiencia mín.";
  }

  // 4. Seniority
  let seniorityValue = "Junior";
  let senioritySubtext = "Nivel laboral";

  switch (vacancy.seniority_level) {
    case "primer_empleo":
      seniorityValue = "Primer Empleo Real";
      senioritySubtext = "0 años verificados";
      break;
    case "pasantia":
      seniorityValue = "Pasantía / Prácticas";
      senioritySubtext = "Estudiantes y becarios";
      break;
    case "junior":
      seniorityValue = "Junior";
      senioritySubtext = isExpUnknown ? "Requisitos abiertos" : "Nivel inicial";
      break;
    case "mid":
      seniorityValue = "Mid-Level";
      senioritySubtext = "Intermedio";
      break;
    case "senior":
      seniorityValue = "Senior";
      senioritySubtext = "Avanzado / Lead";
      break;
    default:
      seniorityValue = "Junior";
      senioritySubtext = "Nivel laboral";
  }

  return [
    {
      id: "salary",
      theme: "emerald",
      label: "Salario",
      value: salaryValue,
      subtext: salarySubtext,
      icon: "DollarSign",
      badgeStyle: {
        bgClass: "bg-emerald-50",
        borderClass: "border-emerald-200",
        textClass: "text-emerald-950",
        labelClass: "text-emerald-700",
        iconClass: "text-emerald-600",
      },
    },
    {
      id: "modality",
      theme: "sky",
      label: "Modalidad",
      value: modalityValue,
      subtext: modalitySubtext,
      icon: "MapPin",
      badgeStyle: {
        bgClass: "bg-sky-50",
        borderClass: "border-sky-200",
        textClass: "text-sky-950",
        labelClass: "text-sky-700",
        iconClass: "text-sky-600",
      },
    },
    {
      id: "experience",
      theme: "amber",
      label: fitScore != null ? "Afinidad" : "Experiencia",
      value: expValue,
      subtext: expSubtext,
      icon: "Briefcase",
      badgeStyle: {
        bgClass: "bg-amber-50",
        borderClass: "border-amber-200",
        textClass: "text-amber-950",
        labelClass: "text-amber-700",
        iconClass: "text-amber-600",
      },
    },
    {
      id: "seniority",
      theme: "purple",
      label: "Nivel",
      value: seniorityValue,
      subtext: senioritySubtext,
      icon: "Award",
      badgeStyle: {
        bgClass: "bg-purple-50",
        borderClass: "border-purple-200",
        textClass: "text-purple-950",
        labelClass: "text-purple-700",
        iconClass: "text-purple-600",
      },
    },
  ];
}

export const PastelMetricGrid: React.FC<PastelMetricGridProps> = ({
  vacancy,
  fitScore,
  metrics: explicitMetrics,
}) => {
  const metrics = explicitMetrics || buildPastelMetrics(vacancy, fitScore);

  const renderIcon = (iconName: string, iconClass: string) => {
    switch (iconName) {
      case "DollarSign":
        return <DollarSign className={`w-4 h-4 ${iconClass}`} />;
      case "MapPin":
        return <MapPin className={`w-4 h-4 ${iconClass}`} />;
      case "Briefcase":
        return <Briefcase className={`w-4 h-4 ${iconClass}`} />;
      case "Award":
        return <Award className={`w-4 h-4 ${iconClass}`} />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
      {metrics.map((m) => (
        <div
          key={m.id}
          className={`${m.badgeStyle.bgClass} ${m.badgeStyle.borderClass} border rounded-xl p-3 flex flex-col justify-between transition-all`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium uppercase tracking-wider ${m.badgeStyle.labelClass}`}>
              {m.label}
            </span>
            {renderIcon(m.icon, m.badgeStyle.iconClass)}
          </div>
          <div className={`text-sm font-bold truncate ${m.badgeStyle.textClass}`} title={m.value}>
            {m.value}
          </div>
          {m.subtext && (
            <span className={`text-[11px] truncate mt-0.5 opacity-80 ${m.badgeStyle.labelClass}`}>
              {m.subtext}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
