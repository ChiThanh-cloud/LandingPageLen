"use client";

import type { ReactNode } from "react";
import { trackSiteEvent } from "@/lib/siteTracking";

type TrackedExternalLinkProps = {
  href: string;
  trackKey: string;
  label: string;
  children: ReactNode;
  className?: string;
  id?: string;
  ariaLabel?: string;
};

export function TrackedExternalLink({
  href,
  trackKey,
  label,
  children,
  className,
  id,
  ariaLabel
}: TrackedExternalLinkProps) {
  return (
    <a
      href={href}
      id={id}
      className={className}
      target="_blank"
      rel="noopener"
      aria-label={ariaLabel}
      data-track={trackKey}
      data-track-handled="true"
      onClick={() =>
        trackSiteEvent(trackKey, {
          label,
          href
        })
      }
    >
      {children}
    </a>
  );
}
