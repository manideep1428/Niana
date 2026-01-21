"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useReactFlow,
  useViewport,
  Node,
  NodeTypes,
  Panel,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DesignNode, DesignNodeData } from "./design-node";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Hand,
  MousePointer,
  Undo2,
  Redo2,
  Loader2,
} from "lucide-react";

// Tool modes
export type ToolMode = "hand" | "mouse";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Custom node types
const nodeTypes: NodeTypes = {
  design: DesignNode,
};

// Zoom limits
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 1.5;

export interface Design {
  _id: string;
  artifact_id: string;
  title: string;
  content: string;
  status: "streaming" | "idle";
  x?: number;
  y?: number;
}

interface DesignCanvasProps {
  designs: Design[];
  selectedArtifactId: string | null;
  projectId: string; // Added for Figma export caching
  onNodeSelect?: (artifactId: string | null) => void;
  onElementSelect?: (
    artifactId: string,
    elementInfo: {
      tagName: string;
      id?: string;
      className?: string;
      textContent?: string;
      styles: any;
      path: string[];
    },
  ) => void;
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isSaving?: boolean;
  toolMode?: ToolMode;
  onToolModeChange?: (mode: ToolMode) => void;
  isReadOnly?: boolean;
}

export function DesignCanvas({
  designs,
  selectedArtifactId,
  projectId,
  onNodeSelect,
  onElementSelect,
  onSave,
  hasUnsavedChanges,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isSaving,
  toolMode: controlledToolMode,
  onToolModeChange,
  isReadOnly = false,
}: DesignCanvasProps) {
  const { fitView, setCenter, zoomIn, zoomOut } = useReactFlow();
  const { zoom } = useViewport();
  const updateCoordinates = useMutation(api.mutations.updateDesignCoordinates);
  const deleteDesign = useMutation(api.mutations.deleteDesign);

  // Tool mode state - can be controlled from parent or internal
  const [internalToolMode, setInternalToolMode] = useState<ToolMode>("hand");

  // Use controlled mode if provided, otherwise use internal state
  const toolMode = controlledToolMode ?? internalToolMode;
  const setToolMode = (mode: ToolMode) => {
    if (onToolModeChange) {
      onToolModeChange(mode);
    } else {
      setInternalToolMode(mode);
    }
  };

  // Track if selection came from canvas interaction (to skip centering)
  const isInternalSelection = useRef(false);

  // Track if we've done the initial position load from DB
  const hasLoadedPositions = useRef(false);

  // Check if zoom in/out is possible
  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;

  // Handle design deletion
  const handleDeleteDesign = useCallback(
    async (artifactId: string) => {
      try {
        await deleteDesign({ artifact_id: artifactId });
        console.log("Design deleted successfully:", artifactId);
      } catch (error) {
        console.error("Error deleting design:", error);
      }
    },
    [deleteDesign],
  );

  // Convert designs to React Flow nodes
  const initialNodes: Node<DesignNodeData>[] = useMemo(() => {
    console.log(
      "Creating initial nodes from designs:",
      designs.map((d) => ({
        id: d.artifact_id,
        x: d.x,
        y: d.y,
      })),
    );

    return designs.map((design, index) => {
      // Use DB position only if it's valid (not default 0,0)
      const hasValidDbPosition =
        typeof design.x === "number" &&
        typeof design.y === "number" &&
        (design.x !== 0 || design.y !== 0);

      const position = hasValidDbPosition
        ? { x: design.x as number, y: design.y as number }
        : {
            // Increased gap: 500px horizontal (375px width + 125px gap), 850px vertical
            x: (index % 3) * 500,
            y: Math.floor(index / 3) * 850,
          };

      console.log(
        `Node ${design.artifact_id}: hasValidDbPosition=${hasValidDbPosition}, position=`,
        position,
      );

      return {
        id: design.artifact_id,
        type: "design",
        position,
        data: {
          artifactId: design.artifact_id,
          projectId: projectId, // Pass projectId for Figma export caching
          title: design.title,
          content: design.content,
          isStreaming: design.status === "streaming",
          onDelete: handleDeleteDesign,
          onElementSelect: onElementSelect,
          isInteractive: toolMode === "mouse",
        },
        selected: design.artifact_id === selectedArtifactId,
      };
    });
  }, [
    designs,
    selectedArtifactId,
    projectId,
    handleDeleteDesign,
    onElementSelect,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  // Sync nodes with initialNodes when designs change (e.g., on page load when data arrives from Convex)
  useEffect(() => {
    const currentIds = new Set(nodes.map((n) => n.id));
    const newIds = new Set(initialNodes.map((n) => n.id));

    // Check if the set of designs has changed
    const idsChanged =
      currentIds.size !== newIds.size ||
      ![...currentIds].every((id) => newIds.has(id));

    if (idsChanged || nodes.length === 0) {
      console.log("Syncing nodes with initialNodes (designs changed)");
      setNodes(initialNodes);
    } else {
      // Update existing nodes with new content/streaming status
      setNodes((nds) =>
        nds.map((node) => {
          const updatedNode = initialNodes.find((n) => n.id === node.id);
          if (updatedNode && node.type === "design") {
            const currentData = node.data as DesignNodeData;
            const newData = updatedNode.data as DesignNodeData;
            // Update if content or streaming status changed
            if (
              currentData.content !== newData.content ||
              currentData.isStreaming !== newData.isStreaming
            ) {
              return {
                ...node,
                data: {
                  ...currentData,
                  content: newData.content,
                  isStreaming: newData.isStreaming,
                },
              };
            }
          }
          return node;
        }),
      );
    }
  }, [initialNodes, setNodes]);

  // Update nodes interactive state when tool mode changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "design") {
          return {
            ...node,
            data: {
              ...node.data,
              isInteractive: toolMode === "mouse",
              onElementSelect: onElementSelect, // Update callback if changed
            },
          };
        }
        return node;
      }),
    );
  }, [toolMode, onElementSelect, setNodes]);

  // Focus on selected node when selection comes from external source (chat click)
  useEffect(() => {
    if (selectedArtifactId && !isInternalSelection.current) {
      // Use setTimeout to ensure nodes state is up to date
      setTimeout(() => {
        const selectedNode = nodes.find((n) => n.id === selectedArtifactId);
        if (selectedNode) {
          setCenter(
            selectedNode.position.x + 187.5, // Center of 375px width
            selectedNode.position.y + 406, // Center of 812px height (6.1 inch phone)
            { zoom: 0.8, duration: 500 },
          );
        }
      }, 0);
    }
    // Reset the flag after processing
    isInternalSelection.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArtifactId, setCenter]);

  // Handle node selection
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      // Mark as internal selection to skip centering
      isInternalSelection.current = true;
      if (selectedNodes.length > 0) {
        onNodeSelect?.(selectedNodes[0].id);
      } else {
        onNodeSelect?.(null);
      }
    },
    [onNodeSelect],
  );

  const onNodeDragStop = useCallback(
    async (_: React.MouseEvent, node: Node) => {
      console.log("Node drag stopped:", node.id, node.position);
      try {
        console.log("Calling updateCoordinates mutation...");
        await updateCoordinates({
          artifact_id: node.id,
          x: node.position.x,
          y: node.position.y,
        });
        console.log("Coordinates updated successfully!");
      } catch (error) {
        console.error("Error updating coordinates:", error);
      }
    },
    [updateCoordinates],
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        onSelectionChange={handleSelectionChange}
        onNodeDragStop={isReadOnly ? undefined : onNodeDragStop}
        nodesDraggable={!isReadOnly}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        proOptions={{ hideAttribution: true }}
        panOnDrag={toolMode === "hand" ? [0, 1, 2] : false}
        selectionOnDrag={toolMode === "mouse"}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

        {/* Save/Undo/Redo Toolbar - only visible in mouse mode and not read-only */}
        {toolMode === "mouse" && !isReadOnly && (
          <Panel position="top-center" className="mt-4">
            <div className="flex items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-md backdrop-blur-sm">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs font-medium gap-1.5"
                onClick={onSave}
                disabled={!hasUnsavedChanges || isSaving}
              >
                {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <div className="w-px h-4 bg-border" />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                title="Undo"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                title="Redo"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Panel>
        )}

        {/* Custom Controls */}
        <Panel position="bottom-center" className="mb-8">
          <div className="flex items-center gap-2 rounded-full border bg-background/95 p-2 shadow-lg backdrop-blur-sm">
            {/* Tool Mode Selector */}
            <div className="flex items-center gap-1 border-r pr-2 mr-1">
              <Button
                variant={toolMode === "hand" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setToolMode("hand")}
                className={`h-9 w-9 rounded-full ${
                  toolMode === "hand"
                    ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                    : "hover:bg-muted"
                }`}
                title="Hand tool - Pan canvas"
              >
                <Hand className="h-4 w-4" />
              </Button>
              {!isReadOnly && (
                <Button
                  variant={toolMode === "mouse" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setToolMode("mouse")}
                  className={`h-9 w-9 rounded-full ${
                    toolMode === "mouse"
                      ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                      : "hover:bg-muted"
                  }`}
                  title="Mouse tool - Select elements"
                >
                  <MousePointer className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Zoom Controls */}
            {canZoomOut && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => zoomOut()}
                className="h-9 w-9 bg-background/95 rounded-full hover:bg-muted"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            )}
            {canZoomIn && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => zoomIn()}
                className="h-9 w-9 bg-background/95 rounded-full hover:bg-muted"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fitView({ duration: 500 })}
              className="h-9 w-9 bg-background/95 rounded-full hover:bg-muted"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </Panel>

        <MiniMap
          nodeStrokeWidth={3}
          pannable={true}
          zoomable={true}
          inversePan={true}
          nodeColor="#6366f1"
          maskColor="rgba(0, 0, 0, 0.2)"
          position="bottom-right"
          onNodeClick={(_, node) => {
            setCenter(node.position.x + 187.5, node.position.y + 406, {
              zoom: 0.8,
              duration: 500,
            });
          }}
          style={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            zIndex: 10,
          }}
        />
      </ReactFlow>
    </div>
  );
}
