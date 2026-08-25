import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  async redirects() {
    return [
      {
        source: "/san-pham/len-soi",
        destination: "/len-soi",
        statusCode: 301
      },
      {
        source: "/len-soi/milk-bo-40",
        destination: "/len-soi/milk-bo",
        statusCode: 301
      },
      {
        source: "/len-soi/mac-den-39",
        destination: "/len-soi/mac-den",
        statusCode: 301
      },
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
      },
      {
        source: "/admin.html",
        destination: "/admin/login",
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
      },
      {
        protocol: "https",
        hostname: "bizweb.dktcdn.net",
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
