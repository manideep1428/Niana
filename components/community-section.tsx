"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Eye, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

// Vibrant neon colors for dark mode
const darkModeColors = [
  "#FF6B6B", // Coral red
  "#FF8E53", // Orange
  "#FFD93D", // Yellow
  "#6BCB77", // Green
  "#4D96FF", // Blue
  "#9B59B6", // Purple
  "#FF6B9D", // Pink
  "#00D4FF", // Cyan
];

// Deeper, richer colors for light mode
const lightModeColors = [
  "#DC2626", // Deep red
  "#EA580C", // Deep orange
  "#CA8A04", // Deep yellow/gold
  "#16A34A", // Deep green
  "#2563EB", // Deep blue
  "#7C3AED", // Deep purple
  "#DB2777", // Deep pink
  "#0891B2", // Deep cyan
];

// Glow shadows for dark mode (stronger glow)
const darkModeGlows = [
  "0 0 20px rgba(255, 107, 107, 0.9)",
  "0 0 20px rgba(255, 142, 83, 0.9)",
  "0 0 20px rgba(255, 217, 61, 0.9)",
  "0 0 20px rgba(107, 203, 119, 0.9)",
  "0 0 20px rgba(77, 150, 255, 0.9)",
  "0 0 20px rgba(155, 89, 182, 0.9)",
  "0 0 20px rgba(255, 107, 157, 0.9)",
  "0 0 20px rgba(0, 212, 255, 0.9)",
];

// Subtle shadows for light mode
const lightModeGlows = [
  "0 2px 8px rgba(220, 38, 38, 0.4)",
  "0 2px 8px rgba(234, 88, 12, 0.4)",
  "0 2px 8px rgba(202, 138, 4, 0.4)",
  "0 2px 8px rgba(22, 163, 74, 0.4)",
  "0 2px 8px rgba(37, 99, 235, 0.4)",
  "0 2px 8px rgba(124, 58, 237, 0.4)",
  "0 2px 8px rgba(219, 39, 119, 0.4)",
  "0 2px 8px rgba(8, 145, 178, 0.4)",
];

// Animated center letter component for the card thumbnail placeholder
function AnimatedCenterLetter({
  letter,
  isHovered,
  isDarkMode,
}: {
  letter: string;
  isHovered: boolean;
  isDarkMode: boolean;
}) {
  // Text color based on theme - dark text for light mode, white for dark mode
  const textColor = isDarkMode ? "#FFFFFF" : "#1F2937";
  const textShadow = isDarkMode
    ? "0 2px 10px rgba(0, 0, 0, 0.5)"
    : "0 2px 8px rgba(255, 255, 255, 0.8)";

  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
      {/* Animated colorful gradient background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 25%, #FFD93D 50%, #6BCB77 75%, #4D96FF 100%)",
            "linear-gradient(135deg, #FF8E53 0%, #FFD93D 25%, #6BCB77 50%, #4D96FF 75%, #9B59B6 100%)",
            "linear-gradient(135deg, #FFD93D 0%, #6BCB77 25%, #4D96FF 50%, #9B59B6 75%, #FF6B9D 100%)",
            "linear-gradient(135deg, #6BCB77 0%, #4D96FF 25%, #9B59B6 50%, #FF6B9D 75%, #00D4FF 100%)",
            "linear-gradient(135deg, #4D96FF 0%, #9B59B6 25%, #FF6B9D 50%, #00D4FF 75%, #FF6B6B 100%)",
            "linear-gradient(135deg, #9B59B6 0%, #FF6B9D 25%, #00D4FF 50%, #FF6B6B 75%, #FF8E53 100%)",
            "linear-gradient(135deg, #FF6B9D 0%, #00D4FF 25%, #FF6B6B 50%, #FF8E53 75%, #FFD93D 100%)",
            "linear-gradient(135deg, #00D4FF 0%, #FF6B6B 25%, #FF8E53 50%, #FFD93D 75%, #6BCB77 100%)",
            "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 25%, #FFD93D 50%, #6BCB77 75%, #4D96FF 100%)",
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Overlay for better text readability */}
      <div
        className={`absolute inset-0 ${isDarkMode ? "bg-black/20" : "bg-white/30"}`}
      />

      {/* Animated letter with theme-dependent color */}
      <motion.div
        className="text-6xl font-bold relative z-10"
        style={{
          color: textColor,
          textShadow: textShadow,
        }}
        initial={{ scale: 1 }}
        animate={
          isHovered
            ? {
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
              }
            : { scale: 1, rotate: 0 }
        }
        transition={{
          duration: 0.6,
          ease: "easeInOut",
        }}
      >
        {letter}
      </motion.div>
    </div>
  );
}

