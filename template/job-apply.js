import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

// Initialize Convex Client
const CONVEX_URL = (import.meta && import.meta.env && import.meta.env.VITE_CONVEX_URL) ? import.meta.env.VITE_CONVEX_URL : "https://exuberant-jackal-851.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('id');
    let slug = urlParams.get('slug');

    // Extract slug from URL path if not in query params (e.g., /marketing-manager)
    if (!slug && !jobId && window.location.pathname.length > 1) {
        const pathParts = window.location.pathname.split('/').filter(p => p.length > 0);
        const potentialSlug = pathParts[pathParts.length - 1];
        // Ignore standard files
        if (!potentialSlug.includes('.html') && potentialSlug !== 'admin' && potentialSlug !== 'job') {
            slug = potentialSlug;
        }
    }

    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Hamburger menu toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    const titleEl = document.getElementById('job-title');
    const locationEl = document.getElementById('job-location');
    const descEl = document.getElementById('job-description');

    let jobData = null;
    let currentJobId = null;

    if (!jobId && !slug) {
        // Fallback for empty ID
        titleEl.textContent = "Expert Counsellor";
        locationEl.textContent = "Remote / India | Counseling";
        descEl.innerHTML = `<p>OpenHire's mission is to democratize expert career guidance. We want our technology to be safe, beneficial, and highly effective for our users.</p>`;
    } else {
        try {
            if (slug) {
                jobData = await convex.query(api.jobs.getJobBySlug, { slug });
            } else if (jobId) {
                jobData = await convex.query(api.jobs.getJob, { jobId });
            }
            
            if (jobData) {
                currentJobId = jobData._id;
                titleEl.textContent = jobData.title;
                locationEl.textContent = `${jobData.location} | ${jobData.department}`;
                
                // Track job view
                try {
                    convex.mutation(api.analytics.trackVisit, { type: "job_view", jobId: currentJobId });
                } catch (e) {
                    console.error("Failed to track view", e);
                }
                
                let htmlDesc = jobData.description;
                if (!htmlDesc.includes('<p>') && !htmlDesc.includes('<br>')) {
                    htmlDesc = htmlDesc.replace(/\n/g, '<br>');
                }
                descEl.innerHTML = htmlDesc;

                // Render custom questions if any
                const customContainer = document.getElementById('custom-questions-container');
                if (jobData.customQuestions && jobData.customQuestions.length > 0) {
                    jobData.customQuestions.forEach(q => {
                        const group = document.createElement('div');
                        group.className = "form-group";
                        
                        const label = document.createElement('label');
                        label.innerHTML = `${q.label} ${q.required ? '<span class="required">*</span>' : ''}`;
                        group.appendChild(label);

                        let input;
                        const layoutTypes = ['new_page', 'thank_you_page', 'text', 'heading_1', 'heading_2', 'heading_3', 'divider', 'title', 'label', 'image', 'video', 'audio', 'embed'];
                        const logicTypes = ['hidden_fields', 'conditional_logic', 'calculated_fields'];

                        if (logicTypes.includes(q.type)) {
                            // These run in the background, we don't render visible UI
                            input = document.createElement('input');
                            input.type = 'hidden';
                            input.className = "custom-answer-input";
                            input.dataset.question = q.label;
                            input.value = "system_logic_placeholder";
                            group.appendChild(input);
                            group.style.display = 'none'; // hide the group entirely
                        } else if (layoutTypes.includes(q.type)) {
                            // Render Layout & Embed Blocks (No actual form input)
                            const content = document.createElement('div');
                            content.style.marginBottom = "20px";
                            if (q.type === 'heading_1' || q.type === 'title') content.innerHTML = `<h1>${q.label}</h1>`;
                            else if (q.type === 'heading_2') content.innerHTML = `<h2>${q.label}</h2>`;
                            else if (q.type === 'heading_3' || q.type === 'label') content.innerHTML = `<h3>${q.label}</h3>`;
                            else if (q.type === 'text') content.innerHTML = `<p>${q.label}</p>`;
                            else if (q.type === 'divider') content.innerHTML = `<hr style="border:none; border-top: 1px solid #ccc;">`;
                            else if (q.type === 'new_page' || q.type === 'thank_you_page') content.innerHTML = `<div style="padding:15px; background:#f0f0f0; text-align:center; border-radius:8px; font-weight:bold;">--- ${q.type.replace(/_/g, ' ')} ---</div>`;
                            else content.innerHTML = `<div style="padding:20px; background:#fafafa; border:1px dashed #ccc; text-align:center;">[${q.type.toUpperCase()} PLACEHOLDER] ${q.label}</div>`;
                            
                            group.appendChild(content);
                            // We hide the standard label for layout blocks
                            label.style.display = 'none';

                        } else if (q.type === 'long_answer' || q.type === 'textarea' || q.type === 'matrix' || q.type === 'ranking') {
                            input = document.createElement('textarea');
                            input.className = "custom-answer-input";
                            input.id = `custom-${q.id}`;
                            if (q.type === 'matrix' || q.type === 'ranking') input.placeholder = `Please describe your ${q.type.replace('_', ' ')} logic here...`;
                            if (q.required) input.required = true;
                            group.appendChild(input);

                        } else if (q.type === 'multiple_choice' || q.type === 'dropdown' || q.type === 'multi_select') {
                            input = document.createElement('select');
                            input.className = "custom-answer-input";
                            input.id = `custom-${q.id}`;
                            if (q.type === 'multi_select') input.multiple = true;
                            if (q.required) input.required = true;
                            
                            if (q.type !== 'multi_select') {
                                const defaultOpt = document.createElement('option');
                                defaultOpt.value = "";
                                defaultOpt.textContent = "Select an option...";
                                input.appendChild(defaultOpt);
                            }

                            if (q.options && Array.isArray(q.options)) {
                                q.options.forEach(opt => {
                                    const option = document.createElement('option');
                                    option.value = opt.trim();
                                    option.textContent = opt.trim();
                                    input.appendChild(option);
                                });
                            }
                            group.appendChild(input);

                        } else if (q.type === 'checkbox' || q.type === 'legal' || q.type === 'terms') {
                            input = document.createElement('input');
                            input.type = 'checkbox';
                            input.className = "custom-answer-input";
                            input.id = `custom-${q.id}`;
                            input.value = "Yes";
                            input.style.width = "auto";
                            input.style.marginRight = "10px";
                            input.style.transform = "scale(1.2)";
                            if (q.required) input.required = true;
                            
                            // Format so checkbox is next to the label text cleanly
                            group.innerHTML = '';
                            const cbLabel = document.createElement('label');
                            cbLabel.style.display = 'flex';
                            cbLabel.style.alignItems = 'center';
                            cbLabel.style.gap = '10px';
                            cbLabel.style.fontWeight = 'normal';
                            cbLabel.style.cursor = 'pointer';
                            cbLabel.appendChild(input);
                            cbLabel.insertAdjacentHTML('beforeend', `<span>${q.label} ${q.required ? '<span class="required" style="color:red">*</span>' : ''}</span>`);
                            group.appendChild(cbLabel);

                        } else if (q.type === 'checkboxes') {
                            input = document.createElement('div');
                            input.className = "checkbox-group custom-answer-group";
                            input.dataset.question = q.label;
                            if (q.required) input.dataset.required = "true";
                            if (q.options && Array.isArray(q.options)) {
                                q.options.forEach(opt => {
                                    const cbLabel = document.createElement('label');
                                    cbLabel.style.display = 'block';
                                    cbLabel.innerHTML = `<input type="checkbox" value="${opt.trim()}"> ${opt.trim()}`;
                                    input.appendChild(cbLabel);
                                });
                            }
                            group.appendChild(input);
                            
                        } else if (q.type === 'payment' || q.type === 'wallet_connect' || q.type === 'recaptcha') {
                            input = document.createElement('button');
                            input.type = "button";
                            input.className = "btn";
                            input.style.background = "#333";
                            input.style.color = "#fff";
                            input.style.width = "100%";
                            input.textContent = `Integrate ${q.type.replace(/_/g, ' ')}`;
                            input.dataset.mockType = q.type;
                            group.appendChild(input);
                            // Fake input to bypass required check since it's a mock button
                            const hiddenFake = document.createElement('input');
                            hiddenFake.type = 'hidden';
                            hiddenFake.className = "custom-answer-input";
                            hiddenFake.dataset.question = q.label;
                            hiddenFake.value = "mock_completed";
                            group.appendChild(hiddenFake);
                        } else {
                            const lblLower = q.label.toLowerCase();
                            if (lblLower.includes('skill')) {
                                input = document.createElement('select');
                                input.className = "custom-answer-input";
                                input.id = `custom-${q.id}`;
                                input.multiple = true;
                                if (q.required) input.required = true;
                                const skillList = ["JavaScript", "Python", "Java", "C++", "C#", "React", "Node.js", "Angular", "Vue", "SQL", "NoSQL", "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Machine Learning", "Data Analysis", "Project Management", "Agile", "Scrum", "Communication", "Leadership", "Problem Solving", "Sales", "Marketing", "SEO", "Content Writing", "Design", "Figma", "Adobe Creative Suite"];
                                skillList.forEach(s => {
                                    const opt = document.createElement('option');
                                    opt.value = s;
                                    opt.textContent = s;
                                    input.appendChild(opt);
                                });
                                group.appendChild(input);
                            } else if (lblLower.includes('location') || lblLower.includes('city') || lblLower.includes('country')) {
                                input = document.createElement('select');
                                input.className = "custom-answer-input";
                                input.id = `custom-${q.id}`;
                                if (q.required) input.required = true;
                                const locList = ["", "India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Remote", "New Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Gurugram", "Noida", "New York", "London", "Toronto", "Sydney", "Dubai", "Singapore"];
                                locList.forEach(loc => {
                                    const opt = document.createElement('option');
                                    opt.value = loc;
                                    opt.textContent = loc || "Search location...";
                                    input.appendChild(opt);
                                });
                                group.appendChild(input);
                            } else {
                                input = document.createElement('input');
                                input.className = "custom-answer-input";
                                input.id = `custom-${q.id}`;
                                if (q.required) input.required = true;
                                
                                if (q.type === 'link' || q.type === 'url' || q.type === 'website') {
                                    input.type = 'text'; // Changed from 'url' to 'text' to accept any input
                                    input.placeholder = "e.g., linkedin.com/in/username";
                                }
                                else if (q.type === 'date') input.type = 'date';
                                else if (q.type === 'time') input.type = 'time';
                                else if (q.type === 'file_upload') input.type = 'file';
                                else if (q.type === 'email') input.type = 'email';
                                else if (q.type === 'phone' || lblLower.includes('phone') || lblLower.includes('mobile')) {
                                    input.type = 'tel';
                                    input.classList.add("phone-input");
                                }
                                else if (q.type === 'number') input.type = 'number';
                                else if (q.type === 'rating' || q.type === 'linear_scale') {
                                    input.type = 'range';
                                    input.min = "1";
                                    input.max = q.type === 'linear_scale' ? "10" : "5";
                                }
                                else if (q.type === 'signature') {
                                    input.type = 'text';
                                    input.placeholder = "Type your full name to electronically sign";
                                }
                                else input.type = 'text';

                                group.appendChild(input);
                            }
                        }

                        if (input && input.className && input.className.includes("custom-answer-input")) {
                            input.dataset.question = q.label;
                        }
                        
                        customContainer.appendChild(group);
                    });
                    
                    // Initialize Choices.js for multi-select and dropdowns
                    if (typeof Choices !== 'undefined') {
                        document.querySelectorAll('select.custom-answer-input').forEach(el => {
                            new Choices(el, {
                                removeItemButton: el.multiple,
                                searchEnabled: true,
                                itemSelectText: '',
                                placeholder: true
                            });
                        });
                    }

                    // Initialize intlTelInput for phone numbers
                    if (typeof window.intlTelInput !== 'undefined') {
                        document.querySelectorAll('.phone-input').forEach(el => {
                            window.intlTelInput(el, {
                                utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.2.1/js/utils.js",
                                separateDialCode: true,
                                initialCountry: "in",
                            });
                        });
                    }

                    // --- ADVANCED DYNAMIC SEO (JSON-LD & META TAGS) ---
                    try {
                        const pageTitle = `${jobData.title} | Careers | OpenHire`;
                        const pageDesc = `Apply for the ${jobData.title} role in ${jobData.department} at OpenHire. Location: ${jobData.location}.`;
                        const currentUrl = window.location.href;

                        document.title = pageTitle;
                        
                        // Update standard meta tags
                        const metaDesc = document.querySelector('meta[name="description"]');
                        if (metaDesc) metaDesc.setAttribute('content', pageDesc);

                        // Update Open Graph tags
                        const ogTitle = document.getElementById('og-title');
                        const ogDesc = document.getElementById('og-desc');
                        const ogUrl = document.getElementById('og-url');
                        if (ogTitle) ogTitle.setAttribute('content', pageTitle);
                        if (ogDesc) ogDesc.setAttribute('content', pageDesc);
                        if (ogUrl) ogUrl.setAttribute('content', currentUrl);

                        // Update Twitter tags
                        const twTitle = document.getElementById('tw-title');
                        const twDesc = document.getElementById('tw-desc');
                        const twUrl = document.getElementById('tw-url');
                        if (twTitle) twTitle.setAttribute('content', pageTitle);
                        if (twDesc) twDesc.setAttribute('content', pageDesc);
                        if (twUrl) twUrl.setAttribute('content', currentUrl);

                        // Generate Google JobPosting Structured Data (JSON-LD)
                        // This makes the job automatically show up in Google Jobs search!
                        const script = document.createElement('script');
                        script.type = 'application/ld+json';
                        
                        // Strip HTML tags from description for JSON-LD safely
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = jobData.description || '';
                        const plainTextDesc = tempDiv.textContent || tempDiv.innerText || '';

                        const jobPostingSchema = {
                            "@context": "https://schema.org/",
                            "@type": "JobPosting",
                            "title": jobData.title,
                            "description": plainTextDesc,
                            "identifier": {
                                "@type": "PropertyValue",
                                "name": "OpenHire",
                                "value": jobId
                            },
                            "datePosted": new Date().toISOString().split('T')[0], // We don't have creationTime in frontend yet, so we use today. Google bot will read it when crawled.
                            "employmentType": jobData.type ? jobData.type.toUpperCase().replace('-', '_') : "FULL_TIME",
                            "hiringOrganization": {
                                "@type": "Organization",
                                "name": "OpenHire",
                                "sameAs": "https://www.OpenHire.in/",
                                "logo": "https://www.OpenHire.in/logo.jpg"
                            },
                            "jobLocation": {
                                "@type": "Place",
                                "address": {
                                    "@type": "PostalAddress",
                                    "addressLocality": jobData.location.includes("Remote") ? "Anywhere" : jobData.location,
                                    "addressCountry": "IN"
                                }
                            }
                        };
                        
                        // Check if it's remote
                        if (jobData.location.toLowerCase().includes("remote")) {
                            jobPostingSchema.applicantLocationRequirements = {
                                "@type": "Country",
                                "name": "IN"
                            };
                            jobPostingSchema.jobLocationType = "TELECOMMUTE";
                        }

                        script.text = JSON.stringify(jobPostingSchema);
                        document.head.appendChild(script);

                    } catch (seoErr) {
                        console.error("SEO Generation Failed:", seoErr);
                    }
                    // --- END ADVANCED SEO ---

                }
            } else {
                titleEl.textContent = "Job Not Found";
            }
        } catch (e) {
            console.error(e);
            titleEl.textContent = "Error loading job";
        }
    }

    // AI Autofill Logic using pdf.js
    const triggerAiBtn = document.getElementById('trigger-ai-autofill');
    const aiResumeUpload = document.getElementById('ai-resume-upload');

    if (triggerAiBtn && aiResumeUpload) {
        triggerAiBtn.addEventListener('click', () => aiResumeUpload.click());

        aiResumeUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const originalBtnText = triggerAiBtn.innerHTML;
            triggerAiBtn.innerHTML = `<i data-lucide="loader-2" style="animation: spin 2s linear infinite; width: 18px; height: 18px;"></i> Reading PDF...`;
            triggerAiBtn.disabled = true;
            if (typeof lucide !== 'undefined') lucide.createIcons();

            try {
                // Read PDF via pdf.js
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map(item => item.str).join(' ') + '\n';
                }

                // Send to backend to autofill
                triggerAiBtn.innerHTML = `<i data-lucide="sparkles" style="width: 18px; height: 18px; color: #ffd700;"></i> Extracting Details...`;
                if (typeof lucide !== 'undefined') lucide.createIcons();

                const mapping = await convex.action(api.applications.autoFillFromResume, {
                    jobId: currentJobId,
                    resumeText: text.substring(0, 15000) // limit length for groq
                });

                // Apply mappings to inputs
                const customInputs = Array.from(document.querySelectorAll('.custom-answer-input'));
                for (const input of customInputs) {
                    const qLabel = input.dataset.question;
                    if (qLabel && mapping[qLabel]) {
                        input.value = mapping[qLabel];
                    }
                }

                triggerAiBtn.innerHTML = `<i data-lucide="check-circle-2" style="width: 18px; height: 18px;"></i> Autofill Complete!`;
                triggerAiBtn.style.background = "#34a853";
                triggerAiBtn.style.boxShadow = "0 4px 12px rgba(52, 168, 83, 0.2)";
                if (typeof lucide !== 'undefined') lucide.createIcons();
                
                // Add the file to any file upload block automatically
                const fileInputs = Array.from(document.querySelectorAll('input[type="file"].custom-answer-input'));
                if (fileInputs.length > 0) {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInputs[0].files = dataTransfer.files;
                }

            } catch (err) {
                console.error("Autofill failed", err);
                alert("AI Autofill failed: " + err.message);
                triggerAiBtn.innerHTML = originalBtnText;
            } finally {
                triggerAiBtn.disabled = false;
            }
        });
    }

    // Handle Form Submission
    const form = document.getElementById('application-form');
    const submitBtn = document.getElementById('apply-btn');
    const successMsg = document.getElementById('success-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;
        submitBtn.textContent = "Processing Application...";

        if (localStorage.getItem(`applied_${currentJobId}`)) {
            alert("You have already submitted an application for this role.");
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Application";
            return;
        }

        try {
            convex.mutation(api.analytics.trackVisit, { type: "apply_click", jobId: currentJobId });
        } catch (e) {
            console.error("Failed to track click", e);
        }

        try {
            const customInputs = Array.from(document.querySelectorAll('.custom-answer-input'));

            // Manual Validation Check
            for (const input of customInputs) {
                if (input.required && input.type !== 'file' && (!input.value || input.value.trim() === '')) {
                    alert(`Please fill out the required field: ${input.dataset.question}`);
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Submit Application";
                    return;
                }
                if (input.required && input.type === 'file' && (!input.files || input.files.length === 0)) {
                    alert(`Please upload a file for the required field: ${input.dataset.question}`);
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Submit Application";
                    return;
                }
                if (input.classList.contains('phone-input') && input.value) {
                    const iti = window.intlTelInputGlobals.getInstance(input);
                    if (iti && !iti.isValidNumber()) {
                        alert(`Please enter a valid phone number format for: ${input.dataset.question}`);
                        submitBtn.disabled = false;
                        submitBtn.textContent = "Submit Application";
                        return;
                    }
                }
            }

            let checkboxValid = true;
            document.querySelectorAll('.custom-answer-group').forEach(group => {
                if (group.dataset.required === "true") {
                    const checked = Array.from(group.querySelectorAll('input:checked'));
                    if (checked.length === 0) {
                        alert(`Please select at least one option for: ${group.dataset.question}`);
                        checkboxValid = false;
                    }
                }
            });
            if (!checkboxValid) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Application";
                return;
            }

            const customAnswers = {};
            
            for (const input of customInputs) {
                if (input.type === 'file' && input.files[0]) {
                    submitBtn.textContent = `Uploading ${input.dataset.question}...`;
                    const uploadUrl = await convex.mutation(api.applications.generateUploadUrl);
                    const file = input.files[0];
                    const result = await fetch(uploadUrl, {
                        method: "POST",
                        headers: { "Content-Type": file.type },
                        body: file,
                    });
                    const { storageId } = await result.json();
                    customAnswers[input.dataset.question] = `FILE_UPLOAD|${storageId}|${file.name}`;
                } else if (input.type === 'file' && !input.files[0]) {
                    customAnswers[input.dataset.question] = "No file provided";
                } else if (input.classList.contains('phone-input')) {
                    const iti = window.intlTelInputGlobals.getInstance(input);
                    customAnswers[input.dataset.question] = iti && iti.getNumber() ? iti.getNumber() : input.value;
                } else {
                    customAnswers[input.dataset.question] = input.value;
                }
            }

            // Gather checkbox groups
            document.querySelectorAll('.custom-answer-group').forEach(group => {
                const checked = Array.from(group.querySelectorAll('input:checked')).map(cb => cb.value);
                customAnswers[group.dataset.question] = checked.length > 0 ? checked.join(', ') : "None";
            });

            // Try to intelligently extract Name/Email/Phone from the custom answers if the admin created blocks for them
            let extractedName = "Applicant";
            let extractedEmail = "";
            let extractedPhone = "";
            
            for (const [key, value] of Object.entries(customAnswers)) {
                const k = key.toLowerCase();
                if (k.includes("name") && !k.includes("company")) extractedName = value;
                if (k.includes("email")) extractedEmail = value;
                if (k.includes("phone") || k.includes("mobile")) extractedPhone = value;
            }

            // Upload the AI Autofill PDF as the Main Resume to the Convex Storage Bucket if they uploaded one
            let mainResumeStorageId = undefined;
            const aiResumeUpload = document.getElementById('ai-resume-upload');
            if (aiResumeUpload && aiResumeUpload.files && aiResumeUpload.files[0]) {
                submitBtn.textContent = "Saving Resume to Bucket...";
                const uploadUrl = await convex.mutation(api.applications.generateUploadUrl);
                const file = aiResumeUpload.files[0];
                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                });
                const { storageId } = await result.json();
                mainResumeStorageId = storageId;
            }

            // 4. Submit application to backend
            submitBtn.textContent = "Submitting Application...";
            
            await convex.action(api.applications.processApplication, {
                jobId: currentJobId, 
                name: extractedName,
                email: extractedEmail,
                phone: extractedPhone,
                resumeStorageId: mainResumeStorageId,
                customAnswers: customAnswers
            });

            // 5. Success
            localStorage.setItem(`applied_${currentJobId}`, "true");
            form.style.display = 'none';
            successMsg.style.display = 'block';

        } catch (error) {
            console.error(error);
            alert("Error submitting application: " + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Application";
        }
    });
});
