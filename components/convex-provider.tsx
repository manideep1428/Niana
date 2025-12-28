"use client";

import { type PropsWithChildren } from "react";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({
  children,
}: PropsWithChildren<{ initialToken?: string | null }>) {
  return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
