"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import { ConvexProvider, ConvexReactClient } from "convex/react";

export default function Providers({ children }: { children: ReactNode }) {
  const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  return (
    <AuthKitProvider>
      <ConvexProvider client={convex}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </ConvexProvider>
    </AuthKitProvider>
  );
}
