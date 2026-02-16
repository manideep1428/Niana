"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 relative border-t border-border/50 bg-background/50 backdrop-blur-md">
      <div className="container px-4 mx-auto flex flex-col items-center text-center gap-6">
        <Link
          href="/"
          className="font-bold text-2xl tracking-tighter flex items-center gap-2"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-400">
            Niana
          </span>
        </Link>

        <p className="text-muted-foreground text-sm max-w-md">
          Design mobile apps and websites at the speed of thought.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <Link
            href="/privacy"
            className="hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Terms of Service
          </Link>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <Link
            href="#"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Twitter className="size-5" />
          </Link>
          <Link
            href="#"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Github className="size-5" />
          </Link>
          <Link
            href="#"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Linkedin className="size-5" />
          </Link>
        </div>

        <p className="text-xs text-muted-foreground/60 mt-4">
          © {new Date().getFullYear()} Niana. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
