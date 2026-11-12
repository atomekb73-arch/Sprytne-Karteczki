import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PwaRegister } from "@/components/PwaRegister";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "Sprytne Karteczki — Karteczki WSKZ",
    template: "%s | Sprytne Karteczki WSKZ",
  },
  description:
    "Ultralekka wirtualna tablica pomysłów i burz mózgów (LIFO) dla Kół Naukowych oraz Samorządu Studenckiego WSKZ.",
  manifest: "/manifest.json",
  applicationName: "Sprytne Karteczki WSKZ",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Karteczki WSKZ",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1C1917",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-stone-100 text-stone-900">
        <ToastProvider>
          <PwaRegister />
          <OfflineBanner />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
