import { mutation, action, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { Resend } from "resend";
// PDF Parsing removed to fix deployment on serverless. We will just store the resume for now.

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getApplications = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("applications").order("desc").collect();
  },
});

export const getApplicationsByJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.query("applications").withIndex("by_job", q => q.eq("jobId", args.jobId)).order("desc").collect();
  },
});

export const submitApplication = mutation({
  args: {
    jobId: v.id("jobs"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    resumeStorageId: v.optional(v.id("_storage")),
    coverLetter: v.optional(v.string()),
    parsedData: v.optional(v.any()),
    customAnswers: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const applicationId = await ctx.db.insert("applications", {
      ...args,
      status: "new",
      appliedAt: Date.now(),
    });
    return applicationId;
  },
});

export const updateParsedData = mutation({
  args: {
    applicationId: v.id("applications"),
    parsedData: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.applicationId, { parsedData: args.parsedData });
  },
});

export const processApplication = action({
  args: {
    jobId: v.id("jobs"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    resumeStorageId: v.optional(v.id("_storage")),
    coverLetter: v.optional(v.string()),
    customAnswers: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // We will just submit the application directly and send the email
    const applicationId = await ctx.runMutation(api.applications.submitApplication, {
      ...args,
      parsedData: { text: "Resume uploaded successfully. Manual review required." },
    });

    // 3. Send email via Resend
    const apiKey = (process.env.RESEND_API_KEY || "").trim();
    if (apiKey) {
      const resend = new Resend(apiKey);
      
      let answersHtml = "";
      if (args.customAnswers) {
        answersHtml = "<div style='margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px;'><h3>Application Summary</h3>";
        for (const [q, a] of Object.entries(args.customAnswers)) {
            // Check if it's a file upload mock
            const displayAnswer = typeof a === 'string' && a.startsWith('FILE_UPLOAD') ? 'File Uploaded' : a;
            answersHtml += `<p style='margin-bottom: 10px;'><strong>${q}:</strong><br/>${displayAnswer}</p>`;
        }
        answersHtml += "</div>";
      }

      // Send to applicant if email is valid
      if (args.email && args.email.includes("@")) {
        try {
          const applicantEmail = await resend.emails.send({
            from: "OpenHire Careers <recruitment@OpenHire.in>",
            to: args.email,
            subject: `Application Received: OpenHire`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #1a73e8;">
                  <h1 style="color: #1a73e8; margin: 0;">OpenHire</h1>
                </div>
                <div style="padding: 30px 20px;">
                  <h2 style="margin-top: 0;">Hi ${args.name || 'Applicant'},</h2>
                  <p>Thank you for taking the time to apply for a position with OpenHire!</p>
                  <p>We have successfully received your application. Below is a copy of what you submitted:</p>
                  ${answersHtml}
                  <div style="background-color: #e8f0fe; border-left: 4px solid #1a73e8; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>What's Next?</strong><br>
                    If your profile is shortlisted for the next round, our team will contact you soon with further details.</p>
                  </div>
                  <p>We appreciate your interest in joining our mission.</p>
                  <br>
                  <p>Best Regards,<br><strong>The OpenHire Talent Team</strong></p>
                </div>
              </div>
            `,
          });
          
          if (applicantEmail.error) {
            console.error("Resend API Error (Applicant):", applicantEmail.error);
          }
        } catch (emailErr) {
          console.error("Applicant Email send threw an exception:", emailErr);
        }
      }

      // Send notification to Admin
      try {
        const adminEmail = await resend.emails.send({
          from: "OpenHire Careers <recruitment@OpenHire.in>",
          to: "recruitment@OpenHire.in", // Admin email
          subject: `New Application Submitted: ${args.name || 'Applicant'}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <h2>New Application Received</h2>
              <p>A new application has been submitted on the careers portal.</p>
              <p><strong>Name:</strong> ${args.name || 'N/A'}</p>
              <p><strong>Email:</strong> ${args.email || 'N/A'}</p>
              <p><strong>Phone:</strong> ${args.phone || 'N/A'}</p>
              ${answersHtml}
              <p><br/>Log in to the Admin Dashboard to review the full details and resume.</p>
            </div>
          `,
        });
        
        if (adminEmail.error) {
          console.error("Resend API Error (Admin):", adminEmail.error);
        }
      } catch (adminEmailErr) {
        console.error("Admin Email send threw an exception:", adminEmailErr);
      }
    } else {
      console.warn("RESEND_API_KEY not set. Skipping emails.");
    }

    return applicationId;
  },
});

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.applicationId, { status: args.status });
  },
});

export const deleteApplication = mutation({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.applicationId);
  },
});

export const advanceApplicant = action({
  args: {
    applicationId: v.id("applications"),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Update status
    await ctx.runMutation(api.applications.updateApplicationStatus, {
      applicationId: args.applicationId,
      status: "interview",
    });

    // 2. Send Email
    const apiKey = (process.env.RESEND_API_KEY || "").trim();
    if (apiKey) {
      const resend = new Resend(apiKey);
      try {
        const interviewEmail = await resend.emails.send({
          from: "OpenHire Careers <recruitment@OpenHire.in>",
          to: args.email,
          subject: `Interview Invitation: OpenHire`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #34a853;">
                <h1 style="color: #34a853; margin: 0;">OpenHire</h1>
              </div>
              <div style="padding: 30px 20px;">
                <h2 style="margin-top: 0;">Hi ${args.name},</h2>
                <p>Great news! Our team was very impressed by your background and experience.</p>
                <p>We would love to invite you to the next round of interviews to discuss how you could contribute to OpenHire.</p>
                <div style="background-color: #e6f4ea; border-left: 4px solid #34a853; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Next Steps:</strong><br>
                  A member of our recruitment team will be reaching out to you shortly with scheduling options for a video call.</p>
                </div>
                <p>We are looking forward to speaking with you!</p>
                <br>
                <p>Best Regards,<br><strong>The OpenHire Talent Team</strong></p>
              </div>
            </div>
          `,
        });
        if (interviewEmail.error) {
            console.error("Resend API Error (Interview):", interviewEmail.error);
        }
      } catch (emailErr) {
        console.error("Email send threw an exception:", emailErr);
      }
    } else {
      console.warn("RESEND_API_KEY not set. Skipping advance applicant email.");
    }
  },
});

export const autoFillFromResume = action({
  args: {
    jobId: v.id("jobs"),
    resumeText: v.string()
  },
  handler: async (ctx, args) => {
    // 1. Get the custom questions for this job to know what fields to extract
    const job = await ctx.runQuery(api.jobs.getJob, { jobId: args.jobId });
    if (!job || !job.customQuestions) return {};

    const extractLabels = job.customQuestions
      .filter(q => q.type !== 'divider' && q.type !== 'heading_1' && q.type !== 'text' && q.type !== 'new_page')
      .map(q => q.label);

    if (extractLabels.length === 0) return {};

    // 2. Ask Groq AI to extract the data
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.warn("GROQ_API_KEY missing, skipping AI autofill");
      return {};
    }

    const systemPrompt = `You are an expert HR data extraction AI.
The user will provide the text of a resume.
You need to extract information to fill out a job application form.
The form has the following specific field labels:
${JSON.stringify(extractLabels)}

INSTRUCTIONS:
1. Extract the best matching information from the resume for each field label.
2. If you cannot find information for a field, omit it or set it to an empty string.
3. OUTPUT ONLY A RAW JSON OBJECT. No markdown formatting, no \`\`\`json, no explanations.
Example output format:
{"First Name": "John", "Email": "john@example.com", "Years of Experience": "5"}
`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: args.resumeText }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "{}";
      
      // Parse the JSON mapping
      let mapping = {};
      try {
        mapping = JSON.parse(content);
      } catch (parseError) {
        // Fallback cleanup if model returned markdown
        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        mapping = JSON.parse(cleaned);
      }
      
      return mapping;
    } catch (err) {
      console.error("Groq extraction failed", err);
      return {};
    }
  }
});
