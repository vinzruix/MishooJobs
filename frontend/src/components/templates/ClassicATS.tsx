import React from "react";
import type { TemplateProps } from "./TechnicalHighDensity";

export const ClassicATS: React.FC<TemplateProps> = ({
  content,
  onFieldChange,
  isEditable = true,
}) => {
  const handleBlur = (path: string[], e: React.FocusEvent<HTMLElement>) => {
    if (!isEditable || !onFieldChange) return;
    const text = e.currentTarget.innerText.trim();
    onFieldChange(path, text);
  };

  return (
    <div
      data-testid="classic-ats-template"
      className="bg-white text-zinc-900 font-serif p-8 text-xs leading-normal max-w-[8.5in] min-h-[11in] mx-auto shadow-md print:shadow-none print:p-0 select-text"
    >
      {/* Header */}
      <div className="text-center border-b border-zinc-400 pb-3 mb-4">
        <h1
          contentEditable={isEditable}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur(["header", "full_name"], e)}
          className="text-2xl font-bold tracking-wider uppercase text-zinc-950 font-sans"
        >
          {content.header.full_name}
        </h1>
        <div
          contentEditable={isEditable}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur(["header", "headline"], e)}
          className="text-xs font-semibold text-zinc-700 tracking-wide mt-0.5"
        >
          {content.header.headline}
        </div>
        <div className="text-[11px] text-zinc-600 mt-1">
          {[content.header.email, content.header.phone, content.header.location]
            .filter(Boolean)
            .join(" • ")}
        </div>
        {content.header.links && content.header.links.length > 0 && (
          <div className="text-[10px] text-zinc-600 mt-0.5">
            {content.header.links.map((l) => `${l.label}: ${l.url}`).join(" | ")}
          </div>
        )}
      </div>

      {/* Summary */}
      {content.header.about_me && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1.5 font-sans">
            Resumen Profesional
          </h2>
          <p
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => handleBlur(["header", "about_me"], e)}
            className="text-[11px] text-zinc-800 leading-relaxed"
          >
            {content.header.about_me}
          </p>
        </div>
      )}

      {/* Experience */}
      {content.experience && content.experience.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-2 font-sans">
            Experiencia Laboral
          </h2>
          <div className="flex flex-col gap-3">
            {content.experience.map((exp, expIdx) => (
              <div key={expIdx}>
                <div className="flex justify-between items-baseline font-sans">
                  <span className="font-bold text-xs text-zinc-900">{exp.role} — {exp.company}</span>
                  <span className="text-[11px] text-zinc-600">{exp.period}</span>
                </div>
                {exp.location && <div className="text-[10px] text-zinc-500 italic mb-1">{exp.location}</div>}
                <ul className="list-disc ml-5 space-y-1 text-[11px] text-zinc-800">
                  {exp.highlights.map((hl, hlIdx) => (
                    <li
                      key={hlIdx}
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(e) => handleBlur(["experience", String(expIdx), "highlights", String(hlIdx)], e)}
                    >
                      {hl}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {content.projects && content.projects.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-2 font-sans">
            Proyectos Técnicos
          </h2>
          <div className="flex flex-col gap-2.5">
            {content.projects.map((proj, projIdx) => (
              <div key={projIdx}>
                <div className="flex justify-between items-baseline font-sans">
                  <span className="font-bold text-xs text-zinc-900">{proj.name}</span>
                  {proj.link && <span className="text-[10px] text-zinc-500">{proj.link}</span>}
                </div>
                {proj.technologies && (
                  <div className="text-[10.5px] text-zinc-600 italic">
                    Tecnologías: {proj.technologies.join(", ")}
                  </div>
                )}
                {proj.description && <p className="text-[11px] text-zinc-700 mt-0.5">{proj.description}</p>}
                <ul className="list-disc ml-5 space-y-0.5 text-[11px] text-zinc-800 mt-1">
                  {proj.highlights.map((hl, hlIdx) => (
                    <li
                      key={hlIdx}
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(e) => handleBlur(["projects", String(projIdx), "highlights", String(hlIdx)], e)}
                    >
                      {hl}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {content.skills_categorized && Object.keys(content.skills_categorized).length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1.5 font-sans">
            Habilidades Técnicas
          </h2>
          <div className="flex flex-col gap-1 text-[11px] text-zinc-800">
            {Object.entries(content.skills_categorized).map(([cat, skills]) => (
              <div key={cat}>
                <span className="font-bold font-sans">{cat}: </span>
                <span>{skills.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {content.education && content.education.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1.5 font-sans">
            Educación
          </h2>
          <div className="flex flex-col gap-1 text-[11px]">
            {content.education.map((edu, idx) => (
              <div key={idx} className="flex justify-between">
                <span><strong>{edu.degree}</strong>, {edu.institution}</span>
                <span className="text-zinc-600">{edu.period}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications & Logros */}
      {(content.certificates?.length > 0 || content.logros_academicos?.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {content.certificates && content.certificates.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1 font-sans">
                Certificaciones
              </h2>
              {content.certificates.map((c, i) => (
                <div key={i} className="text-[11px] text-zinc-800">
                  <strong>{c.name}</strong> — {c.issuer} ({c.date})
                </div>
              ))}
            </div>
          )}

          {content.logros_academicos && content.logros_academicos.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1 font-sans">
                Logros Académicos
              </h2>
              {content.logros_academicos.map((logro, i) => (
                <div key={i} className="text-[11px] text-zinc-800">
                  <strong>{logro.title}</strong> — {logro.organization} ({logro.date})
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
