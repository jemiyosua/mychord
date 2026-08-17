import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyChord - Chord Library",
  description: "Manage and share your chord collections",
  openGraph: {
    title: "MyChord - Chord Library",
    description: "Manage and share your chord collections",
    siteName: "MyChord",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MyChord - Chord Library",
    description: "Manage and share your chord collections",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-gray-50">{children}</body>
    </html>
  );
}
