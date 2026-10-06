import type { Metadata, Viewport } from "next";
import { Playfair_Display, Jost } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display", weight: ["400", "600", "800"], style: ["normal", "italic"] });
const body = Jost({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = { title: "Hollywood Birthday Awards", description: "30 Years of Fame – unsere persönliche Award Night.", robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: "#070605", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="stage" aria-hidden><div className="beam a" /><div className="beam b" /></div>
        {children}
      </body>
    </html>
  );
}
