import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all messages for a specific project
export const getMessages = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("messages")
      .withIndex("by_project", (q) => q.eq("project_id", args.id))
      .collect();
  },
});

// Get all projects
export const getProjects = query({
  handler: async (ctx) => {
    return ctx.db.query("projects").collect();
  },
});

// Get all projects for a specific user
export const getUserProjects = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .order("desc")
      .collect();
  },
});

// Get all designs for a specific project
export const getDesignsByProject = query({
  args: { project_id: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("designs")
      .withIndex("by_project", (q) => q.eq("project_id", args.project_id))
      .collect();
  },
});

// Get a design by its artifact_id
export const getDesignByArtifactId = query({
  args: { artifact_id: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("designs")
      .withIndex("by_artifact_id", (q) => q.eq("artifact_id", args.artifact_id))
      .first();
  },
});

// Get a single project by project_id
export const getProject = query({
  args: { project_id: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("project_id"), args.project_id))
      .first();
  },
});
