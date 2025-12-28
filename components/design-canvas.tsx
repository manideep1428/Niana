"use client";

import { useCallback, useEffect, useMemo } from "react";
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

  // Check if zoom in/out is possible
  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;

  // Convert designs to React Flow nodes
  const initialNodes: Node<DesignNodeData>[] = useMemo(() => {
    return designs.map((design, index) => ({
      id: design.artifact_id,
      type: "design",
      dragHandle: ".custom-drag-handle",
      position: {
        x: design.x ?? (index % 3) * 450, // Use saved x or default to grid
        y: design.y ?? Math.floor(index / 3) * 750, // Use saved y or default to grid
      },
      data: {
        artifactId: design.artifact_id,
        title: design.title,
        content: design.content,
        isStreaming: design.status === "streaming",
      },
      selected: design.artifact_id === selectedArtifactId,
    }));
  }, [designs, selectedArtifactId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  // Update nodes when designs change
  useEffect(() => {
    setNodes((currentNodes) => {
      const designMap = new Map(designs.map((d) => [d.artifact_id, d]));
      const existingIds = new Set(currentNodes.map((n) => n.id));

      // Update existing nodes
      const updatedNodes = currentNodes.map((node) => {
        const design = designMap.get(node.id);
        if (design) {
          return {
            ...node,
            data: {
              ...node.data,
              title: design.title,
              content: design.content,
              isStreaming: design.status === "streaming",
            },
            selected: design.artifact_id === selectedArtifactId,
          };
        }
        return node;
      });

      // Add new nodes
      const newNodes = designs
        .filter((d) => !existingIds.has(d.artifact_id))
        .map((design, index) => ({
          id: design.artifact_id,
          type: "design" as const,
          dragHandle: ".custom-drag-handle",
          position: {
            x: design.x ?? ((existingIds.size + index) % 3) * 450,
            y: design.y ?? Math.floor((existingIds.size + index) / 3) * 750,
          },
          data: {
            artifactId: design.artifact_id,
            title: design.title,
            content: design.content,
            isStreaming: design.status === "streaming",
          },
          selected: design.artifact_id === selectedArtifactId,
        }));

      return [...updatedNodes, ...newNodes];
    });
  }, [designs, selectedArtifactId, setNodes]);

  // Focus on selected node when selection changes
  useEffect(() => {
    if (selectedArtifactId) {
      const selectedNode = nodes.find((n) => n.id === selectedArtifactId);
      if (selectedNode) {
        setCenter(
          selectedNode.position.x + 187.5, // Center of 375px width
          selectedNode.position.y + 333.5, // Center of 667px height
          { zoom: 0.8, duration: 500 }
        );
      }
    }
  }, [selectedArtifactId, nodes, setCenter]);

  // Handle node selection
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      if (selectedNodes.length > 0) {
        onNodeSelect?.(selectedNodes[0].id);
      } else {
        onNodeSelect?.(null);
      }
    },
    [onNodeSelect]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateCoordinates({
        artifact_id: node.id,
        x: node.position.x,
        y: node.position.y,
      });
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
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

        {/* Custom Controls */}
        <Panel position="bottom-center" className="mb-8">
          <div className="flex items-center gap-2 rounded-full border bg-background/95 p-2 shadow-lg backdrop-blur-sm">
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
          pannable
          zoomable
          className="!bg-background !border-border"
        />
      </ReactFlow>
    </div>
  );
}
