"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSidebar } from "@/components/global-sidebar";

export function AppLayout({ children, sidebarWidth }: { children: React.ReactNode, sidebarWidth?: string }) {
    return (
        <SidebarProvider
            className="overflow-x-hidden w-full max-w-[100vw]"
            style={sidebarWidth ? { "--sidebar-width": sidebarWidth } as React.CSSProperties : undefined}
        >
            <GlobalSidebar />
            <SidebarInset className="bg-background transition-all duration-300 ease-in-out w-full overflow-x-hidden max-w-[100vw]">
                {/* Mobile Trigger provided inside specific pages or here if needed globally */}
                <div className="md:hidden p-4 sticky top-0 bg-background z-10 border-b flex items-center gap-2">
                    <SidebarTrigger />
                    <span className="font-semibold text-lg">Niana</span>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 w-full h-full">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
