import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { RegisterSW } from "@/components/register-sw";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReportaFácil",
  description: "Reporta daños de tu edificio en segundos.",
  appleWebApp: {
    capable: true,
    title: "ReportaFácil",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#dde9f5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body className="font-sans">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
