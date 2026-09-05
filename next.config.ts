import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Exercise thumbnails are hotlinked from the source spreadsheet's single
    // media host (see TECHNICAL_SPEC.docx "Media" limitations — no assets are
    // mirrored). Add hosts here if a future import source introduces new ones.
    //
    // The exercise-partner-photos Vercel Blob store is different: it's a
    // fixed host we control (not a third-party site with its own bot
    // protection like cdn.muscleandstrength.com — see the exercise-thumbnail
    // Cloudflare fix, PROJECT_PLAN.docx item 61), so next/image's
    // server-side fetch-and-resize is safe to use here and needs this entry.
    remotePatterns: [
      { protocol: "https", hostname: "cdn.muscleandstrength.com" },
      { protocol: "https", hostname: "fyj10gijjvbx5cir.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
