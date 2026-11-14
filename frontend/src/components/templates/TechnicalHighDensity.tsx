import React, { useMemo } from "react";
import type { GeneratedCVContent } from "../../types/resume";
import {
  useCVPagination,
  type CVPaginationInfo,
  type MeasurableBlock,
} from "../../services/cv_pagination";
import { CVPageSheet } from "./CVPageSheet";
import { CertificateNameLink } from "./CertificateNameLink";

export interface TemplateProps {
  content: GeneratedCVContent;
  photoUrl?: string | null;
  photoEnabled?: boolean;
  onFieldChange?: (path: string[], value: string) => void;
  isEditable?: boolean;
  allowTwoPages?: boolean;
  onPaginationChange?: (info: CVPaginationInfo) => void;
}

const SECTION_CONTINUED_LABELS: Record<string, string> = {
  experience: "Experiencia Laboral (cont.)",
  projects: "Proyectos Destacados (cont.)",
  education: "Educación (cont.)",
  certificates: "Certificaciones (cont.)",
  logros: "Logros Académicos (cont.)",
};

export const TechnicalHighDensity: React.FC<TemplateProps> = ({
  content,
  photoUrl,
  photoEnabled = true,
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
  const hasLanguages = Boolean(content.languages && content.languages.length > 0);
  const hasCerts = Boolean(content.certificates && content.certificates.length > 0);
  const hasLogros = Boolean(content.logros_academicos && content.logros_academicos.length > 0);

  const leftBlocks = useMemo<MeasurableBlock[]>(() => {
    const list: MeasurableBlock[] = [{ id: "left-contact" }];
    if (hasSkills) list.push({ id: "left-skills" });
    if (hasLanguages) list.push({ id: "left-languages" });
    return list;
  }, [hasSkills, hasLanguages]);

  const certPairs = useMemo(() => {
    const certs = content.certificates || [];
    const pairs: Array<typeof certs> = [];
    for (let i = 0; i < certs.length; i += 2) {
      pairs.push(certs.slice(i, i + 2));
    }
    return pairs;
  }, [content.certificates]);

  const rightBlocks = useMemo<MeasurableBlock[]>(() => {
    const list: MeasurableBlock[] = [];

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
      certPairs.forEach((_, idx) => {
        list.push({ id: `cert-row-${idx}`, section: "certificates" });
      });
    } else if (hasLogros) {
      list.push({ id: "logros-head", section: "logros", isHeading: true });
      content.logros_academicos.forEach((_, idx) => {
        list.push({ id: `logro-${idx}`, section: "logros" });
      });
    }

    return list;
  }, [
    content.experience,
    content.projects,
    content.education,
    content.logros_academicos,
    hasCerts,
    hasLogros,
    certPairs,
  ]);

  const depsKey = useMemo(
    () =>
      JSON.stringify({
        t: "technical",
        content,
        photoEnabled,
        hasPhoto: Boolean(photoUrl),
      }),
    [content, photoEnabled, photoUrl],
  );

  const { rootRef, pagination } = useCVPagination({
    depsKey,
    isTwoColumn: true,
    leftBlocks,
    rightBlocks,
    allowTwoPages,
    onPaginationChange,
  });

  const renderHeader = (variant: "p1" | "p2") => {
    if (variant === "p1") {
      return (
        <div data-cv-header="p1" className="border-b border-zinc-300 pb-3 mb-3 break-inside-avoid">
          <div className="flex items-start gap-4">
            {photoEnabled && photoUrl && (
              <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0 border border-zinc-300">
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
      );
    }

    return (
      <div data-cv-header="p2" className="border-b border-zinc-300 pb-2.5 mb-3 break-inside-avoid">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {photoEnabled && photoUrl && (
              <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border border-zinc-300">
                <img src={photoUrl} alt="Avatar página 2" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-base font-bold tracking-tight text-zinc-950 uppercase">
                {content.header.full_name}
              </div>
              <div className="text-[11px] font-semibold text-emerald-700 tracking-wide">
                {content.header.headline}
              </div>
              <div className="text-[10px] text-zinc-600 mt-0.5 flex flex-wrap gap-x-2">
                {[content.header.email, content.header.phone, content.header.location]
                  .filter(Boolean)
                  .join(" • ")}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex-shrink-0">
            Pág. 2
          </span>
        </div>
      </div>
    );
  };

  const renderLeftBlock = (id: string) => {
    if (id === "left-contact") {
      return (
        <div key={id} data-cv-block-id={id} className="break-inside-avoid">
          <h3 className="font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1.5 text-[10px] break-after-avoid">
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
            {content.header.links &&
              content.header.links.map((link, idx) => (
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
      );
    }

    if (id === "left-skills" && hasSkills) {
      return (
        <div key={id} data-cv-block-id={id} className="break-inside-avoid">
          <h3 className="font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1.5 text-[10px] break-after-avoid">
            Habilidades Técnicas
          </h3>
          <div className="flex flex-col gap-1.5 text-[10px]">
            {Object.entries(content.skills_categorized).map(([cat, skills]) => (
              <div key={cat} className="break-inside-avoid">
                <span className="font-semibold text-zinc-900 block">{cat}:</span>
                <span className="text-zinc-700">{skills.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (id === "left-languages" && hasLanguages) {
      return (
        <div key={id} data-cv-block-id={id} className="break-inside-avoid">
          <h3 className="font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1.5 text-[10px] break-after-avoid">
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
      );
    }

    return null;
  };

  const renderSectionHeading = (id: string, label: string) => (
    <h3
      key={id}
      data-cv-block-id={id}
      className="font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 text-[10px] break-after-avoid mt-1 first:mt-0"
    >
      {label}
    </h3>
  );

  const renderRightBlock = (id: string) => {
    if (id === "exp-head") return renderSectionHeading(id, "Experiencia Laboral");
    if (id === "proj-head") return renderSectionHeading(id, "Proyectos Destacados");
    if (id === "edu-head") return renderSectionHeading(id, "Educación");
    if (id === "cert-head") return renderSectionHeading(id, "Certificaciones");
    if (id === "logros-head") return renderSectionHeading(id, "Logros Académicos");

    if (id.startsWith("exp-")) {
      const expIdx = Number(id.slice(4));
      const exp = content.experience?.[expIdx];
      if (!exp) return null;
      return (
        <div key={id} data-cv-block-id={id} className="break-inside-avoid">
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

    if (id.startsWith("edu-")) {
      const eduIdx = Number(id.slice(4));
      const edu = content.education?.[eduIdx];
      if (!edu) return null;
      return (
        <div
          key={id}
          data-cv-block-id={id}
          className="flex justify-between items-baseline text-[10.5px] break-inside-avoid"
        >
          <div>
            <span className="font-bold text-zinc-900">{edu.degree}</span>
            <span className="text-zinc-700">, {edu.institution}</span>
            {edu.details && <span className="text-zinc-500 text-[10px]"> ({edu.details})</span>}
          </div>
          <span className="text-zinc-500 text-[10px] flex-shrink-0 ml-2">{edu.period}</span>
        </div>
      );
    }

    if (id.startsWith("cert-row-")) {
      const rowIdx = Number(id.slice(9));
      const pair = certPairs[rowIdx];
      if (!pair) return null;
      return (
        <div
          key={id}
          data-cv-block-id={id}
          className={`grid ${pair.length > 1 ? "grid-cols-2 gap-3" : "grid-cols-1"} text-[10px] text-zinc-700 break-inside-avoid`}
        >
          {pair.map((c, idx) => (
            <div key={idx} className="break-inside-avoid">
              <CertificateNameLink
                name={c.name}
                url={c.url}
                className="font-semibold text-zinc-900"
                linkClassName="underline decoration-emerald-700/60 hover:text-emerald-700"
              />
              <div className="text-zinc-500">
                {c.issuer} ({c.date})
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (id.startsWith("logro-")) {
      const logroIdx = Number(id.slice(6));
      const logro = content.logros_academicos?.[logroIdx];
      if (!logro) return null;
      return (
        <div key={id} data-cv-block-id={id} className="text-[10px] text-zinc-700 break-inside-avoid">
          <span className="font-semibold text-zinc-900">{logro.title}</span>
          <div className="text-zinc-500">
            {logro.organization} ({logro.date})
          </div>
        </div>
      );
    }

    if (id === "certs-logros") {
      return (
        <div key={id} data-cv-block-id={id} className="grid grid-cols-2 gap-4 break-inside-avoid">
          {hasCerts && (
            <div>
              <h3 className="font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1 text-[10px] break-after-avoid">
                Certificaciones
              </h3>
              <div className="flex flex-col gap-1 text-[10px] text-zinc-700">
                {content.certificates.map((c, i) => (
                  <div key={i} className="break-inside-avoid">
                    <CertificateNameLink
                      name={c.name}
                      url={c.url}
                      className="font-semibold text-zinc-900"
                      linkClassName="underline decoration-emerald-700/60 hover:text-emerald-700"
                    />
                    <div className="text-zinc-500">
                      {c.issuer} ({c.date})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasLogros && (
            <div>
              <h3 className="font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-0.5 mb-1 text-[10px] break-after-avoid">
                Logros Académicos
              </h3>
              <div className="flex flex-col gap-1 text-[10px] text-zinc-700">
                {content.logros_academicos.map((logro, i) => (
                  <div key={i} className="break-inside-avoid">
                    <span className="font-semibold text-zinc-900">{logro.title}</span>
                    <div className="text-zinc-500">
                      {logro.organization} ({logro.date})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const totalPages = pagination.pageCount;

  return (
    <div ref={rootRef} data-testid="technical-high-density-template" className="text-[11px] leading-tight">
      <CVPageSheet pageNumber={1} totalPages={totalPages} fontClassName="font-sans">
        {renderHeader("p1")}
        <div className="grid grid-cols-12 gap-5">
          <div
            data-cv-col="left"
            className="col-span-4 flex flex-col gap-3.5 border-r border-zinc-200 pr-3.5"
          >
            {pagination.leftPage1Ids.map((id) => renderLeftBlock(id))}
          </div>
          <div data-cv-col="right" className="col-span-8 flex flex-col gap-2">
            {pagination.rightPage1Ids.map((id) => renderRightBlock(id))}
          </div>
        </div>
      </CVPageSheet>

      {totalPages === 2 && (
        <CVPageSheet pageNumber={2} totalPages={totalPages} fontClassName="font-sans">
          {renderHeader("p2")}
          {pagination.leftPage2Ids.length > 0 ? (
            <div className="grid grid-cols-12 gap-5">
              <div
                data-cv-col="left"
                className="col-span-4 flex flex-col gap-3.5 border-r border-zinc-200 pr-3.5"
              >
                {pagination.leftPage2Ids.map((id) => renderLeftBlock(id))}
              </div>
              <div data-cv-col="right" className="col-span-8 flex flex-col gap-2">
                {pagination.continuedSections.map((sec) =>
                  renderSectionHeading(
                    `cont-${sec}`,
                    SECTION_CONTINUED_LABELS[sec] ?? sec,
                  ),
                )}
                {pagination.rightPage2Ids.map((id) => renderRightBlock(id))}
              </div>
            </div>
          ) : (
            <div data-cv-col="right" className="flex flex-col gap-2">
              {pagination.continuedSections.map((sec) =>
                renderSectionHeading(
                  `cont-${sec}`,
                  SECTION_CONTINUED_LABELS[sec] ?? sec,
                ),
              )}
              {pagination.rightPage2Ids.map((id) => renderRightBlock(id))}
            </div>
          )}
        </CVPageSheet>
      )}
    </div>
  );
};
