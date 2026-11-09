import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
// Logo, Titel und Restaurant-Namen: schlicht, mit etwas Charakter
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

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
    <html lang="de" className={`${figtree.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
