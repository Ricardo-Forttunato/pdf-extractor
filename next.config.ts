import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdfjs-dist", "tesseract.js", "@napi-rs/canvas"]
};
export default nextConfig;
