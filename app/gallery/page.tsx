"use client";

import TopBar from "@/components/top-bar";
import { CommunitySection } from "@/components/community-section";

export default function GalleryPage() {
  return (
    <div className="relative min-h-screen bg-background selection:bg-primary/20">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 font-sans">
        <TopBar />

        <div className="flex flex-col min-h-screen pt-24 px-4 pb-10">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-12 text-center space-y-4 animate-in slide-in-from-bottom-4 duration-700 fade-in">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                Community Gallery
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore amazing designs created by the Niana community. Remix,
                learn, and get inspired.
              </p>
            </div>

            <CommunitySection />
          </div>
        </div>
      </div>
    </div>
  );
}
