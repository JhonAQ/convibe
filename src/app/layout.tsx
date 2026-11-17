import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { RegisterSW } from "@/components/register-sw";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ConVibe",
  description: "Reporta los daños de tu edificio en segundos.",
  appleWebApp: {
    capable: true,
    title: "ConVibe",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#dcebf8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={outfit.variable}>
      <body className="font-sans">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
