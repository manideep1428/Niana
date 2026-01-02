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
import { ZoomIn, ZoomOut, Maximize, Hand, MousePointer } from "lucide-react";

// Tool modes
type ToolMode = "hand" | "mouse";
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
  onNodeSelect?: (artifactId: string | null) => void;
}

export function DesignCanvas({
  designs,
  selectedArtifactId,
  onNodeSelect,
}: DesignCanvasProps) {
  const { fitView, setCenter, zoomIn, zoomOut } = useReactFlow();
  const { zoom } = useViewport();
  const updateCoordinates = useMutation(api.mutations.updateDesignCoordinates);
  const deleteDesign = useMutation(api.mutations.deleteDesign);

  // Tool mode state - hand enables panning, mouse will be for future functionality
  const [toolMode, setToolMode] = useState<ToolMode>("hand");

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
    [deleteDesign]
  );

  // Convert designs to React Flow nodes
  const initialNodes: Node<DesignNodeData>[] = useMemo(() => {
    console.log(
      "Creating initial nodes from designs:",
      designs.map((d) => ({
        id: d.artifact_id,
        x: d.x,
        y: d.y,
      }))
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
            x: (index % 3) * 450,
            y: Math.floor(index / 3) * 750,
          };

      console.log(
        `Node ${design.artifact_id}: hasValidDbPosition=${hasValidDbPosition}, position=`,
        position
      );

      return {
        id: design.artifact_id,
        type: "design",
        position,
        data: {
          artifactId: design.artifact_id,
          title: design.title,
          content: design.content,
          isStreaming: design.status === "streaming",
          onDelete: handleDeleteDesign,
        },
        selected: design.artifact_id === selectedArtifactId,
      };
    });
  }, [designs, selectedArtifactId, handleDeleteDesign]);

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
    }
  }, [initialNodes, setNodes]);

  // Focus on selected node when selection comes from external source (chat click)
  useEffect(() => {
    if (selectedArtifactId && !isInternalSelection.current) {
      // Use setTimeout to ensure nodes state is up to date
      setTimeout(() => {
        const selectedNode = nodes.find((n) => n.id === selectedArtifactId);
        if (selectedNode) {
          setCenter(
            selectedNode.position.x + 187.5, // Center of 375px width
            selectedNode.position.y + 333.5, // Center of 667px height
            { zoom: 0.8, duration: 500 }
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
    [onNodeSelect]
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
    [updateCoordinates]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        onSelectionChange={handleSelectionChange}
        onNodeDragStop={onNodeDragStop}
        nodesDraggable={true}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        proOptions={{ hideAttribution: true }}
        panOnDrag={toolMode === "hand" ? [1, 2] : false}
        selectionOnDrag={toolMode === "mouse"}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

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
            setCenter(node.position.x + 187.5, node.position.y + 333.5, {
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
