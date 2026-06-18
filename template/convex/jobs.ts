import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

export const getJobs = query({
  args: { includeInactive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.includeInactive) {
      return await ctx.db.query("jobs").order("desc").collect();
    }
    return await ctx.db.query("jobs").filter(q => q.eq(q.field("isActive"), true)).collect();
  },
});

export const getJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const getJobBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("jobs").withIndex("by_slug", q => q.eq("slug", args.slug)).first();
  },
});

export const createJob = mutation({
  args: {
    title: v.string(),
    department: v.string(),
    location: v.string(),
    type: v.string(),
    description: v.string(),
    customQuestions: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const slug = args.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    return await ctx.db.insert("jobs", {
      ...args,
      slug,
      isActive: true,
    });
  },
});

export const updateJobStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, { isActive: args.isActive });
  },
});

export const updateJob = mutation({
  args: {
    jobId: v.id("jobs"),
    title: v.string(),
    department: v.string(),
    location: v.string(),
    type: v.string(),
    description: v.string(),
    customQuestions: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const { jobId, ...rest } = args;
    await ctx.db.patch(jobId, rest);
  },
});

export const deleteJob = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.jobId);
  },
});

export const generateJobDescription = action({
  args: { 
    prompt: v.string(),
    templateName: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Hardcoded for MVP since WriteEnvironmentVariables is locked on the deploy key
    const GROQ_API_KEY = process.env.GROQ_API_KEY || "YOUR_GROQ_API_KEY_HERE";
    
    const templateInstruction = args.templateName 
      ? `\nCRITICAL: The user wants to build a "${args.templateName}" job. You MUST architect the exact industry-standard application form questions usually asked by top-tier tech companies for a ${args.templateName} role.` 
      : "";

    const systemPrompt = `You are an expert ATS Job Architecture Assistant.
The user will give you a brief description of a role and potentially specific requirements.
${templateInstruction}

CRITICAL INSTRUCTIONS:
1. You MUST generate 4-8 highly relevant custom application questions.
2. You MUST use a variety of input types depending on the question.
3. Allowed types: short_answer, long_answer, multiple_choice, checkboxes, dropdown, link, file_upload, date.
4. If it is a choice-based type (multiple_choice, checkboxes, dropdown), you MUST provide an "options" array.

You MUST return ONLY a valid JSON object with exactly these keys. Do NOT use markdown code blocks or add any comments:
{
  "title": "Professional Job Title",
  "department": "Most likely department",
  "location": "Inferred location or 'Remote'",
  "description": "A highly comprehensive HTML job description. Use <h2> for sections like 'About the role', 'Responsibilities:', and 'Requirements:'. Use <ul> and <li> for lists.",
  "customQuestions": [
    { "id": "q1", "type": "file_upload", "label": "Please upload a portfolio or writing sample (PDF)", "required": false },
    { "id": "q2", "type": "dropdown", "label": "Years of experience with React?", "required": true, "options": ["0-1 years", "2-4 years", "5+ years"] },
    { "id": "q3", "type": "checkboxes", "label": "Which of these tools are you proficient in?", "required": true, "options": ["Figma", "Adobe XD", "Sketch"] },
    { "id": "q4", "type": "link", "label": "LinkedIn Profile URL", "required": true }
  ]
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192", // Use the massive 70B model for perfect JSON compliance
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: args.prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }
});
