import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Allowed file types for upload
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Generate upload URL for file storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Save file metadata after upload
export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(args.contentType)) {
      throw new Error(
        `Invalid file type: ${args.contentType}. Allowed types: images, PDF, Word documents.`
      );
    }

    // Get the URL for the stored file
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get file URL");
    }

    return {
      storageId: args.storageId,
      name: args.name,
      url,
      contentType: args.contentType,
    };
  },
});

// Delete a file from storage
export const deleteFile = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
  },
});

export const saveUser = mutation({
  args: v.object({
    user_id: v.string(),
    email: v.string(),
    email_verified: v.boolean(),
    first_name: v.union(v.string(), v.null()),
    last_name: v.union(v.string(), v.null()),
    profile_picture_url: v.union(v.string(), v.null()),
    created_at: v.string(),
    password: v.union(v.string(), v.null()),
  }),

  handler: async (ctx, args) => {
    await ctx.db.insert("users", args);
  },
});

export const saveProject = mutation({
  args: {
    created_at: v.string(),
    user_id: v.string(),
    project_id: v.string(),
    title: v.string(),
    content: v.string(),
  },

  handler: async (ctx, args) => {
    // Insert only project fields (not content)
    await ctx.db.insert("projects", {
      created_at: args.created_at,
      user_id: args.user_id,
      project_id: args.project_id,
      title: args.title,
    });
    // Insert initial message with content
    await ctx.db.insert("messages", {
      created_at: Date.now().toString(),
      project_id: args.project_id,
      content: args.content,
      role: "user",
      design_ids: [],
      initial_status: false,
    });
  },
});

// Create a new design artifact
export const createDesign = mutation({
  args: {
    project_id: v.string(),
    artifact_id: v.string(),
    title: v.string(),
    content: v.string(),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const designId = await ctx.db.insert("designs", {
      project_id: args.project_id,
      artifact_id: args.artifact_id,
      title: args.title,
      content: args.content,
      version: 1,
      status: "idle",
      created_at: now,
      updated_at: now,
      x: args.x ?? 0,
      y: args.y ?? 0,
    });
    return designId;
  },
});

// Update an existing design by artifact_id
export const updateDesign = mutation({
  args: {
    artifact_id: v.string(),
    title: v.optional(v.string()),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("designs")
      .withIndex("by_artifact_id", (q) => q.eq("artifact_id", args.artifact_id))
      .first();

    if (!existing) {
      throw new Error(`Design with artifact_id "${args.artifact_id}" not found`);
    }

    await ctx.db.patch(existing._id, {
      content: args.content,
      title: args.title ?? existing.title,
      version: existing.version + 1,
      updated_at: Date.now(),
      status: "idle",
    });

    return existing._id;
  },
});

// Update design status (for streaming indicator)
export const updateDesignStatus = mutation({
  args: {
    artifact_id: v.string(),
    status: v.union(v.literal("streaming"), v.literal("idle")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("designs")
      .withIndex("by_artifact_id", (q) => q.eq("artifact_id", args.artifact_id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        updated_at: Date.now(),
      });
    }
  },
});

export const updateDesignCoordinates = mutation({
  args: {
    artifact_id: v.string(),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("designs")
      .withIndex("by_artifact_id", (q) => q.eq("artifact_id", args.artifact_id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        x: args.x,
        y: args.y,
        updated_at: Date.now(),
      });
    }
  },
});

// Save a message with optional design references and attachments
export const saveMessage = mutation({
  args: {
    project_id: v.string(),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    design_ids: v.array(v.id("designs")),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.string(),
          contentType: v.string(),
          storageId: v.optional(v.id("_storage")),
        })
      )
    ),
    initial_status: v.optional(v.boolean()), // Optional, defaults to true (already processed)
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      project_id: args.project_id,
      content: args.content,
      role: args.role,
      design_ids: args.design_ids,
      attachments: args.attachments ?? [],
      initial_status: args.initial_status ?? true, // Default to true (already processed)
      created_at: Date.now().toString(),
    });
  },
});

// Mark a message as processed (e.g. initial generation done)
export const markMessageProcessed = mutation({
  args: {
    message_id: v.id("messages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.message_id, {
      initial_status: true,
    });
  },
});

// Update project title
export const updateProjectTitle = mutation({
  args: {
    project_id: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("project_id"), args.project_id))
      .first();

    if (!project) {
      throw new Error(`Project with id "${args.project_id}" not found`);
    }

    await ctx.db.patch(project._id, {
      title: args.title,
    });
  },
});


// Delete a project and all related data (cascade delete)
export const deleteProject = mutation({
  args: {
    project_id: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the project
    const project = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("project_id"), args.project_id))
      .first();

    if (!project) {
      throw new Error(`Project with id "${args.project_id}" not found`);
    }

    // Delete all messages for this project
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_project", (q) => q.eq("project_id", args.project_id))
      .collect();

    for (const message of messages) {
      // Delete any file attachments from storage
      if (message.attachments) {
        for (const attachment of message.attachments) {
          if (attachment.storageId) {
            try {
              await ctx.storage.delete(attachment.storageId);
            } catch (e) {
              // Ignore if file already deleted
            }
          }
        }
      }
      await ctx.db.delete(message._id);
    }

    // Delete all designs for this project
    const designs = await ctx.db
      .query("designs")
      .withIndex("by_project", (q) => q.eq("project_id", args.project_id))
      .collect();

    for (const design of designs) {
      await ctx.db.delete(design._id);
    }

    // Finally delete the project
    await ctx.db.delete(project._id);

    return { success: true };
  },
});

// Rename a project
export const renameProject = mutation({
  args: {
    project_id: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("project_id"), args.project_id))
      .first();

    if (!project) {
      throw new Error(`Project with id "${args.project_id}" not found`);
    }

    await ctx.db.patch(project._id, {
      title: args.title,
    });

    return { success: true };
  },
});
