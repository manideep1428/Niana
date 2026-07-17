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
      <meta name='impact-site-verification' content='01cf1a41-070b-4d48-9a2c-d2ccbd239f2b' />
      <meta name="d8fcb067c19d078b4f5877fbd1dd007ae422d5c1" content="d8fcb067c19d078b4f5877fbd1dd007ae422d5c1" />
      <Script src="https://waterloggedkind.com/dpmAF.zhdDG-NHv_ZmGvUj/tefm/9uufZhUXlskNPWTBclyfMtz/IEzIMDDrUEt/NxzyIKzDMhjRMKwGOJQa" strategy="afterInteractive" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lobsterTwo.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
