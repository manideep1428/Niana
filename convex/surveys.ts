import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSurveyStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return true; // treat as "submitted" so we don't annoy unauthenticated users or handle auth check in UI
    }
    const userId = identity.subject;
    const survey = await ctx.db
      .query("surveys")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .first();

    return !!survey;
  },
});

export const submitSurvey = mutation({
  args: {
    answer: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }
    const userId = identity.subject;
    const email = identity.email || "";

    const existing = await ctx.db
      .query("surveys")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .first();

    if (existing) {
      return;
    }

    await ctx.db.insert("surveys", {
      user_id: userId,
      email: email,
      answer: args.answer,
      details: args.details,
      created_at: new Date().toISOString(),
    });
  },
});
