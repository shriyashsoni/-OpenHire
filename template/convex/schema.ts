import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  jobs: defineTable({
    title: v.string(),
    department: v.string(),
    location: v.string(),
    type: v.string(), // Full-time, Part-time, Internship
    description: v.string(),
    isActive: v.boolean(),
    customQuestions: v.optional(v.array(v.any())),
    slug: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  applications: defineTable({
    jobId: v.id("jobs"),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    resumeStorageId: v.optional(v.id("_storage")),
    coverLetter: v.optional(v.string()),
    parsedData: v.optional(v.any()), // Store the output of the resume scrubber
    customAnswers: v.optional(v.any()), // Stores answers to custom job questions
    status: v.optional(v.string()), // "new", "interview", "rejected"
    appliedAt: v.number(),
  }).index("by_job", ["jobId"]),

  analytics: defineTable({
    type: v.string(), // "visit", "job_view"
    jobId: v.optional(v.id("jobs")),
    timestamp: v.number(),
  }),

  admins: defineTable({
    username: v.string(), // We will store the email in this field to avoid dropping the index
    password: v.string(),
  }).index("by_username", ["username"]),
});
