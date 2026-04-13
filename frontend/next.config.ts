import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root:".",
  },
  async rewrites() {
    const backendOrigin = (
      process.env.BACKEND_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:4000"
    )
      .replace(/\/api\/?$/, "")
      .replace(/\/+$/, "");

    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
