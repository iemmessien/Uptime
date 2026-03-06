import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   basePath: "/uptime",

   eslint: {
      ignoreDuringBuilds: true,  // ← Add this
   },
};

export default nextConfig;
