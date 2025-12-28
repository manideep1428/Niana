import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Attachment schema for file uploads
const attachmentSchema = v.object({
  name: v.string(),
  url: v.string(),
  contentType: v.string(),
  storageId: v.optional(v.id("_storage")),
});

export default defineSchema({
  users: defineTable({
    user_id: v.string(),
    email: v.string(),
    email_verified: v.boolean(),
    first_name: v.optional(v.union(v.string(), v.null())),
    last_name: v.optional(v.union(v.string(), v.null())),
    profile_picture_url: v.optional(v.union(v.string(), v.null())),
    created_at: v.string(),
    password: v.optional(v.union(v.string(), v.null())),
  })
    .index("by_email", ["email"])
    .index("by_user_id", ["user_id"]),

  projects: defineTable({
    user_id: v.string(),
    project_id: v.string(),
    title: v.string(),
    created_at: v.string(),
  }).index("by_user", ["user_id"]),

  messages: defineTable({
    project_id: v.string(),
    content: v.string(),
    initial_status: v.boolean(),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    design_ids: v.array(v.id("designs")),
    attachments: v.optional(v.array(attachmentSchema)), // File attachments
    created_at: v.string(),
  }).index("by_project", ["project_id"]),

  designs: defineTable({
    project_id: v.string(),
    artifact_id: v.string(), // Unique kebab-case identifier from AI (e.g., "login-page")
    title: v.string(),
    content: v.string(),
    version: v.number(), // Version number for tracking iterations
    status: v.union(v.literal("streaming"), v.literal("idle")), // Current state
    x: v.optional(v.number()),
    y: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_project", ["project_id"])
    .index("by_artifact_id", ["artifact_id"]),
});
