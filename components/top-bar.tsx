"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "@workos-inc/authkit-nextjs";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, LayoutDashboard, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export default function TopBar() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 animate-in slide-in-from-top-4 fade-in duration-500">
      <div className="mx-auto max-w-7xl">
        {/* Liquid glass effect - light/dark adaptive */}
        <div className="relative rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 px-6 py-3 shadow-lg backdrop-blur-xl transition-all hover:bg-white/70 dark:hover:bg-black/30 before:absolute before:inset-0 before:rounded-2xl before:bg-linear-to-b before:from-white/20 before:to-transparent before:pointer-events-none dark:before:from-white/5">
          <div className="flex items-center justify-between relative">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <Link href="/" className="group flex items-center gap-2">
                <div className="relative h-8 w-8 overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-110">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    fill
                    className="object-cover"
                  />
                </div>
                <h1 className="text-lg font-sans tracking-tight bg-linear-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Niana
                </h1>
              </Link>
            </div>

            {/* User Section */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-black/70 dark:text-white/70 transition-colors hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">My Projects</span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                    className="h-9 w-9 rounded-lg text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white"
                  >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none">
                      <div className="rounded-full ring-2 ring-black/10 dark:ring-white/10 transition-all hover:ring-black/30 dark:hover:ring-white/30 hover:scale-105 active:scale-95">
                        <Avatar className="h-9 w-9 cursor-pointer border border-black/10 dark:border-white/10">
                          <AvatarImage
                            src={user?.profilePictureUrl || ""}
                            alt={user?.firstName || "User"}
                          />
                          <AvatarFallback className="bg-linear-to-br from-indigo-500 to-purple-500 text-xs text-white">
                            {user?.firstName?.charAt(0) ||
                              user?.email?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/80 px-2 py-2 text-black/90 dark:text-white/90 backdrop-blur-xl"
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none text-black dark:text-white">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs leading-none text-black/50 dark:text-white/50">
                            {user?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-black/10 dark:bg-white/10" />
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard"
                          className="cursor-pointer rounded-lg px-2 py-1.5 text-sm text-black/70 dark:text-white/70 transition-colors hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white"
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          My Projects
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-1.5 text-sm text-black/70 dark:text-white/70 transition-colors hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => signOut()}
                        className="cursor-pointer rounded-lg px-2 py-1.5 text-sm text-red-500 dark:text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 focus:bg-red-500/10 focus:text-red-600 dark:focus:text-red-300"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/sign-in"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-black/70 dark:text-white/70 transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="rounded-lg bg-black dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-black transition-transform hover:scale-105 active:scale-95"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
