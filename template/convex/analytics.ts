import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const trackVisit = mutation({
  args: {
    type: v.string(), // e.g. "homepage_visit", "job_view"
    jobId: v.optional(v.id("jobs")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("analytics", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("analytics").order("desc").take(1000);
    const visits = records.filter(r => r.type === "homepage_visit").length;
    const jobViews = records.filter(r => r.type === "job_view").length;
    return { visits, jobViews, totalEvents: records.length };
  },
});

export const getJobAnalytics = query({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db.query("analytics").order("desc").collect();
    const jobViews = records.filter(r => r.type === "job_view" && r.jobId === args.jobId).length;
    const applications = await ctx.db.query("applications").withIndex("by_job", (q) => q.eq("jobId", args.jobId)).collect();
    const totalApplications = applications.length;
    const applicationClicks = records.filter(r => r.type === "apply_click" && r.jobId === args.jobId).length;
    return { views: jobViews, applications: totalApplications, applyClicks: applicationClicks };
  },
});
