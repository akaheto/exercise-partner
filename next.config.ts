import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Exercise thumbnails are hotlinked from the source spreadsheet's single
    // media host (see TECHNICAL_SPEC.docx "Media" limitations — no assets are
    // mirrored). Add hosts here if a future import source introduces new ones.
    remotePatterns: [{ protocol: "https", hostname: "cdn.muscleandstrength.com" }],
  },
};

export default nextConfig;
