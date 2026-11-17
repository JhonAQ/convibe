import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ReportaFácil",
    short_name: "ReportaFácil",
    description: "Reporta daños de tu edificio en segundos.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef4fa",
    theme_color: "#dde9f5",
    orientation: "portrait",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
