import React from "react";
import DOMPurify from "dompurify";
import { Briefcase, ListChecks, CheckCircle2, Gift, MapPin } from "lucide-react";
import type { StructuredJobDescription, ParsedJobSection } from "../types/job";

const ICON_MAP: Record<
  ParsedJobSection["iconName"],
  React.ComponentType<{ className?: string }>
> = {
  Briefcase,
  ListChecks,
  CheckCircle2,
  Gift,
  MapPin,
};

interface JobDescriptionViewerProps {
  structured: StructuredJobDescription;
}

export const JobDescriptionViewer: React.FC<JobDescriptionViewerProps> = ({
  structured,
}) => {
  if (!structured.sections || structured.sections.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs text-xs text-slate-500">
        Sin descripción disponible.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {structured.sections.map((section, idx) => {
        const Icon = ICON_MAP[section.iconName] || Briefcase;

        return (
          <div
            key={`${section.id}-${idx}`}
            className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <Icon className="w-4 h-4 text-slate-700 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {section.title}
              </h4>
            </div>

            <ul className="space-y-1.5">
              {section.items.map((item, itemIdx) => {
                const sanitized = DOMPurify.sanitize(item, {
                  ALLOWED_TAGS: ["b", "i", "em", "strong", "span", "code"],
                });

                return (
                  <li
                    key={itemIdx}
                    className="flex items-start gap-2 text-xs leading-relaxed text-slate-700"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                    <span
                      dangerouslySetInnerHTML={{ __html: sanitized }}
                      className="flex-1"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
};
