import React, { useMemo } from "react";
import type { TemplateProps } from "./TechnicalHighDensity";
import {
  useCVPagination,
  type MeasurableBlock,
} from "../../services/cv_pagination";
import { CVPageSheet } from "./CVPageSheet";
import { CertificateNameLink } from "./CertificateNameLink";

const SECTION_CONTINUED_LABELS: Record<string, string> = {
  experience: "Trayectoria Profesional (cont.)",
  projects: "Proyectos & Soluciones Técnicas (cont.)",
  certificates: "Certificaciones (cont.)",
  logros: "Logros Académicos (cont.)",
};

export const ModernExecutive: React.FC<TemplateProps> = ({
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
  const hasEducation = Boolean(content.education && content.education.length > 0);
  const hasCerts = Boolean(content.certificates && content.certificates.length > 0);
  const hasLogros = Boolean(content.logros_academicos && content.logros_academicos.length > 0);
  const hasLanguages = Boolean(content.languages && content.languages.length > 0);

  const projectRows = useMemo(() => {
    const projs = content.projects || [];
    const rows: Array<Array<{ item: (typeof projs)[number]; idx: number }>> = [];
    for (let i = 0; i < projs.length; i += 2) {
      const slice = [{ item: projs[i], idx: i }];
      if (projs[i + 1]) slice.push({ item: projs[i + 1], idx: i + 1 });
      rows.push(slice);
    }
    return rows;
  }, [content.projects]);

  const certRows = useMemo(() => {
    const certs = content.certificates || [];
    const rows: Array<typeof certs> = [];
    for (let i = 0; i < certs.length; i += 2) {
      rows.push(certs.slice(i, i + 2));
    }
    return rows;
  }, [content.certificates]);

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

    if (projectRows.length > 0) {
      list.push({ id: "proj-head", section: "projects", isHeading: true });
      projectRows.forEach((_, idx) => {
        list.push({ id: `proj-row-${idx}`, section: "projects" });
      });
    }

    if (hasSkills || hasEducation) {
      list.push({ id: "skills-edu" });
    }

    if (hasCerts && hasLogros) {
      list.push({ id: "certs-logros" });
    } else if (hasCerts) {
      list.push({ id: "cert-head", section: "certificates", isHeading: true });
      certRows.forEach((_, idx) => {
        list.push({ id: `cert-row-${idx}`, section: "certificates" });
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
    content.logros_academicos,
    projectRows,
    certRows,
    hasSkills,
    hasEducation,
    hasCerts,
    hasLogros,
    hasLanguages,
  ]);

  const depsKey = useMemo(
    () =>
      JSON.stringify({
        t: "modern",
        content,
        photoEnabled,
        hasPhoto: Boolean(photoUrl),
      }),
    [content, photoEnabled, photoUrl],
  );

  const { rootRef, pagination } = useCVPagination({
    depsKey,
    isTwoColumn: false,
    blocks,
    allowTwoPages,
    onPaginationChange,
  });

  const renderHeader = (variant: "p1" | "p2") => {
    const contactParts = [
      content.header.email,
      content.header.phone,
      content.header.location,
    ].filter(Boolean);

    return (
      <div
        data-cv-header={variant}
        className={`bg-zinc-900 text-white rounded-lg mb-3 flex items-center justify-between gap-4 print:rounded-none break-inside-avoid ${
          variant === "p1" ? "p-4" : "px-4 py-2.5"
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h1
              contentEditable={isEditable && variant === "p1"}
              suppressContentEditableWarning
              onBlur={(e) => handleBlur(["header", "full_name"], e)}
              className={`${
                variant === "p1" ? "text-2xl" : "text-lg"
              } font-extrabold tracking-tight uppercase`}
            >
              {content.header.full_name}
            </h1>
            {variant === "p2" && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex-shrink-0">
                Pág. 2
              </span>
            )}
          </div>
          <h2
            contentEditable={isEditable && variant === "p1"}
            suppressContentEditableWarning
            onBlur={(e) => handleBlur(["header", "headline"], e)}
            className="text-xs font-semibold text-emerald-400 tracking-wider mt-0.5"
          >
            {content.header.headline}
          </h2>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-zinc-400 mt-1.5">
            <span>{contactParts.join(" • ")}</span>
          </div>
          {content.header.links && content.header.links.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-emerald-400 mt-1">
              {content.header.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-emerald-300"
                >
                  {link.label}: {link.url.replace(/^https?:\/\//, "")}
                </a>
              ))}
            </div>
          )}
        </div>

        {photoEnabled && photoUrl && (
          <div
            className={`${
              variant === "p1" ? "w-20 h-20" : "w-12 h-12"
            } rounded-full overflow-hidden border-2 border-emerald-500/80 flex-shrink-0`}
          >
            <img
              src={photoUrl}
              alt={variant === "p1" ? "Avatar" : "Avatar página 2"}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    );
  };

  const renderSectionHeading = (id: string, title: string) => (
    <h3
      key={id}
      data-cv-block-id={id}
      className="text-xs font-bold text-zinc-900 uppercase tracking-widest border-b-2 border-zinc-900 pb-1 mt-1 first:mt-0 break-after-avoid"
    >
      {title}
    </h3>
  );

  const renderBlock = (id: string) => {
    if (id === "summary") {
      return (
        <div key={id} data-cv-block-id={id} className="break-inside-avoid">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest border-b-2 border-zinc-900 pb-1 mb-1.5 break-after-avoid">
            Perfil Profesional
          </h3>
          <p
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => handleBlur(["header", "about_me"], e)}
            className="text-zinc-700 text-[11.5px] leading-snug"
          >
            {content.header.about_me}
          </p>
        </div>
      );
    }

    if (id === "exp-head") return renderSectionHeading(id, "Trayectoria Profesional");
    if (id === "proj-head") return renderSectionHeading(id, "Proyectos & Soluciones Técnicas");
    if (id === "cert-head") return renderSectionHeading(id, "Certificaciones");
    if (id === "logros-head") return renderSectionHeading(id, "Logros Académicos");

    if (id.startsWith("exp-")) {
      const expIdx = Number(id.slice(4));
      const exp = content.experience?.[expIdx];
      if (!exp) return null;
      return (
        <div key={id} data-cv-block-id={id} className="border-l-2 border-zinc-200 pl-3 break-inside-avoid">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-zinc-950 text-xs">{exp.role}</span>
            <span className="text-[10.5px] text-zinc-500 font-medium">{exp.period}</span>
          </div>
          <div className="text-emerald-700 font-semibold text-[11px] mb-1">
            {exp.company} {exp.location ? `| ${exp.location}` : ""}
          </div>
          <ul className="list-disc ml-4 space-y-0.5 text-zinc-700 text-[11px]">
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

    if (id.startsWith("proj-row-")) {
      const rowIdx = Number(id.slice(9));
      const row = projectRows[rowIdx];
      if (!row) return null;
      return (
        <div
          key={id}
          data-cv-block-id={id}
          className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2.5 break-inside-avoid"
        >
          {row.map(({ item: proj, idx: projIdx }) => (
            <div key={projIdx} className="p-2.5 bg-zinc-50 rounded border border-zinc-200 break-inside-avoid">
              <div className="flex justify-between items-baseline gap-2">
                <div className="font-bold text-zinc-900 text-xs">{proj.name}</div>
                {proj.link && (
                  <a
                    href={proj.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 text-[10px] underline flex-shrink-0"
                  >
                    Demo / Repo
                  </a>
                )}
              </div>
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
                    onBlur={(e) =>
                      handleBlur(["projects", String(projIdx), "highlights", String(hlIdx)], e)
                    }
                  >
                    {hl}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }

    if (id === "skills-edu") {
      return (
        <div key={id} data-cv-block-id={id} className="grid grid-cols-12 gap-4 break-inside-avoid">
          {hasSkills && (
            <div className={hasEducation ? "col-span-7" : "col-span-12"}>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest border-b-2 border-zinc-900 pb-1 mb-1.5 break-after-avoid">
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
          )}

          {hasEducation && (
            <div className={hasSkills ? "col-span-5" : "col-span-12"}>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest border-b-2 border-zinc-900 pb-1 mb-1.5 break-after-avoid">
                Educación
              </h3>
              <div className="flex flex-col gap-1.5 text-[11px] text-zinc-700">
                {(content.education || []).map((edu, idx) => (
                  <div key={idx}>
                    <div className="font-bold text-zinc-900">{edu.degree}</div>
                    <div className="text-zinc-600">
                      {edu.institution} ({edu.period})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (id.startsWith("cert-row-")) {
      const rowIdx = Number(id.slice(9));
      const row = certRows[rowIdx];
      if (!row) return null;
      return (
        <div
          key={id}
          data-cv-block-id={id}
          className={`grid ${row.length > 1 ? "grid-cols-1 sm:grid-cols-2 print:grid-cols-2" : "grid-cols-1"} gap-2.5 break-inside-avoid`}
        >
          {row.map((c, idx) => (
            <div key={idx} className="p-2 bg-zinc-50 rounded border border-zinc-200 break-inside-avoid">
              <div className="font-bold text-zinc-900 text-[11px]">
                <CertificateNameLink
                  name={c.name}
                  url={c.url}
                  linkClassName="underline decoration-emerald-700/60 hover:text-emerald-700"
                />
              </div>
              <div className="text-zinc-600 text-[10.5px]">
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
        <div key={id} data-cv-block-id={id} className="text-[11px] text-zinc-700 break-inside-avoid">
          <div className="font-bold text-zinc-900">{logro.title}</div>
          <div className="text-zinc-600 text-[10.5px]">
            {logro.organization} ({logro.date})
          </div>
          {logro.description && <p className="text-zinc-700 text-[10.5px]">{logro.description}</p>}
        </div>
      );
    }

    if (id === "certs-logros") {
      return (
        <div
          key={id}
          data-cv-block-id={id}
          className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 break-inside-avoid"
        >
          {hasCerts && (
            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest border-b-2 border-zinc-900 pb-1 mb-1.5 break-after-avoid">
                Certificaciones
              </h3>
              <div className="flex flex-col gap-1.5 text-[11px] text-zinc-700">
                {content.certificates.map((c, i) => (
                  <div key={i} className="break-inside-avoid">
                    <div className="font-bold text-zinc-900">
                      <CertificateNameLink
                        name={c.name}
                        url={c.url}
                        linkClassName="underline decoration-emerald-700/60 hover:text-emerald-700"
                      />
                    </div>
                    <div className="text-zinc-600 text-[10.5px]">
                      {c.issuer} ({c.date})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasLogros && (
            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest border-b-2 border-zinc-900 pb-1 mb-1.5 break-after-avoid">
                Logros Académicos
              </h3>
              <div className="flex flex-col gap-1.5 text-[11px] text-zinc-700">
                {content.logros_academicos.map((logro, i) => (
                  <div key={i} className="break-inside-avoid">
                    <div className="font-bold text-zinc-900">{logro.title}</div>
                    <div className="text-zinc-600 text-[10.5px]">
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

    if (id === "languages" && hasLanguages) {
      return (
        <div key={id} data-cv-block-id={id} className="break-inside-avoid">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest border-b-2 border-zinc-900 pb-1 mb-1.5 break-after-avoid">
            Idiomas
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-700">
            {content.languages.map((l, idx) => (
              <span key={idx}>
                <strong className="text-zinc-900">{l.language}:</strong> {l.level}
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
    <div ref={rootRef} data-testid="modern-executive-template" className="text-xs leading-snug">
      <CVPageSheet pageNumber={1} totalPages={totalPages} fontClassName="font-sans">
        {renderHeader("p1")}
        <div data-cv-col="main" className="flex flex-col gap-2.5">
          {pagination.page1Ids.map((id) => renderBlock(id))}
        </div>
      </CVPageSheet>

      {totalPages === 2 && (
        <CVPageSheet pageNumber={2} totalPages={totalPages} fontClassName="font-sans">
          {renderHeader("p2")}
          <div data-cv-col="main" className="flex flex-col gap-2.5">
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
