import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "inmuebles-alfgow.s3.mx-central-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
