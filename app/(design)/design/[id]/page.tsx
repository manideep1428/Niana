"use client";

import { PromptSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useCallback, useEffect, useState, useRef } from "react";
import { Separator } from "@radix-ui/react-separator";
import { DesignCanvas, Design, ToolMode } from "@/components/design-canvas";
import { ReactFlowProvider } from "@xyflow/react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArtifactProvider, useArtifact } from "@/hooks/use-artifact";
import type { Attachment } from "@/components/preview-attachment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, Moon, Sun, Lock, Unlock } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TokenUsageDisplay } from "@/components/token-usage-display";
import type { SelectedElement } from "@/components/visual-editor";
import { toast } from "sonner";
import { useAuth } from "@workos-inc/authkit-nextjs/components";

// Types for SSE events
interface TextEvent {
  type: "text";
  content: string;
}

// New ai-chatbot style text delta event
interface TextDeltaEvent {
  type: "text-delta";
  content: string;
}

interface ToolCallEvent {
  type: "tool_call";
  tool:
    | "create_artifact"
    | "update_artifact"
    | "createArtifact"
    | "updateArtifact";
  projectId: string;
  data: {
    id: string;
    title: string;
    content: string;
  };
}

// New ai-chatbot style tool call event
interface NewToolCallEvent {
  type: "tool-call";
  name: "createArtifact" | "updateArtifact";
  args: {
    id: string;
    title: string;
    content: string;
  };
}

interface ArtifactStartEvent {
  type: "artifact_start" | "artifact-start";
  id?: string;
  title?: string;
  data?: {
    id: string;
    title: string;
  };
}

interface ContentDeltaEvent {
  type: "content_delta" | "artifact-delta";
  id?: string;
  content?: string;
  data?: {
    id: string;
    delta: string;
  };
}

interface ArtifactFinishEvent {
  type: "artifact_finish" | "artifact-finish";
  tool?:
    | "create_artifact"
    | "update_artifact"
    | "createArtifact"
    | "updateArtifact";
  projectId?: string;
  id?: string;
  title?: string;
  content?: string;
  data?: {
    id: string;
    title: string;
    content: string;
  };
}

interface SkeletonEvent {
  type: "skeleton";
  data: {
    id: string;
    title: string;
  };
}

interface DoneEvent {
  type: "done";
}

// New ai-chatbot style finish event
interface FinishEvent {
  type: "finish";
  reason: string;
}

interface ErrorEvent {
  type: "error";
  message: string;
}

type SSEEvent =
  | TextEvent
  | TextDeltaEvent
  | ToolCallEvent
  | NewToolCallEvent
  | ArtifactStartEvent
  | ContentDeltaEvent
  | ArtifactFinishEvent
  | SkeletonEvent
  | DoneEvent
  | FinishEvent
  | ErrorEvent;

// Message type for chat
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
}

// Edit action type for undo/redo history
interface EditAction {
  type: "style" | "content" | "attribute";
  artifactId: string;
  property?: string;
  attribute?: string;
  oldValue: string;
  newValue: string;
}

