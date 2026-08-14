import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Bitcount_Single,
  Lobster_Two,
} from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import "@xyflow/react/dist/style.css";

import { Toaster } from "sonner";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lobsterTwo = Lobster_Two({
  variable: "--font-lobster-two",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Niana - Lovable for Designers",
  description: "The Lovable for designer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <meta name="google-adsense-account" content="ca-pub-4920930835929810"></meta>
      <meta name="monetag" content="7efc6357108d71f000fa6125c7b62ec0"/>
      <meta name="impact-site-verification" value="1a272538-980a-4c06-86d7-0704a8e13e52"/>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lobsterTwo.variable} antialiased`}
      >
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4920930835929810"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* mani */}
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-4920930835929810"
          data-ad-slot="7829819280"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <Script id="adsbygoogle-init" strategy="afterInteractive">
          {`(adsbygoogle = window.adsbygoogle || []).push({});`}
        </Script>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-format="autorelaxed"
          data-ad-client="ca-pub-4920930835929810"
          data-ad-slot="5403086630"
        />
        <Script id="adsbygoogle-init-2" strategy="afterInteractive">
          {`(adsbygoogle = window.adsbygoogle || []).push({});`}
        </Script>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
