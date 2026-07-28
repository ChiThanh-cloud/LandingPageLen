import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  async redirects() {
    return [
      {
        source: "/index.html",
        destination: "/",
        statusCode: 301
      },
      {
        source: "/blog.html",
        destination: "/blog",
        statusCode: 301
      },
      {
        source: "/posts/:slug.html",
        destination: "/blog/:slug",
        statusCode: 301
      },
      {
        source: "/san-pham/:slug.html",
        destination: "/san-pham/:slug",
        statusCode: 301
      }
    ];
  },
  async headers() {
    return [
      {
        // Force text/xml for sitemap — Google Sitemap parser requires this MIME type
        source: "/sitemap.xml",
        headers: [
          {
            key: "Content-Type",
            value: "text/xml; charset=utf-8"
          }
        ]
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      }
    ]
  }
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [
      "remark-gfm",
      "remark-frontmatter",
      ["remark-mdx-frontmatter", { name: "frontmatter" }]
    ]
  }
});

export default withMDX(nextConfig);
