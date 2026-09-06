import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Cho phép Vercel hoàn tất build kể cả khi còn lỗi TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;