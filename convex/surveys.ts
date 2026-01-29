import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSurveyStatus = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return true; // treat as "submitted" so we don't annoy unauthenticated users
    }

    const survey = await ctx.db
      .query("surveys")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId!))
      .first();

    return !!survey;
  },
});

export const submitSurvey = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    answer: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("surveys")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .first();

    if (existing) {
      return;
    }

    await ctx.db.insert("surveys", {
      user_id: args.userId,
      email: args.email,
      answer: args.answer,
      details: args.details,
      created_at: new Date().toISOString(),
    });
  },
});
