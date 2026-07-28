import type { AnchorHTMLAttributes } from "react";
import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { BlogCallout } from "@/components/blog/mdx/BlogCallout";
import { BlogImage } from "@/components/blog/mdx/BlogImage";
import { BlogRelatedPosts } from "@/components/blog/mdx/BlogRelatedPosts";
import { BlogSection } from "@/components/blog/mdx/BlogSection";

function MdxLink({
  href = "",
  children,
  className,
  title,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} title={title}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={className}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );
}

const blogMdxComponents: MDXComponents = {
  a: MdxLink,
  ul: ({ children }) => <ul className="blog-list">{children}</ul>,
  BlogSection,
  BlogCallout,
  BlogImage,
  BlogRelatedPosts
};

export function useMDXComponents(): MDXComponents {
  return blogMdxComponents;
}
