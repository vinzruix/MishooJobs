import React from "react";
import { getSafeExternalUrl } from "../../services/cv_links";

interface CertificateNameLinkProps {
  name: string;
  url?: string;
  className?: string;
  linkClassName?: string;
}

/**
 * Renders a certificate title as an external hyperlink when a safe http(s) URL is present,
 * ensuring browser print-to-PDF exports generate clickable link annotations.
 */
export const CertificateNameLink: React.FC<CertificateNameLinkProps> = ({
  name,
  url,
  className,
  linkClassName = "underline",
}) => {
  const safeUrl = getSafeExternalUrl(url);
  if (!safeUrl) {
    return <span className={className}>{name}</span>;
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noreferrer"
      className={[className, linkClassName].filter(Boolean).join(" ")}
    >
      {name}
    </a>
  );
};
