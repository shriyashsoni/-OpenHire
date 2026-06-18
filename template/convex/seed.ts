import { mutation } from "./_generated/server";

export const seedJobs = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Delete all existing jobs to start completely fresh
    const allJobs = await ctx.db.query("jobs").collect();
    for (const job of allJobs) {
      await ctx.db.delete(job._id);
    }
    
    // No jobs are seeded by default. Users will add their own jobs via the admin panel.
  }
});