interface ProjectCardProps {
  project: {
    project_id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    likes?: number;
    views?: number;
    user?: {
      first_name?: string | null;
      last_name?: string | null;
      profile_picture_url?: string | null;
    } | null;
  };
  onLike?: () => void;
  isLiked?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function ProjectCard({ project, onLike, isLiked }: ProjectCardProps) {
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isDarkMode = theme === "dark" || resolvedTheme === "dark";

  const handleClick = () => {
    router.push(`/design/${project.project_id}`);
  };

  const userName = project.user
    ? `${project.user.first_name || ""} ${project.user.last_name || ""}`.trim() ||
      "Anonymous"
    : "Anonymous";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative rounded-xl overflow-hidden cursor-pointer"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Container - Light and Dark mode support */}
      <div className="relative bg-card/80 dark:bg-zinc-900/80 rounded-xl overflow-hidden border border-border dark:border-white/10 hover:border-border dark:hover:border-white/20 transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-none">
        {/* Thumbnail */}
        <div className="aspect-16/10 relative overflow-hidden bg-linear-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900">
          {project.thumbnail && !imageError ? (
            <img
              src={project.thumbnail}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <AnimatedCenterLetter
              letter={project.title.charAt(0).toUpperCase()}
              isHovered={isHovered}
              isDarkMode={isDarkMode}
            />
          )}

          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title and User */}
          <div className="flex items-center gap-2">
            {/* User Avatar */}
            <div className="w-6 h-6 rounded-full bg-linear-to-br from-pink-500 to-purple-500 flex items-center justify-center overflow-hidden shrink-0">
              {project.user?.profile_picture_url ? (
                <img
                  src={project.user.profile_picture_url}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-semibold text-white">
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {project.title}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{formatNumber(project.views ?? 0)}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike?.();
                }}
                className={`flex items-center gap-1 transition-colors hover:text-pink-500 ${
                  isLiked ? "text-pink-500" : ""
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 transition-all ${
                    isLiked ? "fill-pink-500" : ""
                  }`}
                />
                <span>{formatNumber(project.likes ?? 0)}</span>
              </button>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Free
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function CommunitySection() {
  const { user } = useAuth();
  const [visibleCount, setVisibleCount] = useState(12);
  const [activeTab, setActiveTab] = useState<"recent" | "my">("recent");

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

  if (!publicProjects || publicProjects.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      {/* Dark/Light mode container */}
      <div className="bg-background/95 dark:bg-zinc-950/95 backdrop-blur-xl rounded-t-3xl border-t border-border dark:border-white/10 min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("recent")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "recent"
                    ? "bg-black/10 dark:bg-white/10 text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                Recently viewed
              </button>
              {user && (
                <button
                  onClick={() => setActiveTab("my")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "my"
                      ? "bg-black/10 dark:bg-white/10 text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  My projects
                </button>
              )}
            </div>
            <Button
              variant="ghost"
              className="text-sm text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white group"
            >
              Browse all
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {publicProjects.map((project) => (
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
                  isLiked={false}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Load More Button */}
          {publicProjects.length >= visibleCount && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                className="rounded-full px-6 border-black/20 dark:border-white/20 text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
