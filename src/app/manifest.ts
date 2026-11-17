import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ConVibe",
    short_name: "ConVibe",
    description: "Reporta los daños de tu edificio en segundos.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f6fb",
    theme_color: "#dcebf8",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
