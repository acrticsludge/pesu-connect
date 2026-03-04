import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "./NavBar";
import { Toaster } from "react-hot-toast";
import { QueryProvider } from "@/providers/QueryProvider";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import Link from "next/link";
import { Book, MessageCircle } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "PESU Connect - PES Events & Clubs",
    template: "%s | PESU Connect",
  },
  description:
    "Stay updated with all college events, club activities, and competitions in one place. Never miss out on what's happening at PES.",
  keywords: [
    "PES University",
    "college events",
    "student clubs",
    "campus activities",
    "PESU",
  ],
  authors: [{ name: "PESU Connect" }],
  creator: "PESU Connect",
  publisher: "PESU Connect",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PESU Connect - PES Events & Clubs",
    description:
      "Stay updated with all college events, club activities, and competitions in one place.",
    url: "/",
    siteName: "PESU Connect",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PESU Connect",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PESU Connect - PES Events & Clubs",
    description:
      "Stay updated with all college events, club activities, and competitions in one place.",
    images: ["/og-image.png"],
    creator: "@pesuconnect",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
        />
        <meta name="theme-color" content="#7C3AED" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="PESU Connect" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen`}
      >
        <QueryProvider>
          <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/50 border-b border-white/10">
            <NavBar />
          </div>
          <main className="pt-24 pb-2 min-h-screen">{children}</main>

          <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
            <Link
              href="https://github.com/acrticsludge/pesu-connect/wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              aria-label="Wiki"
            >
              <Book className="w-5 h-5" />
              <span className="absolute right-full mr-3 px-3 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-gray-800 shadow-lg">
                Wiki
              </span>
            </Link>

            <Link
              href="https://docs.google.com/forms/d/e/1FAIpQLSeCTzYaeX9bvw83sEkOr3YaGCG3H0U2CFIJPfuYyyMryIwSHA/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              aria-label="Feedback"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="absolute right-full mr-3 px-3 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-gray-800 shadow-lg">
                Feedback
              </span>
            </Link>
          </div>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#111",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.75rem",
                padding: "1rem",
              },
              success: {
                iconTheme: {
                  primary: "#7C3AED",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
          {process.env.NODE_ENV === "production" && (
            <>
              <Analytics />
              <Script
                src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
                strategy="afterInteractive"
              />
              <Script id="google-analytics" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', 'G-XXXXXXXXXX');
                `}
              </Script>
            </>
          )}
        </QueryProvider>
      </body>
    </html>
  );
}
