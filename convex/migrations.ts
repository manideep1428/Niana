import { mutation } from "./_generated/server";

export const migrateDesignsToMobile = mutation({
  args: {},
  handler: async (ctx) => {
    const designs = await ctx.db.query("designs").collect();
    let count = 0;

    /*
    for (const design of designs) {
      if (!design.type) {
        await ctx.db.patch(design._id, {
          type: "mobile",
        });
        count++;
      }
    }
    */

    return { success: true, migrated_count: count };
  },
});
