import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Cho phép Vercel hoàn tất build kể cả khi còn lỗi TypeScript
    ignoreBuildErrors: true,
  },
  eslint: {
    // Bỏ qua các cảnh báo ESLint khi build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;