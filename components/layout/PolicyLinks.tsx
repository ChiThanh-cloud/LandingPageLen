import Link from "next/link";
import * as React from "react";
import { policies, policyLinks } from "@/data/policies";

export function PolicyLinks() {
  return (
    <>
      {policyLinks.map((link) => (
        <Link
          key={link.key}
          className="footer-policy-link"
          href={`/${policies[link.key].slug}`}
          data-track={link.trackKey}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
