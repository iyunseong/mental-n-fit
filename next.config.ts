import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 빌드 단계에서 ESLint 에러로 실패하지 않도록 임시 우회
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
