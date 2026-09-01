import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "That Eye Place Sales Pricing",
  description: "Quick guided pricing for frames, complete pairs, modifiers, and additional pairs.",
  openGraph: {
    title: "That Eye Place Sales",
    description: "Quick, accurate optical pricing.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "That Eye Place Sales" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "That Eye Place Sales",
    description: "Quick, accurate optical pricing.",
    images: ["/og.png"],
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
