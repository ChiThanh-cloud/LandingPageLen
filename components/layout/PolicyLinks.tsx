import Link from "next/link";
import * as React from "react";
import { policyLinks } from "@/data/policy-routes";

export function PolicyLinks() {
  return (
    <>
      {policyLinks.map((link) => (
        <Link
          key={link.key}
          className="footer-policy-link"
          href={`/${link.slug}`}
          data-track={link.trackKey}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
