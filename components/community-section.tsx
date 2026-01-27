"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/project-card";



export function CommunitySection() {
  const { user } = useAuth();

  // If no user, do not render anything
  if (!user) return null;

  const userProjects = useQuery(
    api.quires.getUserProjects,
    { user_id: user.id }
  );

  const toggleLike = useMutation(api.mutations.toggleProjectLike);
  const toggleVisibility = useMutation(api.mutations.toggleProjectVisibility);

  const handleLike = async (projectId: string) => {
    if (!user) return;
    await toggleLike({ user_id: user.id, project_id: projectId });
  };

  const handleToggleVisibility = async (projectId: string) => {
    if (!user) return;
    await toggleVisibility({ project_id: projectId });
  };

  const projectsToDisplay = userProjects?.map((p) => ({
    ...p,
    user: {
      first_name: user?.firstName || "Anonymous",
      last_name: user?.lastName || "",
      profile_picture_url: user?.profilePictureUrl,
    },
  })) ?? [];

  if (!projectsToDisplay || projectsToDisplay.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      {/* Warm Cream container */}
      <div className="bg-[#fff7ed] rounded-t-3xl border-t border-[#e7e5e4] min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-[#292524]">My Projects</h2>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {projectsToDisplay.map((project) => (
                <ProjectCard
                  key={project.project_id}
                  project={{
                    project_id: project.project_id,
                    title: project.title,
                    description: project.description,
                    thumbnail: project.thumbnail,
                    likes: project.likes,
                    views: project.views,
                    user: project.user,
                    is_public: project.is_public,
                  }}
                  onLike={() => handleLike(project.project_id)}
                  isLiked={false}
                  isOwner={true}
                  onToggleVisibility={() => handleToggleVisibility(project.project_id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
