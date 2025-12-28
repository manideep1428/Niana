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
