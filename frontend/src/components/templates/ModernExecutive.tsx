import React from "react";
import type { TemplateProps } from "./TechnicalHighDensity";

export const ModernExecutive: React.FC<TemplateProps> = ({
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
      data-testid="modern-executive-template"
      className="bg-white text-zinc-900 font-sans p-8 text-xs leading-normal max-w-[8.5in] min-h-[11in] mx-auto shadow-md print:shadow-none print:p-0 select-text"
    >
      {/* Executive Header Banner */}
      <div className="bg-zinc-900 text-white p-6 rounded-lg mb-6 flex items-center justify-between gap-6 print:rounded-none">
        <div className="flex-1">
          <h1
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => handleBlur(["header", "full_name"], e)}
            className="text-2xl font-extrabold tracking-tight uppercase"
          >
            {content.header.full_name}
          </h1>
          <h2
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => handleBlur(["header", "headline"], e)}
            className="text-xs font-semibold text-emerald-400 tracking-wider mt-1"
          >
            {content.header.headline}
          </h2>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-400 mt-2">
            <span>{content.header.email}</span>
            <span>•</span>
            <span>{content.header.phone}</span>
            <span>•</span>
            <span>{content.header.location}</span>
          </div>
        </div>

        {photoEnabled && photoUrl && (
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500/80 flex-shrink-0">
            <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Summary */}
      {content.header.about_me && (
        <div className="mb-5">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest border-b-2 border-zinc-900 pb-1 mb-2">
            Perfil Profesional
          </h3>
          <p
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => handleBlur(["header", "about_me"], e)}
            className="text-zinc-700 text-[11.5px] leading-relaxed"
          >
            {content.header.about_me}
          </p>
        </div>
      )}

      {/* Experience */}
      {content.experience && content.experience.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest border-b-2 border-zinc-900 pb-1 mb-3">
            Trayectoria Profesional
          </h3>
          <div className="flex flex-col gap-3.5">
            {content.experience.map((exp, expIdx) => (
              <div key={expIdx} className="border-l-2 border-zinc-200 pl-3.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-zinc-950 text-xs">{exp.role}</span>
                  <span className="text-[10.5px] text-zinc-500 font-medium">{exp.period}</span>
                </div>
                <div className="text-emerald-700 font-semibold text-[11px] mb-1">
                  {exp.company} {exp.location ? `| ${exp.location}` : ""}
                </div>
                <ul className="list-disc ml-4 space-y-1 text-zinc-700 text-[11px]">
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
        <div className="mb-5">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest border-b-2 border-zinc-900 pb-1 mb-3">
            Proyectos & Soluciones Técnicas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {content.projects.map((proj, projIdx) => (
              <div key={projIdx} className="p-3 bg-zinc-50 rounded border border-zinc-200">
                <div className="font-bold text-zinc-900 text-xs">{proj.name}</div>
                {proj.technologies && (
                  <div className="text-[10px] text-zinc-500 italic mt-0.5">
                    {proj.technologies.join(", ")}
                  </div>
                )}
                {proj.description && (
                  <p className="text-zinc-700 text-[10.5px] mt-1">{proj.description}</p>
                )}
                <ul className="list-disc ml-3.5 space-y-0.5 text-zinc-700 text-[10.5px] mt-1">
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

      {/* Skills & Education side-by-side */}
      <div className="grid grid-cols-12 gap-5 mb-5">
        <div className="col-span-7">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest border-b-2 border-zinc-900 pb-1 mb-2">
            Competencias Técnicas
          </h3>
          <div className="flex flex-col gap-1 text-[11px] text-zinc-700">
            {Object.entries(content.skills_categorized || {}).map(([cat, skills]) => (
              <div key={cat}>
                <strong className="text-zinc-900">{cat}: </strong>
                <span>{skills.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-5">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest border-b-2 border-zinc-900 pb-1 mb-2">
            Educación
          </h3>
          <div className="flex flex-col gap-1.5 text-[11px] text-zinc-700">
            {(content.education || []).map((edu, idx) => (
              <div key={idx}>
                <div className="font-bold text-zinc-900">{edu.degree}</div>
                <div className="text-zinc-600">{edu.institution} ({edu.period})</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
