import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getFigmaData = query({
  args: { artifact_id: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("figma")
      .withIndex("by_artifact_id", (q) => q.eq("artifact_id", args.artifact_id))
      .first();
    return data;
  },
});

export const saveFigmaData = mutation({
  args: {
    user_id: v.optional(v.string()),
    artifact_id: v.string(),
    figmaid: v.optional(v.string()),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("figma")
      .withIndex("by_artifact_id", (q) => q.eq("artifact_id", args.artifact_id))
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
      artifact_id: args.artifact_id,
      content: args.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return id;
  },
});

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
