import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";
import "./globals.css";

const display = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], variable: "--f-display" });
const body = Jost({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-body" });

export const metadata: Metadata = {
  title: "Karim & Dana · Gender Reveal",
  description: "You're invited to find out: boy or girl? Choose your side and RSVP.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
