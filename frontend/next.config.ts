import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://ai-teach-atelier.onrender.com/api/:path*",
      },
    ];
  },
  images: {
    domains: ["res.cloudinary.com"],
  },
};

export default nextConfig;
