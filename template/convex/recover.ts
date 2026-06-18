import { mutation } from "./_generated/server";

export const recoverExecs = mutation({
  args: {},
  handler: async (ctx) => {
    const commonTopQs = [
      { id: "c1", type: "short_answer", label: "Full Name", required: true },
      { id: "c2", type: "email", label: "Email Address", required: true },
      { id: "c3", type: "phone", label: "Phone Number", required: true },
      { id: "c4", type: "phone", label: "WhatsApp Number", required: true },
      { id: "c5", type: "link", label: "LinkedIn Profile", required: true },
      { id: "c6", type: "link", label: "Portfolio/Website (Optional)", required: false },
    ];

    const commonBottomQs = [
      { id: "b1", type: "dropdown", label: "Available Role Type", required: true, options: ["Part-Time", "Full-Time", "Equity Only / Co-Founder"] },
      { id: "b2", type: "file_upload", label: "Resume/CV (PDF)", required: true },
      { id: "b3", type: "checkbox", label: "I confirm that the information provided is accurate.", required: true }
    ];

    const cmoDescription = `<h2>About OpenHire</h2>
<p>OpenHire is a fast-growing education and career guidance platform helping students with admissions, career planning, mentorship, internships, and educational opportunities.</p>
<h2>About the Role</h2>
<p>We are seeking a visionary Chief Marketing Officer (CMO) to lead our marketing efforts, drive student acquisition, and build our brand across India. As part of the core founding team, you will shape our entire go-to-market strategy.</p>
<h2>Key Responsibilities</h2>
<ul>
<li>Design and execute comprehensive marketing strategies.</li>
<li>Lead digital marketing, SEO, and social media campaigns.</li>
<li>Build and manage a high-performing marketing team.</li>
<li>Oversee brand positioning, partnerships, and PR.</li>
</ul>
<h2>Requirements</h2>
<ul>
<li>Proven experience as a CMO or senior marketing leader.</li>
<li>Strong understanding of the EdTech or student services market.</li>
<li>Excellent leadership, creativity, and analytical skills.</li>
</ul>`;

    const ctoDescription = `<h2>About OpenHire</h2>
<p>OpenHire is a fast-growing education and career guidance platform helping students with admissions, career planning, mentorship, internships, and educational opportunities.</p>
<h2>About the Role</h2>
<p>We are looking for an exceptional Chief Technology Officer (CTO) to lead our engineering team and build the technical foundation of our platform. You will be responsible for scaling our ATS and student portal infrastructure.</p>
<h2>Key Responsibilities</h2>
<ul>
<li>Lead the software development and engineering team.</li>
<li>Architect scalable, high-performance, and secure systems.</li>
<li>Define the technical vision and collaborate on the product roadmap.</li>
<li>Ensure best practices in coding, DevOps, and security.</li>
</ul>
<h2>Requirements</h2>
<ul>
<li>Proven experience as a CTO or Engineering Lead.</li>
<li>Expertise in modern web technologies (React, Node, Cloud Infrastructure).</li>
<li>Strong leadership and project management skills.</li>
</ul>`;

    const jobs = [
      {
        title: "Chief Marketing Officer (CMO)",
        department: "Executive",
        location: "Remote (India)",
        type: "FULL-TIME",
        description: cmoDescription,
        customQuestions: [
          ...commonTopQs,
          { id: "e1", type: "dropdown", label: "Years of Experience", required: true, options: ["3-5 Years", "5-8 Years", "8+ Years"] },
          { id: "cmo1", type: "long_answer", label: "Briefly Describe Your Marketing Leadership Experience", required: true },
          { id: "cmo2", type: "long_answer", label: "Why Do You Want To Join OpenHire As CMO?", required: true },
          ...commonBottomQs
        ]
      },
      {
        title: "Chief Technology Officer (CTO)",
        department: "Executive",
        location: "Remote (India)",
        type: "FULL-TIME",
        description: ctoDescription,
        customQuestions: [
          ...commonTopQs,
          { id: "e1", type: "dropdown", label: "Years of Experience", required: true, options: ["3-5 Years", "5-8 Years", "8+ Years"] },
          { id: "cto1", type: "long_answer", label: "Briefly Describe Your Engineering Leadership Experience", required: true },
          { id: "cto2", type: "long_answer", label: "Why Do You Want To Join OpenHire As CTO?", required: true },
          ...commonBottomQs
        ]
      }
    ];

    for (const job of jobs) {
      const slug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
      await ctx.db.insert("jobs", {
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        description: job.description,
        isActive: true,
        slug,
        customQuestions: job.customQuestions,
      });
    }
  }
});
