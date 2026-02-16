import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arnold AI | Financial & Health Sentinel",
  description: "Experience elite financial education and precision health insurance management with Arnold AI.",
  icons: {
    icon: "/profile.jpg",
  },
  openGraph: {
    title: "Arnold AI | Financial & Health Sentinel",
    description: "Experience elite financial education and precision health insurance management with Arnold AI.",
    images: [{ url: "/preview.png" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arnold AI | Financial & Health Sentinel",
    description: "Experience elite financial education and precision health insurance management with Arnold AI.",
    images: ["/preview.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={outfit.variable}>
        {children}
      </body>
    </html>
  );
}
