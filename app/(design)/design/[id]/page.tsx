"use client";

import { PromptSidebar } from "@/components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { useCallback, useEffect, useState, useRef } from "react";
import { Separator } from "@radix-ui/react-separator";
import { DesignCanvas, Design } from "@/components/design-canvas";
import { ReactFlowProvider } from "@xyflow/react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArtifactProvider, useArtifact } from "@/hooks/use-artifact";
import type { Attachment } from "@/components/preview-attachment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, Moon, Sun, Zap, Heart } from "lucide-react";
import { useTheme } from "next-themes";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Types for SSE events
interface TextEvent {
    type: "text";
    content: string;
}

interface ToolCallEvent {
    type: "tool_call";
    tool: "create_artifact" | "update_artifact";
    projectId: string;
    data: {
        id: string;
        title: string;
        content: string;
    };
}

interface DoneEvent {
    type: "done";
}

interface ErrorEvent {
    type: "error";
    message: string;
}

type SSEEvent = TextEvent | ToolCallEvent | DoneEvent | ErrorEvent;

// Message type for chat
interface Message {
    role: "user" | "assistant";
    content: string;
    artifacts?: { id: string; title: string }[];
    attachments?: Attachment[];
}

function DesignPageContent() {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");
    const titleInputRef = useRef<HTMLInputElement>(null);
    const { id: projectId } = useParams<{ id: string }>();
    const { selectedArtifactId, setSelectedArtifactId } = useArtifact();
    const { theme, setTheme } = useTheme();

    // Convex queries and mutations
    const designsData = useQuery(api.quires.getDesignsByProject, {
        project_id: projectId,
    });
    const messagesData = useQuery(api.quires.getMessages, { id: projectId });
    const project = useQuery(api.quires.getProject, { project_id: projectId });
    const createDesign = useMutation(api.mutations.createDesign);
    const updateDesign = useMutation(api.mutations.updateDesign);
    const updateProjectTitle = useMutation(api.mutations.updateProjectTitle);

    // Convert Convex designs to canvas format
    const designs: Design[] = (designsData ?? []).map((d: any) => ({
        _id: d._id,
        artifact_id: d.artifact_id,
        title: d.title,
        content: d.content,
        status: d.status as "streaming" | "idle",
    }));

    // Title editing handlers
    const handleStartEditTitle = useCallback(() => {
        setEditedTitle(project?.title || "");
        setIsEditingTitle(true);
        setTimeout(() => titleInputRef.current?.focus(), 0);
    }, [project?.title]);

    const handleSaveTitle = useCallback(async () => {
        if (editedTitle.trim() && editedTitle !== project?.title) {
            await updateProjectTitle({
                project_id: projectId,
                title: editedTitle.trim(),
            });
        }
        setIsEditingTitle(false);
    }, [editedTitle, project?.title, projectId, updateProjectTitle]);

    const handleCancelEditTitle = useCallback(() => {
        setIsEditingTitle(false);
        setEditedTitle("");
    }, []);

    const handleTitleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
                handleSaveTitle();
            } else if (e.key === "Escape") {
                handleCancelEditTitle();
            }
        },
        [handleSaveTitle, handleCancelEditTitle]
    );

    // Load messages from Convex on mount
    useEffect(() => {
        if (messagesData && designsData) {
            const formattedMessages: Message[] = messagesData.map((m: any) => {
                // Map design_ids to artifact objects
                const artifacts = m.design_ids
                    .map((designId: string) => {
                        const design = designsData.find((d: any) => d._id === designId);
                        return design ? { id: design.artifact_id, title: design.title } : null;
                    })
                    .filter(Boolean);

                return {
                    role: m.role as "user" | "assistant",
                    content: m.content,
                    artifacts,
                    attachments: m.attachments || [],
                };
            });
            setMessages(formattedMessages);
        }
    }, [messagesData, designsData]);

    const markMessageProcessed = useMutation(api.mutations.markMessageProcessed);

    const saveMessage = useMutation(api.mutations.saveMessage);

    const handleSendMessage = useCallback(
        async (content: string, currentMessages: Message[], attachments: Attachment[] = [], skipSaveUserMessage = false) => {
            setIsLoading(true);
            let assistantContent = "";
            const artifacts: { id: string; title: string }[] = [];
            const artifactDbIds: string[] = []; // Store Convex IDs for database reference
            const newMessages = [...currentMessages, { role: "user" as const, content, attachments }];

            try {
                // Save user message to database with attachments (skip if already saved, e.g., initial message)
                if (!skipSaveUserMessage) {
                    await saveMessage({
                        project_id: projectId,
                        content: content,
                        role: "user",
                        design_ids: [],
                        attachments: attachments.map(a => ({
                            name: a.name,
                            url: a.url,
                            contentType: a.contentType,
                            storageId: a.storageId as any,
                        })),
                    });
                }

                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: newMessages.map(m => ({
                            role: m.role,
                            content: m.content,
                            attachments: m.attachments,
                        })),
                        projectId,
                    }),
                });

                if (!response.ok) throw new Error("Failed to fetch");

                const reader = response.body?.getReader();
                if (!reader) throw new Error("No reader");

                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const event: SSEEvent = JSON.parse(line.slice(6));

                                if (event.type === "text") {
                                    assistantContent += event.content;
                                    setMessages([
                                        ...newMessages,
                                        { role: "assistant", content: assistantContent, artifacts },
                                    ]);
                                } else if (event.type === "tool_call") {
                                    const designData = {
                                        project_id: projectId,
                                        artifact_id: event.data.id,
                                        title: event.data.title,
                                        content: event.data.content,
                                    };

                                    let designDbId;
                                    if (event.tool === "create_artifact") {
                                        designDbId = await createDesign(designData);
                                    } else if (event.tool === "update_artifact") {
                                        designDbId = await updateDesign({
                                            artifact_id: designData.artifact_id,
                                            title: designData.title,
                                            content: designData.content,
                                        });
                                    }

                                    if (designDbId) {
                                        artifactDbIds.push(designDbId);
                                    }

                                    artifacts.push({ id: event.data.id, title: event.data.title });
                                    setSelectedArtifactId(event.data.id);
                                }
                            } catch (e) {
                                console.error("Error parsing SSE:", e);
                            }
                        }
                    }
                }

                // Final update
                setMessages([
                    ...newMessages,
                    { role: "assistant", content: assistantContent, artifacts },
                ]);

                // Save assistant message to database with artifact references
                await saveMessage({
                    project_id: projectId,
                    content: assistantContent,
                    role: "assistant",
                    design_ids: artifactDbIds as any, // Convex IDs of created/updated designs
                });
            } catch (error) {
                console.error("Chat error:", error);
            } finally {
                setIsLoading(false);
            }
        },
        [projectId, createDesign, updateDesign, setSelectedArtifactId, saveMessage]
    );

    // Auto-process initial message
    useEffect(() => {
        if (messagesData && !isLoading) {
            const initialMsg = messagesData.find(
                (m: any) => m.role === "user" && m.initial_status === false
            );

            if (initialMsg) {
                // Mark as processed immediately to prevent double-firing
                markMessageProcessed({ message_id: initialMsg._id });
                // Trigger AI - skip saving user message since it's already in the database
                handleSendMessage(initialMsg.content, [], initialMsg.attachments || [], true);
            }
        }
    }, [messagesData, handleSendMessage, markMessageProcessed, isLoading]);

    // Handle form submission with attachments
    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>, attachments: Attachment[] = []) => {
            e.preventDefault();
            if (!input.trim() && attachments.length === 0) return;
            if (isLoading) return;

            const userMessage = input.trim();
            setInput("");
            setMessages((prev) => [...prev, { role: "user", content: userMessage, attachments }]);

            await handleSendMessage(userMessage, messages, attachments);
        },
        [input, isLoading, messages, handleSendMessage]
    );

    // Handle artifact click from chat
    const handleArtifactClick = useCallback(
        (artifactId: string) => {
            setSelectedArtifactId(artifactId);
        },
        [setSelectedArtifactId]
    );

    return (
        <SidebarProvider>
            <PromptSidebar
                input={input}
                messages={messages}
                setInput={setInput}
                isLoading={isLoading}
                isMessagesLoading={messagesData === undefined}
                handleFormSubmit={handleSubmit}
                onArtifactClick={handleArtifactClick}
            />
            <SidebarInset className="flex flex-col">
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        {isEditingTitle ? (
                            <div className="flex items-center gap-1">
                                <Input
                                    ref={titleInputRef}
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    onKeyDown={handleTitleKeyDown}
                                    className="h-8 w-64"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={handleSaveTitle}
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={handleCancelEditTitle}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <span className="font-medium">
                                    {project?.title || "Building Your Application"}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={handleStartEditTitle}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 px-4">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => window.open("https://bolt.new", "_blank")}
                                    >
                                        <Zap className="h-4 w-4" />
                                        bolt.new
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Open in bolt.new</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => window.open("https://lovable.dev", "_blank")}
                                    >
                                        <Heart className="h-4 w-4" />
                                        lovable.dev
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Open in lovable.dev</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="h-9 w-9"
                        >
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </div>
                </header>
                <div className="flex-1 w-full">
                    <ReactFlowProvider>
                        <DesignCanvas
                            designs={designs}
                            selectedArtifactId={selectedArtifactId}
                            onNodeSelect={setSelectedArtifactId}
                        />
                    </ReactFlowProvider>
                </div>
                <div className="border-t"></div>
            </SidebarInset>
        </SidebarProvider>
    );
}

export default function DesignId() {
    return (
        <ArtifactProvider>
            <DesignPageContent />
        </ArtifactProvider>
    );
}
