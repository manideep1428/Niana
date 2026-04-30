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
import Head from "next/head";

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
      <Head>
        <meta name='impact-site-verification' content='4f365d3e-7adf-49bd-a17c-14bacac71101' />
      </Head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lobsterTwo.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
