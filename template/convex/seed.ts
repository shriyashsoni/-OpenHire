import { mutation } from "./_generated/server";

export const seedJobs = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Delete all existing jobs to start completely fresh with the individual forms
    const allJobs = await ctx.db.query("jobs").collect();
    for (const job of allJobs) {
      await ctx.db.delete(job._id);
    }

    const hrDescription = `<h2>About OpenHire</h2>
<p>OpenHire is a fast-growing education and career guidance platform helping students with admissions, career planning, mentorship, internships, and educational opportunities. We are building a team of passionate individuals who want to create a meaningful impact in the education sector.</p>

<h2>About the Role</h2>
<p>We are looking for an organized and people-focused HR Manager / HR Executive to manage recruitment, onboarding, team coordination, employee engagement, and HR operations.</p>
<p>You will work directly with the Founder and leadership team to help build a high-performing team and establish professional HR processes across the organization.</p>

<h2>Key Responsibilities</h2>
<ul>
<li>Manage end-to-end recruitment processes.</li>
<li>Post job openings across hiring platforms.</li>
<li>Screen resumes and shortlist candidates.</li>
<li>Conduct initial interviews and candidate evaluations.</li>
<li>Coordinate onboarding and offboarding processes.</li>
<li>Maintain employee records and documentation.</li>
<li>Assist with performance reviews and team management.</li>
<li>Support employee engagement initiatives.</li>
<li>Ensure smooth communication between departments.</li>
<li>Build and improve HR policies and processes.</li>
</ul>

<h2>Requirements</h2>
<ul>
<li>Strong communication and interpersonal skills.</li>
<li>Good organizational and management abilities.</li>
<li>Experience in recruitment or HR operations is preferred.</li>
<li>Ability to work independently in a startup environment.</li>
<li>Familiarity with ATS platforms and hiring tools is a plus.</li>
<li>Passion for building and managing teams.</li>
</ul>

<h2>Preferred Skills</h2>
<ul>
<li>Recruitment & Talent Acquisition</li>
<li>Interviewing</li>
<li>Employee Relations</li>
<li>HR Operations</li>
<li>Communication</li>
<li>Leadership</li>
<li>Google Workspace</li>
<li>ATS Platforms</li>
</ul>

<h2>Compensation</h2>
<p>Compensation depends on experience, skills, availability, and contribution.</p>
<ul>
<li>Internship: ₹3,000 – ₹8,000/month</li>
<li>Part-Time: ₹8,000 – ₹20,000/month</li>
<li>Full-Time: ₹20,000 – ₹50,000+/month</li>
</ul>
<p>Additional performance incentives may be provided.</p>

<h2>Benefits</h2>
<ul>
<li>Leadership Experience</li>
<li>Startup Exposure</li>
<li>Recommendation Letter</li>
<li>Certificate of Contribution</li>
<li>Direct Founder Mentorship</li>
<li>Networking Opportunities</li>
<li>Fast Career Growth</li>
</ul>

<h2>Hiring Process</h2>
<p>Application Review → HR Interview → Founder Discussion → Final Selection → Offer Letter</p>`;

    const commonTopQs = [
      { id: "c1", type: "short_answer", label: "Full Name", required: true },
      { id: "c2", type: "email", label: "Email Address", required: true },
      { id: "c3", type: "phone", label: "Phone Number", required: true },
      { id: "c4", type: "phone", label: "WhatsApp Number", required: true },
      { id: "c5", type: "link", label: "LinkedIn Profile", required: true },
      { id: "c6", type: "short_answer", label: "Current College/University/Organization", required: true },
      { id: "c7", type: "short_answer", label: "Degree / Qualification", required: true },
      { id: "c8", type: "short_answer", label: "Expected Graduation Year", required: true },
    ];

    const commonBottomQs = [
      { id: "b1", type: "dropdown", label: "Can You Commit At Least 10 Hours Per Week?", required: true, options: ["Yes", "No"] },
      { id: "b2", type: "dropdown", label: "Available Role Type", required: true, options: ["Internship", "Part-Time", "Full-Time"] },
      { id: "b3", type: "file_upload", label: "Resume/CV (PDF)", required: true },
      { id: "b4", type: "link", label: "LinkedIn Profile URL", required: true },
      { id: "b5", type: "checkbox", label: "I confirm that the information provided is accurate.", required: true }
    ];

    const jobs = [
      {
        title: "HR Manager / HR Executive",
        department: "Human Resources (HR)",
        location: "Remote (India)",
        type: "FULL-TIME",
        description: hrDescription,
        customQuestions: [
          ...commonTopQs,
          { id: "hr1", type: "short_answer", label: "Primary Skills (Recruitment, HR Operations, Talent Acquisition, etc.)", required: true },
          { id: "hr2", type: "dropdown", label: "Years of Experience", required: true, options: ["Fresher", "0–1 Years", "1–3 Years", "3+ Years"] },
          { id: "hr3", type: "dropdown", label: "Have You Conducted Hiring Before?", required: true, options: ["Yes", "No"] },
          { id: "hr4", type: "short_answer", label: "Approximately How Many Candidates Have You Interviewed?", required: true },
          { id: "hr5", type: "dropdown", label: "Have You Used Any ATS Platform Before?", required: true, options: ["Yes", "No"] },
          { id: "hr6", type: "short_answer", label: "If Yes, Mention Platform Name:", required: false },
          { id: "hr7", type: "dropdown", label: "Have You Managed Any Team Before?", required: true, options: ["Yes", "No"] },
          { id: "hr8", type: "long_answer", label: "Describe Your Leadership or Management Experience", required: true },
          { id: "hr9", type: "long_answer", label: "Why Do You Want To Join OpenHire As HR Manager?", required: true },
          ...commonBottomQs
        ]
      },
      {
        title: "Career Counsellor",
        department: "Counseling",
        location: "Remote (India)",
        type: "FULL-TIME",
        description: hrDescription.replace(/HR Manager \/ HR Executive/g, "Career Counsellor").replace(/HR processes/g, "counseling processes").replace(/Recruitment/g, "Counseling").replace(/Human Resources/g, "Counseling"),
        customQuestions: [
          ...commonTopQs,
          { id: "cc1", type: "dropdown", label: "Years of Experience", required: true, options: ["Fresher", "0–1 Years", "1–3 Years", "3+ Years"] },
          { id: "cc2", type: "dropdown", label: "Have you guided students before?", required: true, options: ["Yes", "No"] },
          { id: "cc3", type: "short_answer", label: "Which exams are you familiar with? (JEE, NEET, MHT-CET, COMEDK, CUET, etc.)", required: true },
          { id: "cc4", type: "long_answer", label: "Why Do You Want To Join OpenHire As Career Counsellor?", required: true },
          ...commonBottomQs
        ]
      },
      {
        title: "Mentor (JEE, MHT-CET, College Admissions, Coding, etc.)",
        department: "Counseling",
        location: "Remote (India)",
        type: "PART-TIME",
        description: hrDescription.replace(/HR Manager \/ HR Executive/g, "Mentor").replace(/HR processes/g, "mentoring processes").replace(/Recruitment/g, "Mentoring").replace(/Human Resources/g, "Mentoring"),
        customQuestions: [
          ...commonTopQs,
          { id: "m1", type: "dropdown", label: "Years of Experience", required: true, options: ["Fresher", "0–1 Years", "1–3 Years", "3+ Years"] },
          { id: "m2", type: "short_answer", label: "What subjects/skills can you mentor in?", required: true },
          { id: "m3", type: "long_answer", label: "Why Do You Want To Join OpenHire As Mentor?", required: true },
          ...commonBottomQs
        ]
      },
      {
        title: "Sales & Partnerships Executive",
        department: "Marketing",
        location: "Remote (India)",
        type: "FULL-TIME",
        description: hrDescription.replace(/HR Manager \/ HR Executive/g, "Sales & Partnerships Executive").replace(/HR processes/g, "sales strategies").replace(/Recruitment/g, "Sales").replace(/Human Resources/g, "Sales & Partnerships"),
        customQuestions: [
          ...commonTopQs,
          { id: "sp1", type: "dropdown", label: "Years of Experience", required: true, options: ["Fresher", "0–1 Years", "1–3 Years", "3+ Years"] },
          { id: "sp2", type: "dropdown", label: "Have you done sales, outreach, or partnerships before?", required: true, options: ["Yes", "No"] },
          { id: "sp3", type: "long_answer", label: "Describe Your Sales Experience", required: true },
          { id: "sp4", type: "long_answer", label: "Why Do You Want To Join OpenHire As Sales Executive?", required: true },
          ...commonBottomQs
        ]
      },
      {
        title: "Social Media Manager",
        department: "Marketing",
        location: "Remote (India)",
        type: "FULL-TIME",
        description: hrDescription.replace(/HR Manager \/ HR Executive/g, "Social Media Manager").replace(/HR processes/g, "social media campaigns").replace(/Recruitment/g, "Social Media").replace(/Human Resources/g, "Marketing"),
        customQuestions: [
          ...commonTopQs,
          { id: "smm1", type: "dropdown", label: "Years of Experience", required: true, options: ["Fresher", "0–1 Years", "1–3 Years", "3+ Years"] },
          { id: "smm2", type: "link", label: "Share your best social media page or campaign.", required: true },
          { id: "smm3", type: "long_answer", label: "Why Do You Want To Join OpenHire As Social Media Manager?", required: true },
          ...commonBottomQs
        ]
      },
      {
        title: "WhatsApp Community Manager",
        department: "Marketing",
        location: "Remote (India)",
        type: "PART-TIME",
        description: hrDescription.replace(/HR Manager \/ HR Executive/g, "WhatsApp Community Manager").replace(/HR processes/g, "community guidelines").replace(/Recruitment/g, "Community Management").replace(/Human Resources/g, "Community"),
        customQuestions: [
          ...commonTopQs,
          { id: "wcm1", type: "dropdown", label: "Years of Experience", required: true, options: ["Fresher", "0–1 Years", "1–3 Years", "3+ Years"] },
          { id: "wcm2", type: "dropdown", label: "Have you managed groups or communities before?", required: true, options: ["Yes", "No"] },
          { id: "wcm3", type: "long_answer", label: "Why Do You Want To Join OpenHire As Community Manager?", required: true },
          ...commonBottomQs
        ]
      },
      {
        title: "Call Agent / Student Support Executive",
        department: "Counseling",
        location: "Remote (India)",
        type: "FULL-TIME",
        description: hrDescription.replace(/HR Manager \/ HR Executive/g, "Call Agent / Student Support Executive").replace(/HR processes/g, "support processes").replace(/Recruitment/g, "Support").replace(/Human Resources/g, "Support"),
        customQuestions: [
          ...commonTopQs,
          { id: "ca1", type: "dropdown", label: "Years of Experience", required: true, options: ["Fresher", "0–1 Years", "1–3 Years", "3+ Years"] },
          { id: "ca2", type: "dropdown", label: "Are you comfortable speaking with students and parents over calls?", required: true, options: ["Yes", "No"] },
          { id: "ca3", type: "long_answer", label: "Why Do You Want To Join OpenHire As Call Agent?", required: true },
          ...commonBottomQs
        ]
      },
      {
        title: "Chartered Accountant (CA)",
        department: "Finance",
        location: "Remote (India)",
        type: "FULL-TIME",
        description: hrDescription.replace(/HR Manager \/ HR Executive/g, "Chartered Accountant (CA)").replace(/HR processes/g, "financial processes").replace(/Recruitment/g, "Accounting").replace(/Human Resources/g, "Finance"),
        customQuestions: [
          ...commonTopQs,
          { id: "ca1", type: "dropdown", label: "Years of Experience", required: true, options: ["Fresher", "0–1 Years", "1–3 Years", "3+ Years"] },
          { id: "ca2", type: "short_answer", label: "Membership Number (Optional)", required: false },
          { id: "ca3", type: "short_answer", label: "Experience in GST, Compliance, Accounting, or Startup Finance?", required: true },
          { id: "ca4", type: "long_answer", label: "Why Do You Want To Join OpenHire As CA?", required: true },
          ...commonBottomQs
        ]
      },
      {
        title: "Business Development Executive",
        department: "Marketing",
        location: "Remote (India)",
        type: "FULL-TIME",
        description: hrDescription.replace(/HR Manager \/ HR Executive/g, "Business Development Executive").replace(/HR processes/g, "business strategies").replace(/Recruitment/g, "Business Development").replace(/Human Resources/g, "Business Development"),
        customQuestions: [
          ...commonTopQs,
          { id: "bde1", type: "dropdown", label: "Years of Experience", required: true, options: ["Fresher", "0–1 Years", "1–3 Years", "3+ Years"] },
          { id: "bde2", type: "long_answer", label: "Briefly Describe Your BD Experience", required: true },
          { id: "bde3", type: "long_answer", label: "Why Do You Want To Join OpenHire As BDE?", required: true },
          ...commonBottomQs
        ]
      },
      {
        title: "Campus Ambassador Coordinator",
        department: "Marketing",
        location: "Remote (India)",
        type: "PART-TIME",
        description: hrDescription.replace(/HR Manager \/ HR Executive/g, "Campus Ambassador Coordinator").replace(/HR processes/g, "ambassador programs").replace(/Recruitment/g, "Program Management").replace(/Human Resources/g, "Marketing"),
        customQuestions: [
          ...commonTopQs,
          { id: "cac1", type: "dropdown", label: "Years of Experience", required: true, options: ["Fresher", "0–1 Years", "1–3 Years", "3+ Years"] },
          { id: "cac2", type: "long_answer", label: "Briefly Describe Your Experience with Student Networks", required: true },
          { id: "cac3", type: "long_answer", label: "Why Do You Want To Join OpenHire As Ambassador Coordinator?", required: true },
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
