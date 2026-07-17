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
      <Script src="https://gullible-thanks.com/bg3.V/0nPo3/pVvYbMmDVfJ/ZODx0d3/M/jmMvyuNdT-Eyz/LGTZcfydM/z/It1-MvTScL" />
      <Script
        id="ad-inline-loader"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(inbnw){
              var d = document,
                  s = d.createElement('script'),
                  l = d.scripts[d.scripts.length - 1];
              s.settings = inbnw || {};
              s.src = "//grounded-opposite.com/b/XhVKs.d/GDlJ0KYKW/c-/OeFm/9/uiZyUClVkUPkTkcQy/MwzOIi1lMljvEGtINtz/I/z/MAjjU_ycNkQi";
              s.async = true;
              s.referrerPolicy = "no-referrer-when-downgrade";
              if (l && l.parentNode) {
                l.parentNode.insertBefore(s, l);
              }
            })({})
          `,
        }}
      />
      <Script
        id="ad-inline-loader-2"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(xassj){
              var d = document,
                  s = d.createElement('script'),
                  l = d.scripts[d.scripts.length - 1];
              s.settings = xassj || {};
              s.src = "//grounded-opposite.com/b.XUVTsHd-GQl/0TYVWFcD/_egmU9zuIZkUMlGk/PJTpclyJMJzLIU1INjD/UNt/NMzOIMzEMJjlUF0/OnQl";
              s.async = true;
              s.referrerPolicy = "no-referrer-when-downgrade";
              if (l && l.parentNode) {
                l.parentNode.insertBefore(s, l);
              }
            })({})
          `,
        }}
      />
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lobsterTwo.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
