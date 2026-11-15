import type { MexicanStateOption } from "../types/job";

export const MEXICAN_STATES: MexicanStateOption[] = [
  {
    code: "México",
    label: "Toda la República",
    fullName: "Toda la República (México)",
  },
  {
    code: "CDMX",
    label: "CDMX",
    fullName: "Ciudad de México (CDMX)",
  },
  {
    code: "JAL",
    label: "Jalisco",
    fullName: "Jalisco (GDL / Zapopan)",
  },
  {
    code: "NL",
    label: "Nuevo León",
    fullName: "Nuevo León (MTY / San Pedro)",
  },
  {
    code: "QRO",
    label: "Querétaro",
    fullName: "Querétaro (QRO)",
  },
  {
    code: "PUE",
    label: "Puebla",
    fullName: "Puebla (PUE)",
  },
  {
    code: "GTO",
    label: "Guanajuato",
    fullName: "Guanajuato (León)",
  },
  {
    code: "YUC",
    label: "Yucatán",
    fullName: "Yucatán (Mérida)",
  },
  {
    code: "BC",
    label: "Baja California",
    fullName: "Baja California (Tijuana)",
  },
  {
    code: "REMOTO",
    label: "100% Remoto",
    fullName: "100% Remoto (Nacional)",
  },
];

export function getMexicanStateOption(code: string): MexicanStateOption {
  const found = MEXICAN_STATES.find(
    (s) => s.code.toLowerCase() === code.toLowerCase()
  );
  return found || MEXICAN_STATES[0];
}
