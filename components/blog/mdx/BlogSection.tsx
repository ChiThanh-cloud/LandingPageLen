import type { ReactNode } from "react";

export function BlogSection({ children }: { children: ReactNode }) {
  return <section className="blog-content-card">{children}</section>;
}
