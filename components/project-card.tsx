"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Eye, Globe, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

function AnimatedCenterLetter({
    letter,
    isHovered,
    isDarkMode,
}: {
    letter: string;
    isHovered: boolean;
    isDarkMode: boolean;
}) {
    const textColor = isDarkMode ? "#FFFFFF" : "#1F2937";
    const textShadow = isDarkMode
        ? "0 2px 10px rgba(0, 0, 0, 0.5)"
        : "0 2px 8px rgba(255, 255, 255, 0.8)";

    return (
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
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

            <div
                className={`absolute inset-0 ${isDarkMode ? "bg-black/20" : "bg-white/30"}`}
            />

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

export interface ProjectCardProps {
    project: {
        project_id: string;
        title: string;
        description?: string;
        thumbnail?: string;
        likes?: number;
        views?: number;
        is_public?: boolean;
        user?: {
            first_name?: string | null;
            last_name?: string | null;
            profile_picture_url?: string | null;
        } | null;
    };
    onLike?: () => void;
    isLiked?: boolean;
    isOwner?: boolean;
    onToggleVisibility?: () => void;
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

export function ProjectCard({ project, onLike, isLiked, isOwner, onToggleVisibility }: ProjectCardProps) {
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
                                className={`flex items-center gap-1 transition-colors hover:text-pink-500 ${isLiked ? "text-pink-500" : ""
                                    }`}
                            >
                                <Heart
                                    className={`w-3.5 h-3.5 transition-all ${isLiked ? "fill-pink-500" : ""
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
