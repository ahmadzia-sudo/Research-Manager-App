import type { Metadata } from "next";
import "@fontsource-variable/source-serif-4/opsz.css";
import "@fontsource-variable/public-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manuscript Desk",
  description: "Track research papers, authors, journals and funding.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
