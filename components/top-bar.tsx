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
import { LogOut, User, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TopBar() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 animate-in slide-in-from-top-4 fade-in duration-500">
      <div className="mx-auto max-w-7xl">
        <div className="relative rounded-2xl border border-white/10 bg-black/20 px-6 py-3 shadow-lg backdrop-blur-xl transition-all hover:bg-black/30">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <Link href="/" className="group flex items-center gap-2">
                {/* <div className="relative h-8 w-8 overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-110">
                  <Image
                    src="/logo.svg"
                    alt="Logo"
                    fill
                    className="object-cover dark:invert"
                  />
                </div> */}
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
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
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">My Projects</span>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none">
                      <div className="rounded-full ring-2 ring-white/10 transition-all hover:ring-white/30 hover:scale-105 active:scale-95">
                        <Avatar className="h-9 w-9 cursor-pointer border border-white/10">
                          <AvatarImage src={user?.profilePictureUrl || ""} alt={user?.firstName || "User"} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-xs text-white">
                            {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 rounded-xl border border-white/10 bg-black/80 px-2 py-2 text-white/90 backdrop-blur-xl"
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none text-white">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs leading-none text-white/50">{user?.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard"
                          className="cursor-pointer rounded-lg px-2 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white"
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          My Projects
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => signOut()}
                        className="cursor-pointer rounded-lg px-2 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300"
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
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-transform hover:scale-105 active:scale-95"
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