function DesignPageContent() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // Visual Editor State
  const [activeTab, setActiveTab] = useState<"chat" | "design">("chat");
  const [selectedElement, setSelectedElement] =
    useState<SelectedElement | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode>("hand");

  // Pending skeleton designs (shown while AI is generating)
  const [pendingDesigns, setPendingDesigns] = useState<Design[]>([]);

  // AbortController for stopping generation
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStoppedRef = useRef(false);

  // Handle tab change - auto switch to pointer mode when switching to design tab
  const handleTabChange = useCallback((tab: "chat" | "design") => {
    setActiveTab(tab);
    if (tab === "design") {
      setToolMode("mouse");
    }
  }, []);

  // Undo/Redo History
  const [editHistory, setEditHistory] = useState<EditAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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

  // Warn before unload if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle messages from iframe (e.g. returnHtml)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (
        event.data?.type === "returnHtml" &&
        event.data?.artifactId &&
        event.data?.html
      ) {
        try {
          // Find current title
          const currentDesign = designs.find(
            (d) => d.artifact_id === event.data.artifactId,
          );
          await updateDesign({
            artifact_id: event.data.artifactId,
            title: currentDesign?.title || "Untitled",
            content: event.data.html,
          });
          setHasUnsavedChanges(false);
          // Clear history after successful save
          setEditHistory([]);
          setHistoryIndex(-1);
        } catch (e) {
          console.error("Failed to save design:", e);
        } finally {
          setIsSaving(false);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [designs, updateDesign]);

  // Visual Editor Handlers
  const handleElementSelect = useCallback(
    (artifactId: string, elementInfo: any) => {
      setSelectedArtifactId(artifactId);
      setSelectedElement(elementInfo);
      handleTabChange("design");
    },
    [setSelectedArtifactId, handleTabChange],
  );

  // Helper to add action to history
  const addToHistory = useCallback(
    (action: EditAction) => {
      setEditHistory((prev) => {
        // Remove any future history if we're not at the end
        const newHistory = prev.slice(0, historyIndex + 1);
        return [...newHistory, action];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  const handleUpdateStyle = useCallback(
    (property: string, value: string) => {
      if (!selectedArtifactId || !selectedElement) return;

      // Get old value for undo
      const oldValue = selectedElement.styles?.[property] || "";

      // Add to history
      addToHistory({
        type: "style",
        artifactId: selectedArtifactId,
        property,
        oldValue,
        newValue: value,
      });

      setHasUnsavedChanges(true);
      const iframe = document.getElementsByName(
        selectedArtifactId,
      )[0] as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          { type: "updateStyle", property, value },
          "*",
        );
      }
      setSelectedElement((prev) =>
        prev
          ? {
              ...prev,
              styles: { ...prev.styles, [property]: value },
            }
          : null,
      );
    },
    [selectedArtifactId, selectedElement, addToHistory],
  );

  // Preview style change without recording to history (for color picker dragging)
  const handlePreviewStyle = useCallback(
    (property: string, value: string) => {
      if (!selectedArtifactId) return;

      setHasUnsavedChanges(true);
      const iframe = document.getElementsByName(
        selectedArtifactId,
      )[0] as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          { type: "updateStyle", property, value },
          "*",
        );
      }
      // Update local state for preview
      setSelectedElement((prev) =>
        prev
          ? {
              ...prev,
              styles: { ...prev.styles, [property]: value },
            }
          : null,
      );
    },
    [selectedArtifactId],
  );

  const handleUpdateContent = useCallback(
    (content: string) => {
      if (!selectedArtifactId || !selectedElement) return;

      // Get old value for undo
      const oldValue = selectedElement.textContent || "";

      // Add to history
      addToHistory({
        type: "content",
        artifactId: selectedArtifactId,
        oldValue,
        newValue: content,
      });

      setHasUnsavedChanges(true);
      const iframe = document.getElementsByName(
        selectedArtifactId,
      )[0] as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          { type: "updateContent", value: content },
          "*",
        );
      }
      setSelectedElement((prev) =>
        prev ? { ...prev, textContent: content } : null,
      );
    },
    [selectedArtifactId, selectedElement, addToHistory],
  );

  const handleSelectParent = useCallback(() => {
    if (!selectedArtifactId) return;
    const iframe = document.getElementsByName(
      selectedArtifactId,
    )[0] as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: "selectParent" }, "*");
    }
  }, [selectedArtifactId]);

  const handleUpdateAttribute = useCallback(
    (attribute: string, value: string) => {
      if (!selectedArtifactId || !selectedElement) return;

      // Get old value for undo
      const oldValue = selectedElement.attributes?.[attribute] || "";

      // Add to history
      addToHistory({
        type: "attribute",
        artifactId: selectedArtifactId,
        attribute,
        oldValue: String(oldValue),
        newValue: value,
      });

      setHasUnsavedChanges(true);
      const iframe = document.getElementsByName(
        selectedArtifactId,
      )[0] as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          { type: "updateAttribute", attribute, value },
          "*",
        );
      }
      setSelectedElement((prev) =>
        prev
          ? {
              ...prev,
              attributes: { ...prev.attributes, [attribute]: value },
            }
          : null,
      );
    },
    [selectedArtifactId, selectedElement, addToHistory],
  );

  // Undo handler
  const handleUndo = useCallback(() => {
    if (historyIndex < 0) return;

    const action = editHistory[historyIndex];
    const iframe = document.getElementsByName(
      action.artifactId,
    )[0] as HTMLIFrameElement;

    if (iframe?.contentWindow) {
      // Apply the reverse of the action
      if (action.type === "style" && action.property) {
        iframe.contentWindow.postMessage(
          {
            type: "updateStyle",
            property: action.property,
            value: action.oldValue,
          },
          "*",
        );
        setSelectedElement((prev) =>
          prev
            ? {
                ...prev,
                styles: { ...prev.styles, [action.property!]: action.oldValue },
              }
            : null,
        );
      } else if (action.type === "content") {
        iframe.contentWindow.postMessage(
          { type: "updateContent", value: action.oldValue },
          "*",
        );
        setSelectedElement((prev) =>
          prev ? { ...prev, textContent: action.oldValue } : null,
        );
      } else if (action.type === "attribute" && action.attribute) {
        iframe.contentWindow.postMessage(
          {
            type: "updateAttribute",
            attribute: action.attribute,
            value: action.oldValue,
          },
          "*",
        );
        setSelectedElement((prev) =>
          prev
            ? {
                ...prev,
                attributes: {
                  ...prev.attributes,
                  [action.attribute!]: action.oldValue,
                },
              }
            : null,
        );
      }
    }

    setHistoryIndex((prev) => prev - 1);
  }, [editHistory, historyIndex]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (historyIndex >= editHistory.length - 1) return;

    const action = editHistory[historyIndex + 1];
    const iframe = document.getElementsByName(
      action.artifactId,
    )[0] as HTMLIFrameElement;

    if (iframe?.contentWindow) {
      // Re-apply the action
      if (action.type === "style" && action.property) {
        iframe.contentWindow.postMessage(
          {
            type: "updateStyle",
            property: action.property,
            value: action.newValue,
          },
          "*",
        );
        setSelectedElement((prev) =>
          prev
            ? {
                ...prev,
                styles: { ...prev.styles, [action.property!]: action.newValue },
              }
            : null,
        );
      } else if (action.type === "content") {
        iframe.contentWindow.postMessage(
          { type: "updateContent", value: action.newValue },
          "*",
        );
        setSelectedElement((prev) =>
          prev ? { ...prev, textContent: action.newValue } : null,
        );
      } else if (action.type === "attribute" && action.attribute) {
        iframe.contentWindow.postMessage(
          {
            type: "updateAttribute",
            attribute: action.attribute,
            value: action.newValue,
          },
          "*",
        );
        setSelectedElement((prev) =>
          prev
            ? {
                ...prev,
                attributes: {
                  ...prev.attributes,
                  [action.attribute!]: action.newValue,
                },
              }
            : null,
        );
      }
    }

    setHistoryIndex((prev) => prev + 1);
  }, [editHistory, historyIndex]);

  // Check if undo/redo is possible
  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < editHistory.length - 1;

  const handleSave = useCallback(() => {
    if (!selectedArtifactId) return;
    setIsSaving(true);
    const iframe = document.getElementsByName(
      selectedArtifactId,
    )[0] as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: "getHtml" }, "*");
    }
  }, [selectedArtifactId]);

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      if (
        confirm(
          "You have unsaved changes. Are you sure you want to discard them?",
        )
      ) {
        setHasUnsavedChanges(false);
        // To revert visual changes, we can reload the page or try to reset iframe.
        // For now, reloading page is the safest way to ensure clean state
        window.location.reload();
      }
    } else {
      setActiveTab("chat");
    }
  }, [hasUnsavedChanges]);

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

  // Load messages from Convex on mount
  // IMPORTANT: Skip sync while streaming to prevent overwriting streaming messages
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
      const totalTokens = subscription?.tokens_total ?? 10000;
      const usedTokens = subscription?.tokens_used ?? 0;

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
          { role: "assistant", content: assistantContent, artifacts },
        ]);

        // Save assistant message to database with artifact references
        await saveMessage({
          project_id: projectId,
          content: assistantContent,
          role: "assistant",
          design_ids: artifactDbIds as any, // Convex IDs of created/updated designs
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
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedElement={selectedElement}
        onUpdateStyle={handleUpdateStyle}
        onPreviewStyle={handlePreviewStyle}
        onUpdateContent={handleUpdateContent}
        onUpdateAttribute={handleUpdateAttribute}
        onSelectParent={handleSelectParent}
        onSave={handleSave}
        onCancel={handleCancel}
        hasUnsavedChanges={hasUnsavedChanges}
        isReadOnly={isReadOnly}
        onFork={handleForkProject}
        projectTitle={project?.title || "Untitled"}
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
                {/* Privacy Toggle */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={async () => {
                          const result = await toggleVisibility({
                            project_id: projectId,
                          });
                          toast.success(
                            result.is_public
                              ? "Project is now public! Others can view it in the community."
                              : "Project is now private.",
                          );
                        }}
                      >
                        {project?.is_public ? (
                          <Unlock className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {project?.is_public
                          ? "Public - Click to make private"
                          : "Private - Click to share with community"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 px-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Image
                    onClick={() =>
                      toast.info("Coming Soon!", {
                        description:
                          "Export to Bolt.new will be available soon.",
                      })
                    }
                    src="/Bolt.new.png"
                    alt="Bolt.new"
                    width={80}
                    height={28}
                    className="cursor-pointer rounded-md hover:opacity-80 transition-opacity h-7 w-auto"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export to bolt.new (Coming Soon)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Image
                    onClick={() =>
                      toast.info("Coming Soon!", {
                        description:
                          "Export to Lovable will be available soon.",
                      })
                    }
                    src={
                      theme === "dark"
                        ? "/lovable-logo-bg-dark.png"
                        : "/lovable-logo-bg-light.png"
                    }
                    alt="Lovable"
                    width={80}
                    height={28}
                    className="cursor-pointer rounded-md hover:opacity-80 transition-opacity h-7 w-auto"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export to lovable.dev (Coming Soon)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TokenUsageDisplay />
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
              onElementSelect={handleElementSelect}
              onSave={handleSave}
              hasUnsavedChanges={hasUnsavedChanges}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              isSaving={isSaving}
              toolMode={toolMode}
              onToolModeChange={setToolMode}
              isReadOnly={isReadOnly}
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
