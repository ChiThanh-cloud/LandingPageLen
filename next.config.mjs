/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
  }
};

export default nextConfig;
