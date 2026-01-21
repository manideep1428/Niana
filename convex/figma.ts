import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get Figma cached data by figma_export_id (unique per design)
export const getFigmaData = query({
  args: { figma_export_id: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("figma")
      .withIndex("by_figma_export_id", (q) =>
        q.eq("figma_export_id", args.figma_export_id),
      )
      .first();
    return data;
  },
});

// Save Figma data with figma_export_id
export const saveFigmaData = mutation({
  args: {
    user_id: v.optional(v.string()),
    figma_export_id: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("figma")
      .withIndex("by_figma_export_id", (q) =>
        q.eq("figma_export_id", args.figma_export_id),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        updated_at: new Date().toISOString(),
      });
      return existing._id;
    }

    const id = await ctx.db.insert("figma", {
      user_id: args.user_id || "system",
      figma_export_id: args.figma_export_id,
      content: args.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return id;
  },
});

// Get Figma usage count for a user (for subscription limits)
export const getFigmaUserCount = query({
  args: {
    user_id: v.string(),
    since: v.string(),
  },
  handler: async (ctx, args) => {
    const designs = await ctx.db
      .query("figma")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .filter((q) => q.gte(q.field("created_at"), args.since))
      .collect();
    return designs.length;
  },
});

// Get or create a unique figma_export_id for a design
// This ensures each design has its own cache key for Figma exports
export const getOrCreateFigmaExportId = mutation({
  args: {
    artifact_id: v.string(),
    project_id: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the design by artifact_id and project_id
    const design = await ctx.db
      .query("designs")
      .withIndex("by_artifact_id", (q) => q.eq("artifact_id", args.artifact_id))
      .filter((q) => q.eq(q.field("project_id"), args.project_id))
      .first();

    if (!design) {
      throw new Error("Design not found");
    }

    // If the design already has a figma_export_id, return it
    if (design.figma_export_id) {
      return { figma_export_id: design.figma_export_id, isNew: false };
    }

    // Generate a new UUID for this design
    const figma_export_id = crypto.randomUUID();

    // Update the design with the new figma_export_id
    await ctx.db.patch(design._id, {
      figma_export_id,
      updated_at: Date.now(),
    });

    return { figma_export_id, isNew: true };
  },
});

// Get figma_export_id for a design (query, doesn't create if missing)
export const getFigmaExportId = query({
  args: {
    artifact_id: v.string(),
    project_id: v.string(),
  },
  handler: async (ctx, args) => {
    const design = await ctx.db
      .query("designs")
      .withIndex("by_artifact_id", (q) => q.eq("artifact_id", args.artifact_id))
      .filter((q) => q.eq(q.field("project_id"), args.project_id))
      .first();

    if (!design) {
      return null;
    }

    return design.figma_export_id || null;
  },
});
