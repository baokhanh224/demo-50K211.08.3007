import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  devIndicators: false,
  outputFileTracingIncludes: {
    "/api/**/*": ["./public/fonts/**/*", "./node_modules/pdfkit/js/data/**/*"],
  },
  allowedDevOrigins: ["*.proxy.local", "*.codex.ai"],
};
export default config;
