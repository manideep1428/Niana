// Attachment type for file uploads
export type Attachment = {
  name: string;
  url: string;
  contentType: string;
  storageId?: string;
};

// Allowed file types for upload
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Helper to check if file type is allowed
export function isAllowedFileType(type: string): boolean {
  return ALLOWED_FILE_TYPES.includes(type as any);
}

// Helper to check if file is an image
export function isImageFile(contentType: string): boolean {
  return contentType.startsWith("image/");
}

// Helper to get file extension from name
export function getFileExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()?.toUpperCase() || "" : "";
}

export interface TextEvent {
  type: "text";
  content: string;
}

export interface TextDeltaEvent {
  type: "text-delta";
  content: string;
}

export interface ToolCallEvent {
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

export interface NewToolCallEvent {
  type: "tool-call";
  name: "createArtifact" | "updateArtifact";
  args: {
    id: string;
    title: string;
    content: string;
  };
}

export interface ArtifactStartEvent {
  type: "artifact_start" | "artifact-start";
  id?: string;
  title?: string;
  data?: {
    id: string;
    title: string;
  };
}

export interface ContentDeltaEvent {
  type: "content_delta" | "artifact-delta";
  id?: string;
  content?: string;
  data?: {
    id: string;
    delta: string;
  };
}

export interface ArtifactFinishEvent {
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

export interface SkeletonEvent {
  type: "skeleton";
  data: {
    id: string;
    title: string;
  };
}

export interface DoneEvent {
  type: "done";
}

export interface FinishEvent {
  type: "finish";
  reason: string;
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export type SSEEvent =
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
