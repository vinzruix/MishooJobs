import type { GeneratedCVContent } from "../types/resume";

/**
 * Formats CV content as unadorned, ATS-friendly plain text with uppercase headers,
 * unicode dashes, and pipe-delimited contact information (zero Markdown formatting).
 */
export function exportToPlainATS(cv: GeneratedCVContent): string {
  const parts: string[] = [];

  // Candidate Name & Headline
  parts.push(cv.header.full_name.toUpperCase());
  parts.push(cv.header.headline);
  parts.push("");

  // Contact Info
  parts.push("INFORMACIÓN DE CONTACTO");
  const contactLines: string[] = [];
  const primaryContact = [cv.header.email, cv.header.phone, cv.header.location]
    .filter(Boolean)
    .join(" | ");
  if (primaryContact) contactLines.push(primaryContact);

  if (cv.header.links && cv.header.links.length > 0) {
    const linkStr = cv.header.links.map((l) => `${l.label}: ${l.url}`).join(" | ");
    contactLines.push(linkStr);
  }
  parts.push(contactLines.join("\n"));
  parts.push("");

  // About Me / Summary
  if (cv.header.about_me) {
    parts.push("RESUMEN PROFESIONAL");
    parts.push(cv.header.about_me);
    parts.push("");
  }

  // Experience
  if (cv.experience && cv.experience.length > 0) {
    parts.push("EXPERIENCIA LABORAL");
    for (const exp of cv.experience) {
      const locStr = exp.location ? ` - ${exp.location}` : "";
      parts.push(`${exp.role} | ${exp.company}${locStr} | ${exp.period}`);
      for (const hl of exp.highlights || []) {
        parts.push(`- ${hl}`);
      }
      parts.push("");
    }
  }

  // Projects
  if (cv.projects && cv.projects.length > 0) {
    parts.push("PROYECTOS TÉCNICOS");
    for (const proj of cv.projects) {
      const linkStr = proj.link ? ` (${proj.link})` : "";
      const techStr = proj.technologies?.length ? ` [${proj.technologies.join(", ")}]` : "";
      parts.push(`${proj.name}${linkStr}${techStr}`);
      if (proj.description) {
        parts.push(proj.description);
      }
      for (const hl of proj.highlights || []) {
        parts.push(`- ${hl}`);
      }
      parts.push("");
    }
  }

  // Skills
  if (cv.skills_categorized && Object.keys(cv.skills_categorized).length > 0) {
    parts.push("HABILIDADES TÉCNICAS");
    for (const [cat, skills] of Object.entries(cv.skills_categorized)) {
      if (Array.isArray(skills) && skills.length > 0) {
        parts.push(`${cat}: ${skills.join(", ")}`);
      }
    }
    parts.push("");
  }

  // Education
  if (cv.education && cv.education.length > 0) {
    parts.push("EDUCACIÓN");
    for (const edu of cv.education) {
      const detStr = edu.details ? ` (${edu.details})` : "";
      parts.push(`${edu.degree} | ${edu.institution} | ${edu.period}${detStr}`);
    }
    parts.push("");
  }

  // Certificates
  if (cv.certificates && cv.certificates.length > 0) {
    parts.push("CERTIFICACIONES");
    for (const cert of cv.certificates) {
      parts.push(`${cert.name} - ${cert.issuer} (${cert.date})`);
    }
    parts.push("");
  }

  // Academic Achievements / Logros
  if (cv.logros_academicos && cv.logros_academicos.length > 0) {
    parts.push("LOGROS ACADÉMICOS");
    for (const logro of cv.logros_academicos) {
      parts.push(`${logro.title} | ${logro.organization} (${logro.date})`);
      if (logro.description) {
        parts.push(`- ${logro.description}`);
      }
    }
    parts.push("");
  }

  // Languages
  if (cv.languages && cv.languages.length > 0) {
    parts.push("IDIOMAS");
    const langStr = cv.languages.map((l) => `${l.language}: ${l.level}`).join(" | ");
    parts.push(langStr);
    parts.push("");
  }

  return parts.join("\n").trim();
}

/**
 * Formats CV content as GitHub Flavored Markdown.
 */
export function exportToMarkdown(cv: GeneratedCVContent): string {
  const parts: string[] = [];

  // Header
  parts.push(`# ${cv.header.full_name}`);
  parts.push(`**${cv.header.headline}**`);
  parts.push("");

  const contactPieces: string[] = [];
  if (cv.header.email) contactPieces.push(`Email: ${cv.header.email}`);
  if (cv.header.phone) contactPieces.push(`Tel: ${cv.header.phone}`);
  if (cv.header.location) contactPieces.push(`Ubicación: ${cv.header.location}`);
  if (cv.header.links && cv.header.links.length > 0) {
    for (const l of cv.header.links) {
      contactPieces.push(`[${l.label}](${l.url})`);
    }
  }
  parts.push(contactPieces.join(" | "));
  parts.push("");

  if (cv.header.about_me) {
    parts.push("## Resumen Profesional");
    parts.push(cv.header.about_me);
    parts.push("");
  }

  if (cv.experience && cv.experience.length > 0) {
    parts.push("## Experiencia Laboral");
    for (const exp of cv.experience) {
      const locStr = exp.location ? ` | ${exp.location}` : "";
      parts.push(`### ${exp.role} - ${exp.company}${locStr}`);
      parts.push(`*${exp.period}*`);
      for (const hl of exp.highlights || []) {
        parts.push(`- ${hl}`);
      }
      parts.push("");
    }
  }

  if (cv.projects && cv.projects.length > 0) {
    parts.push("## Proyectos Técnicos");
    for (const proj of cv.projects) {
      const linkStr = proj.link ? ` | [Enlace](${proj.link})` : "";
      parts.push(`### ${proj.name}${linkStr}`);
      if (proj.technologies?.length) {
        parts.push(`*Tecnologías: ${proj.technologies.join(", ")}*`);
      }
      if (proj.description) {
        parts.push(proj.description);
      }
      for (const hl of proj.highlights || []) {
        parts.push(`- ${hl}`);
      }
      parts.push("");
    }
  }

  if (cv.skills_categorized && Object.keys(cv.skills_categorized).length > 0) {
    parts.push("## Habilidades Técnicas");
    for (const [cat, skills] of Object.entries(cv.skills_categorized)) {
      if (Array.isArray(skills) && skills.length > 0) {
        parts.push(`- **${cat}**: ${skills.join(", ")}`);
      }
    }
    parts.push("");
  }

  if (cv.education && cv.education.length > 0) {
    parts.push("## Educación");
    for (const edu of cv.education) {
      const det = edu.details ? ` - ${edu.details}` : "";
      parts.push(`- **${edu.degree}**, ${edu.institution} (*${edu.period}*)${det}`);
    }
    parts.push("");
  }

  if (cv.certificates && cv.certificates.length > 0) {
    parts.push("## Certificaciones");
    for (const cert of cv.certificates) {
      parts.push(`- **${cert.name}** - ${cert.issuer} (${cert.date})`);
    }
    parts.push("");
  }

  if (cv.logros_academicos && cv.logros_academicos.length > 0) {
    parts.push("## Logros Académicos");
    for (const logro of cv.logros_academicos) {
      parts.push(`- **${logro.title}** - ${logro.organization} (${logro.date}): ${logro.description}`);
    }
    parts.push("");
  }

  if (cv.languages && cv.languages.length > 0) {
    parts.push("## Idiomas");
    for (const lang of cv.languages) {
      parts.push(`- ${lang.language}: ${lang.level}`);
    }
    parts.push("");
  }

  return parts.join("\n").trim();
}
