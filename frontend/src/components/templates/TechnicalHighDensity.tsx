import React from "react";
import type { GeneratedCVContent } from "../../types/resume";

export interface TemplateProps {
  content: GeneratedCVContent;
  photoUrl?: string | null;
  photoEnabled?: boolean;
  onFieldChange?: (path: string[], value: string) => void;
  isEditable?: boolean;
}

export const TechnicalHighDensity: React.FC<TemplateProps> = ({
  content,
  photoUrl,
  photoEnabled = true,
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
      data-testid="technical-high-density-template"
      className="bg-white text-zinc-900 font-sans p-6 text-[11px] leading-tight max-w-[8.5in] min-h-[11in] mx-auto shadow-md print:shadow-none print:p-0 select-text"
    >
      {/* Header (Full width) */}
      <div className="border-b border-zinc-300 pb-3 mb-3">
        <div className="flex items-start gap-4">
          {photoEnabled && photoUrl && (
            <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0 border border-zinc-300 shadow-xs">
              <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => handleBlur(["header", "full_name"], e)}
              className="text-xl font-bold tracking-tight text-zinc-950 uppercase"
            >
              {content.header.full_name}
            </h1>
            <h2
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => handleBlur(["header", "headline"], e)}
              className="text-xs font-semibold text-emerald-700 tracking-wide mb-1"
            >
              {content.header.headline}
            </h2>
            <p
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => handleBlur(["header", "about_me"], e)}
              className="text-zinc-700 leading-snug text-[10.5px]"
            >
              {content.header.about_me}
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Body */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left Column (~35% -> col-span-4) */}
        <div className="col-span-4 flex flex-col gap-3.5 border-r border-zinc-200 pr-3.5">
          {/* Contact */}
          <div>
            <h3 className="font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1.5 text-[10px]">
              Contacto
            </h3>
            <div className="flex flex-col gap-0.5 text-zinc-700 text-[10px]">
              <span
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => handleBlur(["header", "email"], e)}
              >
                {content.header.email}
              </span>
              <span
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => handleBlur(["header", "phone"], e)}
              >
                {content.header.phone}
              </span>
              <span
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => handleBlur(["header", "location"], e)}
              >
                {content.header.location}
              </span>
              {content.header.links && content.header.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 underline truncate block"
                >
                  {link.label}: {link.url.replace(/^https?:\/\//, "")}
                </a>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          {content.skills_categorized && Object.keys(content.skills_categorized).length > 0 && (
            <div>
              <h3 className="font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1.5 text-[10px]">
                Habilidades Técnicas
              </h3>
              <div className="flex flex-col gap-1.5 text-[10px]">
                {Object.entries(content.skills_categorized).map(([cat, skills]) => (
                  <div key={cat}>
                    <span className="font-semibold text-zinc-900 block">{cat}:</span>
                    <span className="text-zinc-700">{skills.join(", ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {content.languages && content.languages.length > 0 && (
            <div>
              <h3 className="font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1.5 text-[10px]">
                Idiomas
              </h3>
              <div className="flex flex-col gap-0.5 text-[10px] text-zinc-700">
                {content.languages.map((l, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="font-medium text-zinc-900">{l.language}</span>
                    <span>{l.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (~65% -> col-span-8) */}
        <div className="col-span-8 flex flex-col gap-3.5">
          {/* Experience */}
          {content.experience && content.experience.length > 0 && (
            <div>
              <h3 className="font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-2 text-[10px]">
                Experiencia Laboral
              </h3>
              <div className="flex flex-col gap-2.5">
                {content.experience.map((exp, expIdx) => (
                  <div key={expIdx}>
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-zinc-950 text-[11px]">{exp.role}</span>
                      <span className="text-zinc-500 text-[10px]">{exp.period}</span>
                    </div>
                    <div className="text-emerald-800 font-semibold text-[10.5px]">
                      {exp.company} {exp.location ? `• ${exp.location}` : ""}
                    </div>
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-zinc-700 text-[10.5px]">
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
            <div>
              <h3 className="font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-2 text-[10px]">
                Proyectos Destacados
              </h3>
              <div className="flex flex-col gap-2">
                {content.projects.map((proj, projIdx) => (
                  <div key={projIdx}>
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-zinc-950 text-[11px]">{proj.name}</span>
                      {proj.link && (
                        <a
                          href={proj.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 text-[10px] underline"
                        >
                          Demo / Repo
                        </a>
                      )}
                    </div>
                    {proj.technologies && (
                      <div className="text-[10px] text-zinc-600 italic">
                        {proj.technologies.join(" • ")}
                      </div>
                    )}
                    <p className="text-zinc-700 text-[10px] mt-0.5">{proj.description}</p>
                    <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-zinc-700 text-[10.5px]">
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

          {/* Education */}
          {content.education && content.education.length > 0 && (
            <div>
              <h3 className="font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1.5 text-[10px]">
                Educación
              </h3>
              <div className="flex flex-col gap-1 text-[10.5px]">
                {content.education.map((edu, idx) => (
                  <div key={idx} className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-zinc-900">{edu.degree}</span>
                      <span className="text-zinc-700">, {edu.institution}</span>
                      {edu.details && <span className="text-zinc-500 text-[10px]"> ({edu.details})</span>}
                    </div>
                    <span className="text-zinc-500 text-[10px]">{edu.period}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificates & Achievements */}
          {(content.certificates?.length > 0 || content.logros_academicos?.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              {content.certificates && content.certificates.length > 0 && (
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1 text-[10px]">
                    Certificaciones
                  </h3>
                  <div className="flex flex-col gap-1 text-[10px] text-zinc-700">
                    {content.certificates.map((c, i) => (
                      <div key={i}>
                        <span className="font-semibold text-zinc-900">{c.name}</span>
                        <div className="text-zinc-500">{c.issuer} ({c.date})</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.logros_academicos && content.logros_academicos.length > 0 && (
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1 text-[10px]">
                    Logros Académicos
                  </h3>
                  <div className="flex flex-col gap-1 text-[10px] text-zinc-700">
                    {content.logros_academicos.map((logro, i) => (
                      <div key={i}>
                        <span className="font-semibold text-zinc-900">{logro.title}</span>
                        <div className="text-zinc-500">{logro.organization} ({logro.date})</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
