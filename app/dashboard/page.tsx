"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/top-bar";
import {
  Smartphone,
  MoreHorizontal,
  Trash2,
  Pencil,
  Star,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function formatTimeAgo(dateString: string) {
  const date = new Date(parseInt(dateString));
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Created today";
  if (diffDays === 1) return "Created yesterday";
  if (diffDays < 7) return `Created ${diffDays} days ago`;
  if (diffDays < 30)
    return `Created ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  if (diffDays < 365)
    return `Created ${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
  return `Created ${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""} ago`;
}

// Separate component that uses useSearchParams
function PaymentSuccessHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success(
        "Payment successful! Your subscriptions have been updated.",
      );
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  return null;
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "favourites">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const projects = useQuery(
    api.quires.getUserProjects,
    user?.id ? { user_id: user.id } : "skip",
  );

  const deleteProject = useMutation(api.mutations.deleteProject);
  const renameProject = useMutation(api.mutations.renameProject);
  const toggleFavorite = useMutation(api.mutations.toggleProjectFavorite);

  // Filter projects based on active tab
  const filteredProjects = projects?.filter((project) => {
    if (activeTab === "favourites") {
      return project.is_favorite === true;
    }
    return true;
  });

  const handleToggleFavorite = async (
    projectId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      await toggleFavorite({ project_id: projectId });
    } catch (error) {
      toast.error("Failed to update favorite status");
    }
  };

  const handleOpenProject = (projectId: string) => {
    router.push(`/design/${projectId}`);
  };

  const handleDeleteClick = (project: { id: string; title: string }) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  const handleRenameClick = (project: { id: string; title: string }) => {
    setSelectedProject(project);
    setNewTitle(project.title);
    setRenameDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProject) return;
    setIsDeleting(true);
    try {
      await deleteProject({ project_id: selectedProject.id });
      toast.success("Project deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedProject(null);
    } catch (error) {
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmRename = async () => {
    if (!selectedProject || !newTitle.trim()) return;
    setIsRenaming(true);
    try {
      await renameProject({
        project_id: selectedProject.id,
        title: newTitle.trim(),
      });
      toast.success("Project renamed successfully");
      setRenameDialogOpen(false);
      setSelectedProject(null);
      setNewTitle("");
    } catch (error) {
      toast.error("Failed to rename project");
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 pt-24 sm:pt-28">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            My Projects
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "all"
                ? "bg-black/10 dark:bg-white/10 text-black dark:text-white border border-black/20 dark:border-white/20"
                : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            All Projects
          </button>
          <button
            onClick={() => setActiveTab("favourites")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "favourites"
                ? "bg-black/10 dark:bg-white/10 text-black dark:text-white border border-black/20 dark:border-white/20"
                : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            Favourites
          </button>
        </div>

        {/* Projects Grid */}
        {projects === undefined ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-black/60 dark:text-white/60 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-black/40 dark:text-white/40" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No projects yet
            </h3>
            <p className="text-black/60 dark:text-white/60 mb-6">
              Create your first mobile design to get started
            </p>
            <Button
              onClick={() => router.push("/")}
              className="bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        ) : filteredProjects && filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-black/40 dark:text-white/40" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No favourites yet
            </h3>
            <p className="text-black/60 dark:text-white/60 mb-6">
              Star your projects to add them to favourites
            </p>
            <Button
              onClick={() => setActiveTab("all")}
              variant="outline"
              className="border-black/20 dark:border-white/20 text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
            >
              View All Projects
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProjects?.map((project) => (
              <div
                key={project.project_id}
                className="group relative bg-card dark:bg-white/5 hover:bg-accent dark:hover:bg-white/10 border border-border dark:border-white/10 rounded-2xl overflow-hidden transition-all cursor-pointer shadow-sm hover:shadow-lg dark:shadow-none hover:scale-[1.02] duration-200"
                onClick={() => handleOpenProject(project.project_id)}
              >
                {/* Large Icon Area */}
                <div className="aspect-square bg-secondary dark:bg-white/5 flex items-center justify-center relative overflow-hidden">
                  {/* Icon */}
                  <div className="relative w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-card dark:bg-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <Smartphone className="w-8 sm:w-10 h-8 sm:h-10 text-gray-700 dark:text-white/70" />
                  </div>

                  {/* Favorite Button - Positioned absolutely */}
                  <button
                    onClick={(e) => handleToggleFavorite(project.project_id, e)}
                    className={`absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 rounded-lg bg-card/80 dark:bg-black/40 backdrop-blur-sm hover:bg-card dark:hover:bg-black/60 transition-all ${
                      project.is_favorite
                        ? "text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300"
                        : "text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/80"
                    }`}
                  >
                    <Star
                      className={`w-4 sm:w-5 h-4 sm:h-5 ${project.is_favorite ? "fill-current" : ""}`}
                    />
                  </button>
                </div>

                {/* Content Area */}
                <div className="p-3 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                      {project.title}
                    </h3>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 sm:p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/80 transition-colors">
                            <MoreHorizontal className="w-4 sm:w-5 h-4 sm:h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-card dark:bg-zinc-900 border-border dark:border-white/10"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              handleRenameClick({
                                id: project.project_id,
                                title: project.title,
                              })
                            }
                            className="text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white focus:text-gray-900 dark:focus:text-white cursor-pointer"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDeleteClick({
                                id: project.project_id,
                                title: project.title,
                              })
                            }
                            className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 focus:text-red-600 dark:focus:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-white/50">
                    {formatTimeAgo(project.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card dark:bg-zinc-900 border-border dark:border-white/10 text-foreground">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>
              <DialogTitle className="text-gray-900 dark:text-white">
                Delete Project
              </DialogTitle>
            </div>
            <DialogDescription className="text-gray-600 dark:text-white/60">
              Are you sure you want to delete{" "}
              <span className="text-gray-900 dark:text-white font-medium">
                "{selectedProject?.title}"
              </span>
              ?
              <br />
              <br />
              <span className="text-red-500 dark:text-red-400">
                This action cannot be undone.
              </span>{" "}
              All messages and designs in this project will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              className="text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="bg-card dark:bg-zinc-900 border-border dark:border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Rename Project
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-white/60">
              Enter a new name for your project.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Project name"
            className="bg-secondary dark:bg-white/5 border-border dark:border-white/10 text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmRename();
            }}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setRenameDialogOpen(false)}
              className="text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRename}
              disabled={isRenaming || !newTitle.trim()}
              className="bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {isRenaming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Success Handler - wrapped in Suspense */}
      <Suspense fallback={null}>
        <PaymentSuccessHandler />
      </Suspense>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
