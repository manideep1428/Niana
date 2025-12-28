"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/top-bar";
import { 
  Smartphone, 
  MoreHorizontal, 
  Trash2, 
  Pencil, 
  Star,
  Plus,
  Loader2,
  AlertTriangle
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
  if (diffDays < 30) return `Created ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `Created ${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `Created ${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "favourites">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ id: string; title: string } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const projects = useQuery(
    api.quires.getUserProjects,
    user?.id ? { user_id: user.id } : "skip"
  );

  const deleteProject = useMutation(api.mutations.deleteProject);
  const renameProject = useMutation(api.mutations.renameProject);

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
      await renameProject({ project_id: selectedProject.id, title: newTitle.trim() });
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
    <div className="min-h-screen bg-black">
      <TopBar />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">My Projects</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "bg-white/10 text-white border border-white/20"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            All Projects
          </button>
          <button
            onClick={() => setActiveTab("favourites")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === "favourites"
                ? "bg-white/10 text-white border border-white/20"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            Favourites
          </button>
        </div>

        {/* Projects Grid */}
        {projects === undefined ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-white/60 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-white/40" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
            <p className="text-white/60 mb-6">Create your first mobile design to get started</p>
            <Button
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project) => (
              <div
                key={project.project_id}
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all cursor-pointer"
                onClick={() => handleOpenProject(project.project_id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">
                      {project.title}
                    </h3>
                    <p className="text-xs text-white/50 mt-1">
                      {formatTimeAgo(project.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors">
                      <Star className="w-4 h-4" />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10">
                        <DropdownMenuItem
                          onClick={() => handleRenameClick({ id: project.project_id, title: project.title })}
                          className="text-white/80 hover:text-white focus:text-white cursor-pointer"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick({ id: project.project_id, title: project.title })}
                          className="text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <DialogTitle>Delete Project</DialogTitle>
            </div>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete <span className="text-white font-medium">"{selectedProject?.title}"</span>?
              <br /><br />
              <span className="text-red-400">This action cannot be undone.</span> All messages and designs in this project will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              className="text-white/60 hover:text-white hover:bg-white/10"
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
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription className="text-white/60">
              Enter a new name for your project.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Project name"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmRename();
            }}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setRenameDialogOpen(false)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRename}
              disabled={isRenaming || !newTitle.trim()}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
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
    </div>
  );
}
