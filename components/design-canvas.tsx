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
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

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
  projectType?: "mobile" | "web"; // Added for node sizing
  onNodeSelect?: (artifactId: string | null) => void;
  isReadOnly?: boolean;
}

export function DesignCanvas({
  designs,
  selectedArtifactId,
  projectId,
  projectType = "mobile",
  onNodeSelect,
  isReadOnly = false,
}: DesignCanvasProps) {
  const { fitView, setCenter, zoomIn, zoomOut } = useReactFlow();
  const { zoom } = useViewport();
  const updateCoordinates = useMutation(api.mutations.updateDesignCoordinates);
  const deleteDesign = useMutation(api.mutations.deleteDesign);

  // Track if selection came from canvas interaction (to skip centering)
  const isInternalSelection = useRef(false);

  // Check if zoom in/out is possible
  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;

  // Node dimensions based on project type
  const nodeWidth = projectType === "web" ? 1024 : 375;
  const nodeHeight = projectType === "web" ? 700 : 812;
  const nodeGapX = projectType === "web" ? 1150 : 500; // horizontal gap
  const nodeGapY = projectType === "web" ? 750 : 850; // vertical gap

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
    return designs.map((design, index) => {
      // Use DB position only if it's valid (not default 0,0)
      const hasValidDbPosition =
        typeof design.x === "number" &&
        typeof design.y === "number" &&
        (design.x !== 0 || design.y !== 0);

      const position = hasValidDbPosition
        ? { x: design.x as number, y: design.y as number }
        : {
            // Dynamic gap based on project type
            x: (index % 3) * nodeGapX,
            y: Math.floor(index / 3) * nodeGapY,
          };

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
          type: projectType, // Pass project type to node
          onDelete: handleDeleteDesign,
          isInteractive: false,
        },
        selected: design.artifact_id === selectedArtifactId,
      };
    });
  }, [
    designs,
    selectedArtifactId,
    projectId,
    projectType,
    nodeGapX,
    nodeGapY,
    handleDeleteDesign,
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

    // Center offset based on node size
    const centerOffsetX = nodeWidth / 2;
    const centerOffsetY = nodeHeight / 2;

    if (idsChanged || nodes.length === 0) {
      console.log("Syncing nodes with initialNodes (designs changed)");
      setNodes(initialNodes);

      // Center view logic
      const streamingNode = initialNodes.find(
        (n) => (n.data as DesignNodeData).isStreaming,
      );

      // Condition 1: A new design is being generated (has skeleton/streaming)
      // Condition 2: This is the first design ever (canvas was empty)
      // Condition 3: We have exactly one design (ensure it's centered on load/refresh)
      if (streamingNode) {
        // Always focus on the node being generated
        setTimeout(() => {
          setCenter(
            streamingNode.position.x + centerOffsetX,
            streamingNode.position.y + centerOffsetY,
            {
              zoom: projectType === "web" ? 0.5 : 0.85,
              duration: 1000,
            },
          );
        }, 100);
      } else if (
        (nodes.length === 0 && initialNodes.length > 0) ||
        (initialNodes.length === 1 && !isInternalSelection.current)
      ) {
        // Center on the last added node if we just got data, or if there's only one node
        const targetNode = initialNodes[initialNodes.length - 1];
        setTimeout(() => {
          setCenter(
            targetNode.position.x + centerOffsetX,
            targetNode.position.y + centerOffsetY,
            {
              zoom: projectType === "web" ? 0.5 : 0.85,
              duration: 800,
            },
          );
        }, 100);
      }
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
  }, [initialNodes, setNodes, nodeWidth, nodeHeight, projectType]);

  // Focus on selected node when selection comes from external source (chat click)
  useEffect(() => {
    if (selectedArtifactId && !isInternalSelection.current) {
      // Center offset based on node size
      const centerOffsetX = nodeWidth / 2;
      const centerOffsetY = nodeHeight / 2;

      // Use setTimeout to ensure nodes state is up to date
      setTimeout(() => {
        const selectedNode = nodes.find((n) => n.id === selectedArtifactId);
        if (selectedNode) {
          setCenter(
            selectedNode.position.x + centerOffsetX,
            selectedNode.position.y + centerOffsetY,
            { zoom: projectType === "web" ? 0.5 : 0.8, duration: 500 },
          );
        }
      }, 0);
    }
    // Reset the flag after processing
    isInternalSelection.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArtifactId, setCenter, nodeWidth, nodeHeight, projectType]);

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
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        defaultViewport={{ x: 0, y: 0, zoom: 0.44 }}
        proOptions={{ hideAttribution: true }}
        panOnDrag={[0, 1, 2]}
        selectionOnDrag={false}
      >
        <Background gap={40} size={1} />

        {/* Custom Controls */}
        <Panel position="bottom-center" className="mb-8">
          <div className="flex items-center gap-1 p-1 rounded-full bg-background/95 border border-border shadow-sm">
            {/* Zoom Controls */}
            {canZoomOut && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => zoomOut()}
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            )}
            <span className="min-w-[3rem] text-center text-xs font-medium text-foreground tabular-nums select-none">
              {Math.round(zoom * 100)}%
            </span>
            {canZoomIn && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => zoomIn()}
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            )}
            <div className="w-px h-4 bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fitView({ duration: 500 })}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all"
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
            const centerOffsetX = nodeWidth / 2;
            const centerOffsetY = nodeHeight / 2;
            setCenter(
              node.position.x + centerOffsetX,
              node.position.y + centerOffsetY,
              {
                zoom: projectType === "web" ? 0.5 : 0.8,
                duration: 500,
              },
            );
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
