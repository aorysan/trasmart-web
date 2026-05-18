import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/auth/login",        destination: "/pages/auth/login" },
      { source: "/auth/register",     destination: "/pages/auth/register" },
      { source: "/dashboard",         destination: "/pages/dashboard" },
      { source: "/account",           destination: "/pages/account" },
      { source: "/reward",            destination: "/pages/reward" },
      { source: "/masukkan-kode",     destination: "/pages/masukkan-kode" },
    ];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.icons8.com",
      },
    ],
  },
};

export default nextConfig;
