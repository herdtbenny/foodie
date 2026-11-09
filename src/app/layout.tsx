import type { Metadata, Viewport } from "next";
import { Figtree, Shrikhand } from "next/font/google";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
// Retro-Diner-Schrift für Logo, Titel und Restaurant-Namen (gibt es nur in einer Stärke)
const shrikhand = Shrikhand({ variable: "--font-shrikhand", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Foodie",
  description: "Die Restaurants von German und Evelyne – Wunschliste, Bewertungen und Karte.",
  appleWebApp: { capable: true, title: "Foodie", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Verhindert, dass iOS beim Tippen in Felder hineinzoomt und den Zoom behält.
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f1e7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${figtree.variable} ${shrikhand.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
