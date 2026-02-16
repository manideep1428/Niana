"use client";

import { PromptSidebar } from "@/components/chat-sidebar";
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
import { Pencil, Check, X, Moon, Sun, Lock, Unlock, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TokenUsageDisplay } from "@/components/token-usage-display";

import { toast } from "sonner";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { SSEEvent } from "@/lib/types";
import { ExportDialog } from "@/components/export-dialog";

interface Message {
  role: "user" | "assistant";
  content: string;
  artifacts?: { id: string; title: string }[];
  streamingDesigns?: {
    id: string;
    title: string;
    status: "creating" | "completed";
  }[];
  attachments?: Attachment[];
  thoughts?: string;
}

function DesignPageContent() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // Pending skeleton designs (shown while AI is generating)
  const [pendingDesigns, setPendingDesigns] = useState<Design[]>([]);

  // AbortController for stopping generation
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStoppedRef = useRef(false);

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
  const toggleVisibility = useMutation(api.mutations.toggleProjectVisibility);
  const forkProject = useMutation(api.mutations.forkProject);

  // Get user for subscription check
  const { user } = useAuth();
  const subscription = useQuery(
    api.quires.getUserSubscription,
    user ? { user_id: user.id } : "skip",
  );

  // Check if current user is the owner of this project
  const isOwner = project && user ? project.user_id === user.id : true;
  const isReadOnly = !isOwner;

  // Convert Convex designs to canvas format
  const dbDesigns: Design[] = (designsData ?? []).map((d: any) => ({
    _id: d._id,
    artifact_id: d.artifact_id,
    title: d.title,
    content: d.content,
    status: d.status as "streaming" | "idle",
    x: d.x,
    y: d.y,
  }));

  // Merge database designs with pending skeleton designs
  // Filter out pending designs that now have content in dbDesigns
  const designs: Design[] = [
    ...dbDesigns,
    ...pendingDesigns.filter(
      (pending) =>
        !dbDesigns.some((db) => db.artifact_id === pending.artifact_id),
    ),
  ];

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
    [handleSaveTitle, handleCancelEditTitle],
  );

  useEffect(() => {
    // Don't overwrite messages while streaming - the streaming handler manages state
    if (isLoading) return;

    if (messagesData && designsData) {
      const formattedMessages: Message[] = messagesData.map((m: any) => {
        // Map design_ids to artifact objects
        const artifacts = m.design_ids
          .map((designId: string) => {
            const design = designsData.find((d: any) => d._id === designId);
            return design
              ? { id: design.artifact_id, title: design.title }
              : null;
          })
          .filter(Boolean);

        return {
          role: m.role as "user" | "assistant",
          content: m.content,
          thoughts: m.thoughts,
          artifacts,
          attachments: m.attachments || [],
        };
      });
      setMessages(formattedMessages);
    }
  }, [messagesData, designsData, isLoading]);

  const markMessageProcessed = useMutation(api.mutations.markMessageProcessed);

  const saveMessage = useMutation(api.mutations.saveMessage);

  const handleSendMessage = useCallback(
    async (
      content: string,
      currentMessages: Message[],
      attachments: Attachment[] = [],
      skipSaveUserMessage = false,
    ) => {
      // Check credit limit before proceeding
      const isFree = !subscription || subscription.plan === "free";
      const totalTokens =
        isFree && subscription?.tokens_total === -1
          ? 2
          : (subscription?.tokens_total ?? 2);
      const usedTokens = subscription?.tokens_used ?? 0;

      // Check if user has credits remaining
      if (usedTokens >= totalTokens) {
        toast.error("Credit limit reached", {
          description:
            "You've used all your credits. Please upgrade your plan to continue.",
          action: {
            label: "Upgrade",
            onClick: () => (window.location.href = "/pricing"),
          },
        });
        return;
      }

      setIsLoading(true);
      setIsResponding(false);
      isStoppedRef.current = false;

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();
      let assistantContent = "";
      let assistantThoughts = "";
      const artifacts: { id: string; title: string }[] = [];
      const artifactDbIds: string[] = []; // Store Convex IDs for database reference
      const newMessages = [
        ...currentMessages,
        { role: "user" as const, content, attachments },
      ];

      // Create a temporary skeleton design ID
      const pendingSkeletonId = `pending-${Date.now()}`;

      // Add a pending skeleton design immediately
      const skeletonDesign: Design = {
        _id: pendingSkeletonId,
        artifact_id: pendingSkeletonId,
        title: "Generating...",
        content: "", // Empty content triggers skeleton in design-node
        status: "streaming",
        x: undefined,
        y: undefined,
      };
      setPendingDesigns((prev) => [...prev, skeletonDesign]);

      try {
        // Save user message to database with attachments (skip if already saved, e.g., initial message)
        if (!skipSaveUserMessage) {
          await saveMessage({
            project_id: projectId,
            content: content,
            role: "user",
            design_ids: [],
            attachments: attachments.map((a) => ({
              name: a.name,
              url: a.url,
              contentType: a.contentType,
              storageId: a.storageId as any,
            })),
          });
        }

        // Use iterative API for progressive rendering
        const response = await fetch("/api/chat-iterative", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
              attachments: m.attachments,
            })),
            projectId,
          }),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) throw new Error("Failed to fetch");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let buffer = "";

        // Remove initial skeleton once we start receiving actual events
        let initialSkeletonRemoved = false;

        // Track designs being created for chat display
        const streamingDesigns: {
          id: string;
          title: string;
          status: "creating" | "completed";
        }[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done || isStoppedRef.current) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event: SSEEvent = JSON.parse(line.slice(6));

                // Set isResponding to true on first event received
                setIsResponding(true);

                // Handle text events (both old and new format)
                if (event.type === "text" || event.type === "text-delta") {
                  assistantContent += event.content;
                  setMessages([
                    ...newMessages,
                    {
                      role: "assistant",
                      content: assistantContent,
                      thoughts: assistantThoughts,
                      artifacts,
                      streamingDesigns: [...streamingDesigns],
                    },
                  ]);
                }
                // Handle thought events
                else if (event.type === "thought-delta") {
                  assistantThoughts += event.content;
                  setMessages([
                    ...newMessages,
                    {
                      role: "assistant",
                      content: assistantContent,
                      thoughts: assistantThoughts,
                      artifacts,
                      streamingDesigns: [...streamingDesigns],
                    },
                  ]);
                }
                // Handle artifact start (both old and new format)
                else if (
                  event.type === "artifact_start" ||
                  event.type === "artifact-start"
                ) {
                  // Remove initial placeholder skeleton
                  if (!initialSkeletonRemoved) {
                    setPendingDesigns((prev) =>
                      prev.filter((p) => p.artifact_id !== pendingSkeletonId),
                    );
                    initialSkeletonRemoved = true;
                  }

                  // Handle both event data formats
                  const artifactId = event.id || event.data?.id || "";
                  const artifactTitle = event.title || event.data?.title || "";

                  // Add to streamingDesigns for chat display
                  streamingDesigns.push({
                    id: artifactId,
                    title: artifactTitle,
                    status: "creating",
                  });

                  // Add a skeleton design node with streaming state
                  const newStreamingDesign: Design = {
                    _id: `streaming-${artifactId}`,
                    artifact_id: artifactId,
                    title: artifactTitle,
                    content: "", // Empty = show skeleton loader
                    status: "streaming",
                    x: undefined,
                    y: undefined,
                  };
                  setPendingDesigns((prev) => [...prev, newStreamingDesign]);

                  // Update messages to show creating status
                  setMessages([
                    ...newMessages,
                    {
                      role: "assistant",
                      content: assistantContent,
                      thoughts: assistantThoughts,
                      artifacts,
                      streamingDesigns: [...streamingDesigns],
                    },
                  ]);
                }
                // Handle artifact finish (both old and new format)
                else if (
                  event.type === "artifact_finish" ||
                  event.type === "artifact-finish"
                ) {
                  // Handle both event data formats
                  const artifactId = event.id || event.data?.id || "";
                  const artifactTitle = event.title || event.data?.title || "";
                  const artifactContent =
                    event.content || event.data?.content || "";

                  // Update status in streamingDesigns
                  const designIndex = streamingDesigns.findIndex(
                    (d) => d.id === artifactId,
                  );
                  if (designIndex !== -1) {
                    streamingDesigns[designIndex].status = "completed";
                  }

                  // Remove the streaming design
                  setPendingDesigns((prev) =>
                    prev.filter((p) => p.artifact_id !== artifactId),
                  );

                  const designData = {
                    project_id: projectId,
                    artifact_id: artifactId,
                    title: artifactTitle,
                    content: artifactContent,
                  };

                  // Determine if create or update based on tool name
                  const toolName = event.tool || "";
                  const isCreate =
                    toolName.includes("create") ||
                    toolName === "createArtifact";

                  let designDbId;
                  if (isCreate || !toolName) {
                    // Default to create if no tool specified
                    designDbId = await createDesign(designData);
                  } else {
                    designDbId = await updateDesign({
                      artifact_id: designData.artifact_id,
                      title: designData.title,
                      content: designData.content,
                    });
                  }

                  if (designDbId) {
                    artifactDbIds.push(designDbId);
                  }

                  artifacts.push({
                    id: artifactId,
                    title: artifactTitle,
                  });
                  setSelectedArtifactId(artifactId);

                  // Update messages with completed status
                  setMessages([
                    ...newMessages,
                    {
                      role: "assistant",
                      content: assistantContent,
                      thoughts: assistantThoughts,
                      artifacts,
                      streamingDesigns: [...streamingDesigns],
                    },
                  ]);
                }
                // Handle new ai-chatbot style tool-call events
                else if (event.type === "tool-call") {
                  const { name, args } = event;

                  // Remove any streaming skeleton
                  setPendingDesigns((prev) =>
                    prev.filter((p) => p.artifact_id !== args.id),
                  );

                  const designData = {
                    project_id: projectId,
                    artifact_id: args.id,
                    title: args.title,
                    content: args.content,
                  };

                  let designDbId;
                  if (name === "createArtifact") {
                    designDbId = await createDesign(designData);
                  } else if (name === "updateArtifact") {
                    designDbId = await updateDesign({
                      artifact_id: designData.artifact_id,
                      title: designData.title,
                      content: designData.content,
                    });
                  }

                  if (designDbId) {
                    artifactDbIds.push(designDbId);
                  }

                  artifacts.push({
                    id: args.id,
                    title: args.title,
                  });
                  setSelectedArtifactId(args.id);

                  // Update messages
                  setMessages([
                    ...newMessages,
                    {
                      role: "assistant",
                      content: assistantContent,
                      thoughts: assistantThoughts,
                      artifacts,
                      streamingDesigns: [...streamingDesigns],
                    },
                  ]);
                }
                // Handle finish events (both old and new format)
                else if (event.type === "done" || event.type === "finish") {
                  // Stream complete - messages will be finalized after the loop
                }
                // Legacy event handling for backwards compatibility
                else if (
                  event.type === "skeleton" ||
                  event.type === "tool_call"
                ) {
                  if (event.type === "skeleton") {
                    if (!initialSkeletonRemoved) {
                      setPendingDesigns((prev) =>
                        prev.filter((p) => p.artifact_id !== pendingSkeletonId),
                      );
                      initialSkeletonRemoved = true;
                    }
                    const newSkeleton: Design = {
                      _id: `skeleton-${event.data.id}`,
                      artifact_id: event.data.id,
                      title: event.data.title,
                      content: "",
                      status: "streaming",
                      x: undefined,
                      y: undefined,
                    };
                    setPendingDesigns((prev) => [...prev, newSkeleton]);
                  } else if (event.type === "tool_call") {
                    setPendingDesigns((prev) =>
                      prev.filter((p) => p.artifact_id !== event.data.id),
                    );
                    const designData = {
                      project_id: projectId,
                      artifact_id: event.data.id,
                      title: event.data.title,
                      content: event.data.content,
                    };
                    let designDbId;
                    if (
                      event.tool === "create_artifact" ||
                      event.tool === "createArtifact"
                    ) {
                      designDbId = await createDesign(designData);
                    } else if (
                      event.tool === "update_artifact" ||
                      event.tool === "updateArtifact"
                    ) {
                      designDbId = await updateDesign({
                        artifact_id: designData.artifact_id,
                        title: designData.title,
                        content: designData.content,
                      });
                    }
                    if (designDbId) {
                      artifactDbIds.push(designDbId);
                    }
                    artifacts.push({
                      id: event.data.id,
                      title: event.data.title,
                    });
                    setSelectedArtifactId(event.data.id);
                  }
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
          {
            role: "assistant",
            content: assistantContent,
            thoughts: assistantThoughts,
            artifacts,
          },
        ]);

        // Save assistant message to database with artifact references
        await saveMessage({
          project_id: projectId,
          content: assistantContent,
          role: "assistant",
          design_ids: artifactDbIds as any, // Convex IDs of created/updated designs
          thoughts: assistantThoughts,
        });
      } catch (error: any) {
        // Handle abort specifically
        if (error.name === "AbortError" || isStoppedRef.current) {
          console.log("Generation stopped by user");
          toast.info("Generation stopped", {
            description: "Only completed designs were saved.",
          });

          // Save assistant message if we have any content
          if (assistantContent.trim() && artifactDbIds.length > 0) {
            await saveMessage({
              project_id: projectId,
              content: assistantContent + "\n\n*[Generation stopped by user]*",
              role: "assistant",
              design_ids: artifactDbIds as any,
              thoughts: assistantThoughts,
            });
          }
        } else {
          console.error("Chat error:", error);
        }
      } finally {
        setIsLoading(false);
        setIsResponding(false);
        // Clear any remaining pending designs (incomplete ones)
        setPendingDesigns([]);
        abortControllerRef.current = null;
      }
    },
    [
      projectId,
      createDesign,
      updateDesign,
      setSelectedArtifactId,
      saveMessage,
      subscription,
    ],
  );

  // Auto-process initial message
  useEffect(() => {
    if (messagesData && !isLoading) {
      const initialMsg = messagesData.find(
        (m: any) => m.role === "user" && m.initial_status === false,
      );

      if (initialMsg) {
        // Mark as processed immediately to prevent double-firing
        markMessageProcessed({ message_id: initialMsg._id });
        // Trigger AI - skip saving user message since it's already in the database
        handleSendMessage(
          initialMsg.content,
          [],
          initialMsg.attachments || [],
          true,
        );
      }
    }
  }, [messagesData, handleSendMessage, markMessageProcessed, isLoading]);

  // Handle form submission with attachments
  const handleSubmit = useCallback(
    async (
      e: React.FormEvent<HTMLFormElement>,
      attachments: Attachment[] = [],
    ) => {
      e.preventDefault();
      if (!input.trim() && attachments.length === 0) return;
      if (isLoading) return;

      const userMessage = input.trim();
      setInput("");
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage, attachments },
      ]);

      await handleSendMessage(userMessage, messages, attachments);
    },
    [input, isLoading, messages, handleSendMessage],
  );

  // Handle stop generation
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      isStoppedRef.current = true;
      abortControllerRef.current.abort();
      // Pending designs will be cleared in the finally block
      toast.info("Stopping generation...");
    }
  }, []);

  // Handle artifact click from chat
  const handleArtifactClick = useCallback(
    (artifactId: string) => {
      setSelectedArtifactId(artifactId);
    },
    [setSelectedArtifactId],
  );

  // Handle fork project
  const handleForkProject = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to fork this project");
      return;
    }

    try {
      const result = await forkProject({
        source_project_id: projectId,
        new_user_id: user.id,
      });

      if (result.success) {
        toast.success("Project forked successfully!", {
          description: `Copied ${result.designs_copied} designs and ${result.messages_copied} messages`,
        });
        // Navigate to the new forked project
        window.location.href = `/design/${result.new_project_id}`;
      }
    } catch (error: any) {
      toast.error("Failed to fork project", {
        description: error.message || "Please try again",
      });
    }
  }, [forkProject, projectId, user]);

  return (
    <SidebarProvider>
      <PromptSidebar
        input={input}
        messages={messages}
        setInput={setInput}
        isLoading={isLoading}
        isResponding={isResponding}
        isMessagesLoading={messagesData === undefined}
        handleFormSubmit={handleSubmit}
        onStop={handleStop}
        onArtifactClick={handleArtifactClick}
        isReadOnly={isReadOnly}
        onFork={handleForkProject}
        projectTitle={project?.title || "Untitled"}
      />
      <SidebarInset className="flex flex-col relative overflow-hidden bg-sidebar">
        <header className="flex h-12 sm:h-14 shrink-0 items-center justify-between gap-1 sm:gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-sidebar px-2 sm:px-4">
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <Separator
              orientation="vertical"
              className="mr-1 sm:mr-2 data-[orientation=vertical]:h-4"
            />
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleSaveTitle}
                className="bg-transparent border-none outline-none text-xs sm:text-sm font-semibold h-7 p-0 m-0 w-full max-w-[150px] sm:max-w-[240px] text-foreground placeholder:text-muted-foreground/50 transition-all"
                placeholder="Project Name"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-3 group min-w-0 flex-1">
                <button
                  onClick={handleStartEditTitle}
                  className="flex items-center gap-2 cursor-pointer hover:bg-sidebar-accent/50 px-1 sm:px-2 py-1 -ml-1 sm:-ml-2 rounded-md transition-colors min-w-0 flex-1 overflow-hidden"
                  title="Rename Project"
                >
                  <span className="font-semibold text-xs sm:text-sm text-foreground tracking-tight truncate">
                    {project?.title || "Untitled Project"}
                  </span>
                </button>

                {/* Visibility Toggle Badge - Hidden on very small screens */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={async () => {
                          const result = await toggleVisibility({
                            project_id: projectId,
                          });
                          toast.success(
                            result.is_public
                              ? "Project is now public"
                              : "Project is now private",
                          );
                        }}
                        className={cn(
                          "hidden sm:flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium border transition-all duration-200 shrink-0",
                          project?.is_public
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700",
                        )}
                      >
                        {project?.is_public ? (
                          <>
                            <Globe className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                            <span className="hidden sm:inline">Public</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                            <span className="hidden sm:inline">Private</span>
                          </>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>
                        {project?.is_public
                          ? "Anyone with link can view"
                          : "Only you can view"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Credit Usage - Compact inline beside visibility badge */}
                <div className="hidden sm:block">
                  <TokenUsageDisplay compact />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Full credit display on mobile */}
            <div className="block sm:hidden">
              <TokenUsageDisplay compact />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
            >
              <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0 p-2 pt-0">
          <div className="relative flex-1 w-full rounded-2xl border bg-background shadow-sm overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 pointer-events-none z-0">
              {/* Main Gradient Blob */}
              <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-purple-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-[float_10s_ease-in-out_infinite]" />
              {/* Secondary Blob */}
              <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-500/10 dark:bg-indigo-900/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-[float_15s_ease-in-out_infinite_reverse]" />
              {/* Accent Blob */}
              <div className="absolute top-[40%] left-[20%] w-[30vh] h-[30vh] bg-pink-400/5 dark:bg-pink-800/10 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen animate-[pulse-glow_8s_ease-in-out_infinite]" />
              {/* Grid Pattern Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            <ReactFlowProvider>
              <DesignCanvas
                designs={designs}
                selectedArtifactId={selectedArtifactId}
                projectId={projectId}
                projectType={project?.type as "mobile" | "web" | undefined}
                onNodeSelect={setSelectedArtifactId}
                isReadOnly={isReadOnly}
              />
            </ReactFlowProvider>
          </div>
        </div>
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
