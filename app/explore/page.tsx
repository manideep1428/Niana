"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/app-layout";

export default function ExplorePage() {
    const { user } = useAuth();
    const [visibleCount, setVisibleCount] = useState(12);

    const publicProjects = useQuery(api.quires.getPublicProjects, {
        limit: visibleCount,
    });

    const toggleLike = useMutation(api.mutations.toggleProjectLike);

    const handleLike = async (projectId: string) => {
        if (!user) return;
        await toggleLike({ user_id: user.id, project_id: projectId });
    };

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 12);
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-background flex flex-col">

                <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
                            Explore Community Work
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Discover amazing projects created by the Niana community.
                        </p>
                    </div>

                    {/* Projects Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {publicProjects?.map((project) => (
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
                                    }}
                                    onLike={() => handleLike(project.project_id)}
                                    isLiked={false} // You might want to implement real isLiked check if available
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Loading / Empty States */}
                    {!publicProjects && (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    )}

                    {publicProjects && publicProjects.length === 0 && (
                        <div className="text-center py-20 text-muted-foreground">
                            No public projects found yet. Be the first to share!
                        </div>
                    )}

                    {/* Load More Button */}
                    {publicProjects && publicProjects.length >= visibleCount && (
                        <div className="flex justify-center mt-12">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                className="rounded-full px-8"
                            >
                                Load More
                            </Button>
                        </div>
                    )}
                </main>

                <footer className="w-full py-8 text-center text-xs text-muted-foreground border-t">
                    <p>© {new Date().getFullYear()} Niana. All rights reserved.</p>
                </footer>
            </div>
        </AppLayout>
    );
}
