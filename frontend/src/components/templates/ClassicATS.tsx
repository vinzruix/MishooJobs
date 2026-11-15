import React, { useMemo } from "react";
import type { TemplateProps } from "./TechnicalHighDensity";
import {
  useCVPagination,
  type MeasurableBlock,
} from "../../services/cv_pagination";
import { CVPageSheet } from "./CVPageSheet";
import { CertificateNameLink } from "./CertificateNameLink";

const SECTION_CONTINUED_LABELS: Record<string, string> = {
  experience: "Experiencia Laboral (cont.)",
  projects: "Proyectos Técnicos (cont.)",
  education: "Educación (cont.)",
  certificates: "Certificaciones (cont.)",
  logros: "Logros Académicos (cont.)",
};

export const ClassicATS: React.FC<TemplateProps> = ({
  content,
  onFieldChange,
  isEditable = true,
  allowTwoPages = true,
  onPaginationChange,
}) => {
  const handleBlur = (path: string[], e: React.FocusEvent<HTMLElement>) => {
    if (!isEditable || !onFieldChange) return;
    const text = e.currentTarget.innerText.trim();
    onFieldChange(path, text);
  };

  const hasSkills = Boolean(
    content.skills_categorized && Object.keys(content.skills_categorized).length > 0,
  );
  const hasCerts = Boolean(content.certificates && content.certificates.length > 0);
  const hasLogros = Boolean(content.logros_academicos && content.logros_academicos.length > 0);
  const hasLanguages = Boolean(content.languages && content.languages.length > 0);

  const blocks = useMemo<MeasurableBlock[]>(() => {
    const list: MeasurableBlock[] = [];

    if (content.header.about_me) {
      list.push({ id: "summary" });
    }

    if (content.experience && content.experience.length > 0) {
      list.push({ id: "exp-head", section: "experience", isHeading: true });
      content.experience.forEach((_, idx) => {
        list.push({ id: `exp-${idx}`, section: "experience" });
      });
    }

    if (content.projects && content.projects.length > 0) {
      list.push({ id: "proj-head", section: "projects", isHeading: true });
      content.projects.forEach((_, idx) => {
        list.push({ id: `proj-${idx}`, section: "projects" });
      });
    }

    if (hasSkills) {
      list.push({ id: "skills" });
    }

    if (content.education && content.education.length > 0) {
      list.push({ id: "edu-head", section: "education", isHeading: true });
      content.education.forEach((_, idx) => {
        list.push({ id: `edu-${idx}`, section: "education" });
      });
    }

    if (hasCerts && hasLogros) {
      list.push({ id: "certs-logros" });
    } else if (hasCerts) {
      list.push({ id: "cert-head", section: "certificates", isHeading: true });
      content.certificates.forEach((_, idx) => {
        list.push({ id: `cert-${idx}`, section: "certificates" });
      });
    } else if (hasLogros) {
      list.push({ id: "logros-head", section: "logros", isHeading: true });
      content.logros_academicos.forEach((_, idx) => {
        list.push({ id: `logro-${idx}`, section: "logros" });
      });
    }

    if (hasLanguages) {
      list.push({ id: "languages" });
    }

    return list;
  }, [
    content.header.about_me,
    content.experience,
    content.projects,
    content.education,
    content.certificates,
    content.logros_academicos,
    hasSkills,
    hasCerts,
    hasLogros,
    hasLanguages,
  ]);

  const depsKey = useMemo(
    () => JSON.stringify({ t: "classic", content }),
    [content],
  );

  const { rootRef, pagination } = useCVPagination({
    depsKey,
    isTwoColumn: false,
    blocks,
    allowTwoPages,
    onPaginationChange,
  });

  const renderHeader = (variant: "p1" | "p2") => (
    <div
      data-cv-header={variant}
      className={`text-center border-b border-zinc-400 break-inside-avoid relative ${
        variant === "p1" ? "pb-2.5 mb-3" : "pb-2 mb-3"
      }`}
    >
      {variant === "p2" && (
        <span className="absolute right-0 top-0 text-[10px] font-sans font-semibold uppercase tracking-wider text-zinc-400">
          Pág. 2
        </span>
      )}
      <h1
        contentEditable={isEditable && variant === "p1"}
        suppressContentEditableWarning
        onBlur={(e) => handleBlur(["header", "full_name"], e)}
        className={`${variant === "p1" ? "text-2xl" : "text-lg"} font-bold tracking-wider uppercase text-zinc-950 font-sans`}
      >
        {content.header.full_name}
      </h1>
      <div
        contentEditable={isEditable && variant === "p1"}
        suppressContentEditableWarning
        onBlur={(e) => handleBlur(["header", "headline"], e)}
        className="text-xs font-semibold text-zinc-700 tracking-wide mt-0.5"
      >
        {content.header.headline}
      </div>
      <div className="text-[11px] text-zinc-600 mt-0.5">
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
  );

  const renderSectionHeading = (id: string, title: string) => (
    <h2
      key={id}
      data-cv-block-id={id}
      className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mt-1 first:mt-0 font-sans break-after-avoid"
    >
      {title}
    </h2>
  );

  const renderBlock = (id: string) => {
    if (id === "summary") {
      return (
        <div key={id} data-cv-block-id={id} className="break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1 font-sans break-after-avoid">
            Resumen Profesional
          </h2>
          <p
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => handleBlur(["header", "about_me"], e)}
            className="text-[11px] text-zinc-800 leading-snug"
          >
            {content.header.about_me}
          </p>
        </div>
      );
    }

    if (id === "exp-head") return renderSectionHeading(id, "Experiencia Laboral");
    if (id === "proj-head") return renderSectionHeading(id, "Proyectos Técnicos");
    if (id === "edu-head") return renderSectionHeading(id, "Educación");
    if (id === "cert-head") return renderSectionHeading(id, "Certificaciones");
    if (id === "logros-head") return renderSectionHeading(id, "Logros Académicos");

    if (id.startsWith("exp-")) {
      const expIdx = Number(id.slice(4));
      const exp = content.experience?.[expIdx];
      if (!exp) return null;
      return (
        <div key={id} data-cv-block-id={id} className="break-inside-avoid">
          <div className="flex justify-between items-baseline font-sans">
            <span className="font-bold text-xs text-zinc-900">
              {exp.role} — {exp.company}
            </span>
            <span className="text-[11px] text-zinc-600">{exp.period}</span>
          </div>
          {exp.location && (
            <div className="text-[10px] text-zinc-500 italic mb-0.5">{exp.location}</div>
          )}
          <ul className="list-disc ml-5 space-y-0.5 text-[11px] text-zinc-800">
            {exp.highlights.map((hl, hlIdx) => (
              <li
                key={hlIdx}
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) =>
                  handleBlur(["experience", String(expIdx), "highlights", String(hlIdx)], e)
                }
              >
                {hl}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (id.startsWith("proj-")) {
      const projIdx = Number(id.slice(5));
      const proj = content.projects?.[projIdx];
      if (!proj) return null;
      return (
        <div key={id} data-cv-block-id={id} className="break-inside-avoid">
          <div className="flex justify-between items-baseline font-sans">
            <span className="font-bold text-xs text-zinc-900">{proj.name}</span>
            {proj.link && <span className="text-[10px] text-zinc-500">{proj.link}</span>}
          </div>
          {proj.technologies && (
            <div className="text-[10.5px] text-zinc-600 italic">
              Tecnologías: {proj.technologies.join(", ")}
            </div>
          )}
          {proj.description && (
            <p className="text-[11px] text-zinc-700 mt-0.5">{proj.description}</p>
          )}
          <ul className="list-disc ml-5 space-y-0.5 text-[11px] text-zinc-800 mt-0.5">
            {proj.highlights.map((hl, hlIdx) => (
              <li
                key={hlIdx}
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) =>
                  handleBlur(["projects", String(projIdx), "highlights", String(hlIdx)], e)
                }
              >
                {hl}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (id === "skills" && hasSkills) {
      return (
        <div key={id} data-cv-block-id={id} className="break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1 font-sans break-after-avoid">
            Habilidades Técnicas
          </h2>
          <div className="flex flex-col gap-0.5 text-[11px] text-zinc-800">
            {Object.entries(content.skills_categorized).map(([cat, skills]) => (
              <div key={cat}>
                <span className="font-bold font-sans">{cat}: </span>
                <span>{skills.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (id.startsWith("edu-")) {
      const eduIdx = Number(id.slice(4));
      const edu = content.education?.[eduIdx];
      if (!edu) return null;
      return (
        <div
          key={id}
          data-cv-block-id={id}
          className="flex justify-between text-[11px] break-inside-avoid"
        >
          <span>
            <strong>{edu.degree}</strong>, {edu.institution}
            {edu.details ? ` (${edu.details})` : ""}
          </span>
          <span className="text-zinc-600 flex-shrink-0 ml-2">{edu.period}</span>
        </div>
      );
    }

    if (id.startsWith("cert-")) {
      const certIdx = Number(id.slice(5));
      const c = content.certificates?.[certIdx];
      if (!c) return null;
      return (
        <div key={id} data-cv-block-id={id} className="text-[11px] text-zinc-800 break-inside-avoid">
          <strong>
            <CertificateNameLink
              name={c.name}
              url={c.url}
              linkClassName="underline decoration-zinc-400 hover:text-zinc-700"
            />
          </strong>{" "}
          — {c.issuer} ({c.date})
        </div>
      );
    }

    if (id.startsWith("logro-")) {
      const logroIdx = Number(id.slice(6));
      const logro = content.logros_academicos?.[logroIdx];
      if (!logro) return null;
      return (
        <div key={id} data-cv-block-id={id} className="text-[11px] text-zinc-800 break-inside-avoid">
          <strong>{logro.title}</strong> — {logro.organization} ({logro.date})
        </div>
      );
    }

    if (id === "certs-logros") {
      return (
        <div key={id} data-cv-block-id={id} className="grid grid-cols-2 gap-4 break-inside-avoid">
          {hasCerts && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1 font-sans break-after-avoid">
                Certificaciones
              </h2>
              {content.certificates.map((c, i) => (
                <div key={i} className="text-[11px] text-zinc-800 break-inside-avoid">
                  <strong>
                    <CertificateNameLink
                      name={c.name}
                      url={c.url}
                      linkClassName="underline decoration-zinc-400 hover:text-zinc-700"
                    />
                  </strong>{" "}
                  — {c.issuer} ({c.date})
                </div>
              ))}
            </div>
          )}

          {hasLogros && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1 font-sans break-after-avoid">
                Logros Académicos
              </h2>
              {content.logros_academicos.map((logro, i) => (
                <div key={i} className="text-[11px] text-zinc-800 break-inside-avoid">
                  <strong>{logro.title}</strong> — {logro.organization} ({logro.date})
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (id === "languages" && hasLanguages) {
      return (
        <div key={id} data-cv-block-id={id} className="break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1 font-sans break-after-avoid">
            Idiomas
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-zinc-800">
            {content.languages.map((l, idx) => (
              <span key={idx}>
                <strong className="font-sans">{l.language}:</strong> {l.level}
              </span>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const totalPages = pagination.pageCount;

  return (
    <div ref={rootRef} data-testid="classic-ats-template" className="text-xs leading-snug">
      <CVPageSheet pageNumber={1} totalPages={totalPages} fontClassName="font-serif">
        {renderHeader("p1")}
        <div data-cv-col="main" className="flex flex-col gap-2">
          {pagination.page1Ids.map((id) => renderBlock(id))}
        </div>
      </CVPageSheet>

      {totalPages === 2 && (
        <CVPageSheet pageNumber={2} totalPages={totalPages} fontClassName="font-serif">
          {renderHeader("p2")}
          <div data-cv-col="main" className="flex flex-col gap-2">
            {pagination.continuedSections.map((sec) =>
              renderSectionHeading(
                `cont-${sec}`,
                SECTION_CONTINUED_LABELS[sec] ?? sec,
              ),
            )}
            {pagination.page2Ids.map((id) => renderBlock(id))}
          </div>
        </CVPageSheet>
      )}
    </div>
  );
};
