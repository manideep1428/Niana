"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarSeparator,
    SidebarRail,
    SidebarMenuAction,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    LayoutDashboard,
    Compass,
    CreditCard,
    Plus,
    Clock,
    LogOut,
    Moon,
    Sun,
    User,
    ChevronsUpDown,
    Sparkles,
    MoreHorizontal,
    Pencil,
    Trash,
    Share,
    Pin,
    PinOff,
    Star,
    ChevronRight,
    Search,
} from "lucide-react";
import { useMutation } from "convex/react";
import { Input } from "@/components/ui/input";
import { InviteMemberDialog } from "@/components/invite-member-dialog";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import Image from "next/image";
import { TOKENS_PER_CREDIT, tokensToCredits } from "@/lib/razorpay";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar";

export function GlobalSidebar(props: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const { theme, setTheme } = useTheme();

    // Queries
    const subscription = useQuery(
        api.quires.getUserSubscription,
        user ? { user_id: user.id } : "skip"
    );

    const recentProjects = useQuery(
        api.quires.getUserProjects,
        user ? { user_id: user.id } : "skip"
    );

    // Mutations
    const togglePin = useMutation(api.mutations.toggleProjectPin);
    const toggleFavorite = useMutation(api.mutations.toggleProjectFavorite);
    const deleteProject = useMutation(api.mutations.deleteProject);
    const renameProject = useMutation(api.mutations.renameProject);

    // State for actions
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editTitle, setEditTitle] = React.useState("");
    const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
    const [selectedProject, setSelectedProject] = React.useState<{ id: string, title: string } | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");

    // Handlers
    const handlePin = async (e: React.MouseEvent, projectId: string) => {
        e.preventDefault();
        e.stopPropagation();
        await togglePin({ project_id: projectId });
    };

    const handleFavorite = async (e: React.MouseEvent, projectId: string) => {
        e.preventDefault();
        e.stopPropagation();
        await toggleFavorite({ project_id: projectId });
    };

    const handleDelete = async (e: React.MouseEvent, projectId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this project?")) {
            try {
                await deleteProject({ project_id: projectId });
                toast.success("Project deleted");
            } catch (error) {
                toast.error("Failed to delete project");
            }
        }
    };

    const startRename = (e: React.MouseEvent, project: any) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingId(project.project_id);
        setEditTitle(project.title);
    };

    const handleRenameSubmit = async () => {
        if (editingId && editTitle.trim()) {
            try {
                await renameProject({ project_id: editingId, title: editTitle.trim() });
                setEditingId(null);
                toast.success("Project renamed");
            } catch (error) {
                toast.error("Failed to rename project");
            }
        } else {
            setEditingId(null);
        }
    };

    const handleShare = (e: React.MouseEvent, project: any) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedProject({ id: project.project_id, title: project.title });
        setInviteDialogOpen(true);
    };

    // Credit Calculations
    const totalTokens = subscription?.tokens_total ?? TOKENS_PER_CREDIT;
    const usedTokens = subscription?.tokens_used ?? 0;
    const remainingTokens = Math.max(0, totalTokens - usedTokens);
    const creditsRemaining = tokensToCredits(remainingTokens);
    const creditsTotal = tokensToCredits(totalTokens);
    const usagePercent = Math.min(100, (usedTokens / totalTokens) * 100);
    const isLowBalance = creditsRemaining < 1;

    // Filtered Projects
    const allProjects = recentProjects || [];
    const historyProjects = allProjects.slice(0, 5); // Top 5 recent
    const starredProjects = allProjects.filter(p => p.is_favorite); // Favorites

    // Search Filter
    const filteredSearchProjects = searchQuery
        ? allProjects.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
        : [];

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="p-4 bg-background group-data-[collapsible=icon]:p-2">
                {/* Logo and Toggle */}
                <div className="flex items-center justify-between px-1 mb-4 group-data-[collapsible=icon]:mb-2 group-data-[collapsible=icon]:justify-center">
                    <Link href="/" className="flex items-center gap-2 group group-data-[collapsible=icon]:hidden">
                        <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                            <Image
                                src="/logo-brand.png"
                                alt="Niana"
                                fill
                                className="object-cover scale-150"
                            />
                        </div>
                        <span className="font-bold text-xl tracking-tight">
                            Niana
                        </span>
                    </Link>
                    <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                </div>

                {/* Credits Card (Top Most Details) */}
                {user && (
                    <div className="rounded-xl bg-muted/50 p-3 transition-all group-data-[collapsible=icon]:hidden">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Credits</span>
                            <span className={cn("text-xs font-bold", isLowBalance ? "text-red-500" : "text-foreground")}>
                                {creditsRemaining.toFixed(1)} / {creditsTotal.toFixed(0)}
                            </span>
                        </div>

                        <div>
                            <Progress value={usagePercent} className="h-1.5 mb-3" />
                            <Button asChild size="sm" className="w-full bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-none shadow-sm text-white">
                                <Link href="/pricing">
                                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                                    Upgrade Plan
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {/* New Project */}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Create New">
                                    <Link href="/">
                                        <Plus className="w-4 h-4" />
                                        <span>New Project</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/* Search Option */}
                            <SidebarMenuItem className="mt-2 group-data-[collapsible=icon]:hidden">
                                <div className="px-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search projects..."
                                            className="h-8 pl-8 text-xs bg-sidebar-accent/50 border-sidebar-border"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {searchQuery && (
                                    <div className="mt-1 px-2 space-y-1">
                                        {filteredSearchProjects.length > 0 ? (
                                            filteredSearchProjects.map(p => (
                                                <Button key={p.project_id} variant="ghost" size="sm" className="w-full justify-start h-7 text-xs px-2" asChild>
                                                    <Link href={`/design/${p.project_id}`}>
                                                        <span className="truncate">{p.title}</span>
                                                    </Link>
                                                </Button>
                                            ))
                                        ) : (
                                            <div className="text-xs text-muted-foreground px-2">No results</div>
                                        )}
                                    </div>
                                )}
                            </SidebarMenuItem>

                            <SidebarSeparator className="my-2" />

                            {/* Recents Dropdown */}
                            <Collapsible defaultOpen className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip="Recent History">
                                            <Clock className="w-4 h-4" />
                                            <span>Recent History</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {historyProjects.length > 0 ? (
                                                historyProjects.map(project => (
                                                    <SidebarMenuSubItem key={project.project_id}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === `/design/${project.project_id}`}>
                                                            <Link href={`/design/${project.project_id}`}>
                                                                <span className="line-clamp-1">{project.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-1 text-xs text-muted-foreground">No recent projects</div>
                                            )}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>

                            {/* All Projects */}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/dashboard"} tooltip="All Projects">
                                    <Link href="/dashboard">
                                        <LayoutDashboard className="w-4 h-4" />
                                        <span>All Projects</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/* Starred Dropdown */}
                            <Collapsible className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip="Starred">
                                            <Star className="w-4 h-4" />
                                            <span>Starred</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {starredProjects.length > 0 ? (
                                                starredProjects.map(project => (
                                                    <SidebarMenuSubItem key={project.project_id}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === `/design/${project.project_id}`}>
                                                            <Link href={`/design/${project.project_id}`}>
                                                                <span className="line-clamp-1">{project.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-1 text-xs text-muted-foreground">No starred projects</div>
                                            )}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>

                            <SidebarSeparator className="my-2" />

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/explore"} tooltip="Explore">
                                    <Link href="/explore">
                                        <Compass className="w-4 h-4" />
                                        <span>Explore Community</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === "/pricing"} tooltip="Pricing">
                                    <Link href="/pricing">
                                        <CreditCard className="w-4 h-4" />
                                        <span>Pricing</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4 bg-background border-t">
                {user ? (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        size="lg"
                                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                    >
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarImage src={user.profilePictureUrl || ""} alt={user.firstName || ""} />
                                            <AvatarFallback className="rounded-lg">
                                                {user.firstName?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                            <span className="truncate font-semibold">{user.firstName} {user.lastName}</span>
                                            <span className="truncate text-xs">{user.email}</span>
                                        </div>
                                        <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                                    side="bottom"
                                    align="end"
                                    sideOffset={4}
                                >
                                    <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                                        {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                                        Toggle Theme
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <User className="mr-2 h-4 w-4" />
                                        Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => signOut()}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                ) : (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild size="lg" className="border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground">
                                <Link href="/sign-in">
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <User className="size-4" />
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                        <span className="truncate font-semibold">Sign In</span>
                                        <span className="truncate text-xs">Access your account</span>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
            </SidebarFooter>
            <SidebarRail />

            {/* Context Dialogs */}
            {selectedProject && (
                <InviteMemberDialog
                    projectId={selectedProject.id}
                    open={inviteDialogOpen}
                    onOpenChange={setInviteDialogOpen}
                />
            )}
        </Sidebar>
    );
}
