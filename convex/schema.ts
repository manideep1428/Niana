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
    description: v.optional(v.string()), // Short description for community display
    is_favorite: v.optional(v.boolean()), // For starring/favoriting projects
    is_public: v.optional(v.boolean()), // For community visibility (default: false = private)
    views: v.optional(v.number()), // View count for public projects
    likes: v.optional(v.number()), // Like count for public projects
    thumbnail: v.optional(v.string()), // Preview image URL
    created_at: v.string(),
  })
    .index("by_user", ["user_id"])
    .index("by_public", ["is_public"]),

  // Track which users liked which projects
  project_likes: defineTable({
    user_id: v.string(),
    project_id: v.string(),
    created_at: v.string(),
  })
    .index("by_user", ["user_id"])
    .index("by_project", ["project_id"])
    .index("by_user_project", ["user_id", "project_id"]),

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
    model: v.optional(v.string()), // Model used for generation (e.g., "pro")
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

  // Subscription plans for users
  subscriptions: defineTable({
    user_id: v.string(),
    plan: v.union(
      v.literal("free"),
      v.literal("base"),
      v.literal("standard"),
      v.literal("premium")
    ),
    tokens_total: v.number(), // Total tokens allocated
    tokens_used: v.number(), // Tokens consumed
    projects_limit: v.number(), // -1 for unlimited
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("cancelled")
    ),
    razorpay_payment_id: v.optional(v.string()), // Optional for free plans
    razorpay_order_id: v.optional(v.string()), // Optional for free plans
    razorpay_signature: v.optional(v.string()), // Optional for free plans
    amount: v.number(), // Amount in paise (0 for free)
    created_at: v.string(),
    expires_at: v.string(), // Subscription expiry date
  })
    .index("by_user", ["user_id"])
    .index("by_payment_id", ["razorpay_payment_id"]),

  // Payment attempts (for audit trail)
  payments: defineTable({
    user_id: v.string(),
    order_id: v.string(),
    plan: v.union(
      v.literal("free"),
      v.literal("base"),
      v.literal("standard"),
      v.literal("premium")
    ),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("created"),
      v.literal("paid"),
      v.literal("failed")
    ),
    razorpay_payment_id: v.optional(v.string()),
    razorpay_signature: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("by_user", ["user_id"])
    .index("by_order_id", ["order_id"]),

  figma: defineTable({
    user_id: v.string(),
    figma_id: v.optional(v.string()),
    artifact_id: v.string(),
    content: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
    // We can index by artifact_id to quickly look up if we have it
  })
    .index("by_user", ["user_id"])
    .index("by_artifact_id", ["artifact_id"]),
});
