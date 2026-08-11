import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    domains: [
      "inmuebles-alfgow.s3.mx-central-1.amazonaws.com",
      "as-s3-blog-images.s3.mx-central-1.amazonaws.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "inmuebles-alfgow.s3.mx-central-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "as-s3-blog-images.s3.mx-central-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
