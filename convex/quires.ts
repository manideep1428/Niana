import { query } from "./_generated/server";
// Force rebuild for file rename: quires.ts -> queries.ts
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
    const memberships = await ctx.db
      .query("project_members")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .collect();

    const projects = await Promise.all(
      memberships.map(async (m) => {
        return await ctx.db
          .query("projects")
          .filter((q) => q.eq(q.field("project_id"), m.project_id))
          .first();
      })
    );

    return projects
      .filter((p) => p !== null)
      .sort((a, b) => {
        // Sort by Pinned first (true comes first)
        if (a!.is_pinned && !b!.is_pinned) return -1;
        if (!a!.is_pinned && b!.is_pinned) return 1;

        // Then sort by Created Date (newest first)
        return b!.created_at > a!.created_at ? 1 : -1;
      });
  },
});

// Get all members of a specific project
export const getProjectMembers = query({
  args: { project_id: v.string() },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("project_members")
      .withIndex("by_project", (q) => q.eq("project_id", args.project_id))
      .collect();

    const membersWithUserInfo = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_user_id", (q) => q.eq("user_id", member.user_id))
          .first();

        return {
          ...member,
          userInfo: user
            ? {
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              profile_picture_url: user.profile_picture_url,
            }
            : null,
        };
      })
    );

    return membersWithUserInfo;
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

// Get user's active subscription
export const getUserSubscription = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
  },
});

// Get user's subscription history
export const getUserSubscriptionHistory = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .order("desc")
      .collect();
  },
});

// Get user's payment history
export const getUserPayments = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .order("desc")
      .collect();
  },
});

// Get all public projects for community feed (sorted by likes)
export const getPublicProjects = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 12;
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_public", (q) => q.eq("is_public", true))
      .collect();

    // Sort by likes (descending) and take limit
    const sortedProjects = projects
      .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
      .slice(0, limit);

    // Fetch user info for each project
    const projectsWithUsers = await Promise.all(
      sortedProjects.map(async (project) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_user_id", (q) => q.eq("user_id", project.user_id))
          .first();

        return {
          ...project,
          user: user
            ? {
              first_name: user.first_name,
              last_name: user.last_name,
              profile_picture_url: user.profile_picture_url,
            }
            : null,
        };
      })
    );

    return projectsWithUsers;
  },
});

// Check if user has liked a project
export const checkUserLikedProject = query({
  args: {
    user_id: v.string(),
    project_id: v.string(),
  },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("project_likes")
      .withIndex("by_user_project", (q) =>
        q.eq("user_id", args.user_id).eq("project_id", args.project_id)
      )
      .first();
    return !!like;
  },
});

// Get project with user info for community display
export const getProjectWithUser = query({
  args: { project_id: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("project_id"), args.project_id))
      .first();

    if (!project) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", project.user_id))
      .first();

    return {
      ...project,
      user: user
        ? {
          first_name: user.first_name,
          last_name: user.last_name,
          profile_picture_url: user.profile_picture_url,
        }
        : null,
    };
  },
});
