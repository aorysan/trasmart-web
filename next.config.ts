import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/auth/login",
        destination: "/pages/auth/login",
      },
      {
        source: "/auth/register",
        destination: "/pages/auth/register",
      },
      {
        source: "/dashboard",
        destination: "/pages/dashboard",
      },
      {
        source: "/account",
        destination: "/pages/account",
      },
      {
        source: "/reward",
        destination: "/pages/reward",
      },
    ];
  },
};

export default nextConfig;
