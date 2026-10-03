import type { MetadataRoute } from "next";

/** PWA manifest — installable, full-screen standalone launch. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ThoughtPad — Brain Dump & Quick Capture",
    short_name: "ThoughtPad",
    description:
      "A quiet, distraction-free notepad for lightning-fast brain dumps.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF9F6",
    theme_color: "#FAF9F6",
    categories: ["productivity", "notes", "utilities"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
