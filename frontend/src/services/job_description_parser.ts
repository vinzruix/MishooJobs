import type {
  StructuredJobDescription,
  ParsedJobSection,
  StructuredJobSectionId,
} from "../types/job";

interface SectionDefinition {
  id: StructuredJobSectionId;
  title: string;
  iconName: "Briefcase" | "ListChecks" | "CheckCircle2" | "Gift" | "MapPin";
  patterns: RegExp[];
}

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    id: "responsibilities",
    title: "Responsabilidades y Funciones",
    iconName: "ListChecks",
    patterns: [
      /^responsabilidades(\s*y\s*funciones)?[:.]?$/i,
      /^funciones(\s*principales)?[:.]?$/i,
      /^actividades(\s*a\s*realizar)?[:.]?$/i,
      /^tareas[:.]?$/i,
      /^lo\s*que\s*har[aá]s[:.]?$/i,
      /^tu\s*rol[:.]?$/i,
      /^principales\s*funciones[:.]?$/i,
      /^descripci[oó]n\s*del\s*puesto[:.]?$/i,
    ],
  },
  {
    id: "requirements",
    title: "Requisitos y Conocimientos",
    iconName: "CheckCircle2",
    patterns: [
      /^requisitos(\s*(m[ií]nimos|del\s*puesto))?[:.]?$/i,
      /^perfil(\s*del\s*puesto)?[:.]?$/i,
      /^conocimientos(\s*requeridos)?[:.]?$/i,
      /^qu[eé]\s*buscamos[:.]?$/i,
      /^habilidades(\s*t[eé]cnicas)?[:.]?$/i,
      /^experiencia\s*requerida[:.]?$/i,
      /^competencias[:.]?$/i,
      /^lo\s*que\s*necesitas[:.]?$/i,
      /^skills[:.]?$/i,
    ],
  },
  {
    id: "benefits",
    title: "Beneficios y Prestaciones",
    iconName: "Gift",
    patterns: [
      /^beneficios[:.]?$/i,
      /^ofrecemos[:.]?$/i,
      /^prestaciones(\s*de\s*ley)?[:.]?$/i,
      /^qu[eé]\s*ofrecemos[:.]?$/i,
      /^compensaci[oó]n[:.]?$/i,
      /^lo\s*que\s*te\s*ofrecemos[:.]?$/i,
    ],
  },
  {
    id: "conditions",
    title: "Condiciones y Modalidad",
    iconName: "MapPin",
    patterns: [
      /^condiciones[:.]?$/i,
      /^horario(\s*y\s*zona)?[:.]?$/i,
      /^jornada(\s*laboral)?[:.]?$/i,
      /^lugar\s*de\s*trabajo[:.]?$/i,
      /^ubicaci[oó]n[:.]?$/i,
      /^tipo\s*de\s*contrato[:.]?$/i,
      /^modalidad(\s*de\s*trabajo)?[:.]?$/i,
    ],
  },
];

const BULLET_REGEX = /^(\s*[-*•▪▫–—]|\s*\d+[\.\)])\s*(.*)$/;

function decodeBasicHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function normalizeHtmlToLines(rawText: string): string[] {
  if (!rawText) return [];

  // Replace block tags and <br> with newlines
  const textWithNewlines = rawText
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    .replace(/<li>/gi, "\n- ")
    .replace(/<[^>]+>/g, ""); // strip remaining tags

  const decoded = decodeBasicHtmlEntities(textWithNewlines);

  return decoded
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function matchSectionHeader(line: string): SectionDefinition | null {
  const cleaned = line.replace(/^[#*_\s]+|[#*_\s:]+$/g, "").trim();
  for (const def of SECTION_DEFINITIONS) {
    for (const pattern of def.patterns) {
      if (pattern.test(cleaned) || pattern.test(line.trim())) {
        return def;
      }
    }
  }
  return null;
}

export function parseJobDescription(rawText: string): StructuredJobDescription {
  const lines = normalizeHtmlToLines(rawText);

  if (lines.length === 0) {
    return {
      hasStructuredSections: false,
      sections: [],
      rawText: rawText || "",
    };
  }

  const sections: {
    id: StructuredJobSectionId;
    title: string;
    iconName: "Briefcase" | "ListChecks" | "CheckCircle2" | "Gift" | "MapPin";
    items: string[];
  }[] = [];

  let currentSection: {
    id: StructuredJobSectionId;
    title: string;
    iconName: "Briefcase" | "ListChecks" | "CheckCircle2" | "Gift" | "MapPin";
    items: string[];
  } = {
    id: "overview",
    title: "Resumen del Puesto",
    iconName: "Briefcase",
    items: [],
  };

  let foundAnySpecializedHeader = false;

  for (const line of lines) {
    const matchedHeader = matchSectionHeader(line);

    if (matchedHeader) {
      foundAnySpecializedHeader = true;

      // If current section has items, save it
      if (currentSection.items.length > 0) {
        sections.push({ ...currentSection });
      }

      currentSection = {
        id: matchedHeader.id,
        title: matchedHeader.title,
        iconName: matchedHeader.iconName,
        items: [],
      };
    } else {
      // Check if bullet line
      const bulletMatch = line.match(BULLET_REGEX);
      if (bulletMatch) {
        const itemText = bulletMatch[2].trim();
        if (itemText) {
          currentSection.items.push(itemText);
        }
      } else {
        currentSection.items.push(line);
      }
    }
  }

  // Push the last section if it has items
  if (currentSection.items.length > 0) {
    sections.push({ ...currentSection });
  }

  // If no specialized headers were found, ensure we have the single overview fallback
  if (!foundAnySpecializedHeader) {
    return {
      hasStructuredSections: false,
      sections: [
        {
          id: "overview",
          title: "Resumen del Puesto",
          iconName: "Briefcase",
          items: sections.flatMap((s) => s.items),
        },
      ],
      rawText,
    };
  }

  return {
    hasStructuredSections: true,
    sections: sections.filter((s) => s.items.length > 0),
    rawText,
  };
}
