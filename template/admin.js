import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const CONVEX_URL = (import.meta && import.meta.env && import.meta.env.VITE_CONVEX_URL) ? import.meta.env.VITE_CONVEX_URL : "https://exuberant-jackal-851.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const errorMsg = document.getElementById('error-msg');
    const logoutBtn = document.getElementById('logout-btn');
    const adminEmailDisplay = document.getElementById('admin-email-display');

    // Check if already logged in via localStorage
    const loggedInUser = localStorage.getItem('adminEmail');
    if (loggedInUser) {
        showDashboard(loggedInUser);
    }

    // Hamburger menu toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const result = await convex.mutation(api.admin.login, {
                username: email, // API expects username field which stores the email
                password: password
            });

            if (result.success) {
                localStorage.setItem('adminEmail', email);
                showDashboard(email);
            } else {
                errorMsg.style.display = 'block';
            }
        } catch (error) {
            console.error(error);
            errorMsg.textContent = "Server error occurred.";
            errorMsg.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminEmail');
        loginSection.style.display = 'block';
        dashboardSection.style.display = 'none';
        logoutBtn.style.display = 'none';
        adminEmailDisplay.textContent = '';
    });

    // Tab Switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });

    // Go to Create Job tab when clicking Post New Job
    document.getElementById('new-job-btn').addEventListener('click', () => {
        const formEl = document.getElementById('create-job-form');
        formEl.reset();
        formEl.removeAttribute('data-edit-id');
        document.getElementById('submit-job-text').textContent = 'Publish Comprehensive Job Live';
        document.querySelector('#submit-job-btn i').setAttribute('data-lucide', 'rocket');
        if (typeof lucide !== 'undefined') lucide.createIcons();
        currentCustomQuestions = [];
        renderBuilderBlocks();
        document.querySelector('[data-tab="create-job"]').click();
    });

    // Store custom questions globally for the form
    let currentCustomQuestions = [];

    // Form Builder Logic
    const builderCanvas = document.getElementById('form-builder-canvas');
    const emptyMsg = document.getElementById('empty-canvas-msg');

    function renderBuilderBlocks() {
        builderCanvas.innerHTML = '';
        
        currentCustomQuestions.forEach((q, index) => {
            const block = document.createElement('div');
            block.className = 'field-block';
            let extraOptionsHTML = '';
            let visualPreviewHTML = '';
            
            const layoutTypes = ['new_page', 'thank_you_page', 'text', 'heading_1', 'heading_2', 'heading_3', 'divider', 'title', 'label', 'image', 'video', 'audio', 'embed'];
            const isLayout = layoutTypes.includes(q.type);

            if (['multiple_choice', 'checkboxes', 'dropdown', 'multi_select', 'ranking'].includes(q.type)) {
                let optionsListHTML = '';
                const opts = q.options || [''];
                const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                opts.forEach((opt, oIdx) => {
                    optionsListHTML += `
                        <div class="tally-option-row">
                            <div class="tally-option-badge">${letters[oIdx % 26]}</div>
                            <input type="text" class="tally-option-input options-input" data-index="${index}" data-opt-index="${oIdx}" value="${opt}" placeholder="Option ${oIdx + 1}">
                        </div>
                    `;
                });
                // Add a blank slot for typing the next option
                optionsListHTML += `
                    <div class="tally-option-row">
                        <div class="tally-option-badge" style="opacity: 0.5;">${letters[opts.length % 26]}</div>
                        <input type="text" class="tally-option-input options-input" data-index="${index}" data-opt-index="${opts.length}" value="" placeholder="Type option and press Enter">
                    </div>
                `;
                extraOptionsHTML = `<div style="margin-top: 10px; padding-left: 5px;">${optionsListHTML}</div>`;
            }

            // Generate the WYSIWYG Visual Preview
            if (q.type === 'short_answer' || q.type === 'email' || q.type === 'phone' || q.type === 'number' || q.type === 'link') {
                visualPreviewHTML = `<input type="text" class="tally-inline-placeholder" disabled placeholder="${q.type.replace(/_/g, ' ')} input...">`;
            } else if (q.type === 'long_answer') {
                visualPreviewHTML = `<textarea class="tally-inline-placeholder" disabled placeholder="Long answer text..." style="height: 60px;"></textarea>`;
            } else if (q.type === 'file_upload') {
                visualPreviewHTML = `<div style="width: 100%; padding: 20px; border: 2px dashed #ccc; border-radius: 6px; text-align: center; color: #888; background: #fafafa;"><i data-lucide="upload-cloud" style="margin-bottom: 5px;"></i><br>Click or drag file to upload</div>`;
            } else if (q.type === 'date' || q.type === 'time') {
                visualPreviewHTML = `<div class="tally-inline-placeholder" style="display:flex; align-items:center; gap:10px;"><i data-lucide="${q.type === 'date' ? 'calendar' : 'clock'}"></i> Select ${q.type}</div>`;
            } else if (q.type === 'rating' || q.type === 'linear_scale') {
                visualPreviewHTML = `<div style="display: flex; gap: 10px; color: #ccc; padding: 10px 0;"><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i><i data-lucide="star"></i></div>`;
            } else if (q.type === 'signature') {
                visualPreviewHTML = `<div style="width: 100%; height: 80px; border: 1px dashed #ccc; border-radius: 4px; background: #fafafa; position: relative;"><span style="position: absolute; bottom: 5px; left: 10px; color: #aaa; font-style: italic;">Draw signature</span></div>`;
            } else if (q.type === 'payment' || q.type === 'wallet_connect') {
                visualPreviewHTML = `<button disabled style="padding: 10px 15px; background: #111; color: #fff; border: none; border-radius: 6px; cursor: not-allowed; display: flex; align-items: center; gap: 8px;"><i data-lucide="${q.type === 'payment' ? 'credit-card' : 'wallet'}"></i> ${q.type.replace(/_/g, ' ')}</button>`;
            } else if (q.type === 'recaptcha') {
                visualPreviewHTML = `<div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; width: 300px;"><div style="display: flex; align-items: center; gap: 10px;"><input type="checkbox" disabled> <span style="font-family: sans-serif;">I'm not a robot</span></div><img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" width="24" style="opacity:0.5;"></div>`;
            } else if (q.type === 'conditional_logic' || q.type === 'calculated_fields') {
                visualPreviewHTML = `<div style="padding: 10px; background: #fef0f0; border: 1px solid #ffccc7; border-radius: 4px; color: #cf1322; font-size: 0.85rem; display: flex; align-items: center; gap: 8px;"><i data-lucide="git-branch"></i> Set up ${q.type.replace(/_/g, ' ')} rules</div>`;
            } else if (q.type === 'hidden_fields') {
                visualPreviewHTML = `<div style="padding: 10px; background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 4px; color: #389e0d; font-size: 0.85rem; display: flex; align-items: center; gap: 8px;"><i data-lucide="eye-off"></i> Hidden field (Not visible to candidate)</div>`;
            } else if (q.type === 'matrix') {
                visualPreviewHTML = `<div style="width: 100%; height: 100px; border: 1px dashed #ccc; border-radius: 4px; background: repeating-linear-gradient(0deg, #fff, #fff 19px, #f0f0f0 19px, #f0f0f0 20px); text-align: center; line-height: 100px; color: #aaa;">Matrix grid placeholder</div>`;
            } else if (q.type === 'ranking') {
                visualPreviewHTML = `<div style="padding: 10px; border: 1px solid #ddd; border-radius: 4px;"><div style="margin-bottom: 5px; color: #666;"><i data-lucide="grip-vertical" style="width: 14px;"></i> Item 1</div><div style="color: #666;"><i data-lucide="grip-vertical" style="width: 14px;"></i> Item 2</div></div>`;
            }

            let inputFieldHTML = '';
            if (isLayout) {
                if (q.type === 'divider') {
                    inputFieldHTML = `<div style="height: 1px; background: #ddd; margin: 15px 0;"></div>`;
                } else if (q.type === 'new_page' || q.type === 'thank_you_page') {
                    inputFieldHTML = `<div style="padding: 15px; background: #f9f9f9; color: #555; border-radius: 4px; text-align: center; font-weight: bold; margin: 10px 0; border: 1px dashed #ccc;"><i data-lucide="file-plus" style="margin-right: 8px;"></i>${q.type === 'new_page' ? 'New Page' : 'Thank You Page'}</div>`;
                } else if (q.type === 'image' || q.type === 'video' || q.type === 'audio') {
                    inputFieldHTML = `<div style="padding: 20px; background: #f8f9fa; border: 2px dashed #ddd; text-align: center; border-radius: 8px; margin: 10px 0; color: #666;"><i data-lucide="${q.type === 'image' ? 'image' : q.type === 'video' ? 'film' : 'volume-2'}"></i><br>Embed ${q.type}</div>`;
                } else {
                    let fontSize = '1rem';
                    let fontWeight = 'normal';
                    if (q.type === 'heading_1') { fontSize = '2rem'; fontWeight = 'bold'; }
                    if (q.type === 'heading_2') { fontSize = '1.5rem'; fontWeight = 'bold'; }
                    if (q.type === 'heading_3') { fontSize = '1.17rem'; fontWeight = '600'; }
                    
                    inputFieldHTML = `<input type="text" class="question-label" data-index="${index}" value="${q.label}" placeholder="Type your ${q.type.replace(/_/g, ' ')}..." style="width: 100%; font-size: ${fontSize}; font-weight: ${fontWeight}; border: none; outline: none; background: transparent; padding: 5px 0;">`;
                }
            } else {
                inputFieldHTML = `
                    <div style="display: flex; gap: 15px; margin-bottom: 5px;">
                        <input type="text" class="question-label" data-index="${index}" value="${q.label}" placeholder="Type your question..." style="flex: 1; font-weight: 600; border: none; outline: none; background: transparent; padding: 5px 0; font-size: 1.05rem;">
                        <label style="display: flex; align-items: center; gap: 5px; color: #888; font-size: 0.8rem; cursor: pointer;">
                            <input type="checkbox" class="question-required" data-index="${index}" ${q.required ? 'checked' : ''}> Required
                        </label>
                    </div>
                    ${visualPreviewHTML}
                `;
            }

            block.innerHTML = `
                <!-- Tally Floating Margin Actions -->
                <div class="block-actions-margin">
                    <button class="margin-btn" title="Click to add block below (or type '/')"><i data-lucide="plus" style="width: 14px; height: 14px;"></i></button>
                    <button class="margin-btn" style="cursor: grab;" title="Drag to reorder"><i data-lucide="grip-vertical" style="width: 14px; height: 14px;"></i></button>
                    <button class="margin-btn remove-btn" data-index="${index}" title="Delete block"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                </div>
                ${inputFieldHTML}
                ${extraOptionsHTML}
            `;
            builderCanvas.appendChild(block);
        });

        // Attach listeners to new DOM elements
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                currentCustomQuestions.splice(idx, 1);
                renderBuilderBlocks();
            });
        });

        document.querySelectorAll('.question-label').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index);
                currentCustomQuestions[idx].label = e.target.value;
            });
        });

        document.querySelectorAll('.question-required').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index);
                currentCustomQuestions[idx].required = e.target.checked;
            });
        });

        document.querySelectorAll('.options-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index);
                const optIdx = parseInt(e.target.dataset.optIndex);
                if (!currentCustomQuestions[idx].options) currentCustomQuestions[idx].options = [];
                currentCustomQuestions[idx].options[optIdx] = e.target.value;
            });
            
            input.addEventListener('keydown', (e) => {
                const idx = parseInt(e.target.dataset.index);
                const optIdx = parseInt(e.target.dataset.optIndex);
                const opts = currentCustomQuestions[idx].options || [];
                
                if (e.key === 'Enter') {
                    e.preventDefault();
                    // If it's the last empty placeholder, just render and it will add another
                    if (optIdx === opts.length) {
                        if (e.target.value.trim() !== '') {
                            opts.push(e.target.value.trim());
                        }
                    } else {
                        // Insert new slot below current one
                        opts.splice(optIdx + 1, 0, '');
                    }
                    currentCustomQuestions[idx].options = opts;
                    renderBuilderBlocks();
                    
                    // Focus the newly created input
                    setTimeout(() => {
                        const inputs = document.querySelectorAll(`.options-input[data-index="${idx}"]`);
                        if (inputs[optIdx + 1]) inputs[optIdx + 1].focus();
                    }, 10);
                }
                
                if (e.key === 'Backspace' && e.target.value === '') {
                    e.preventDefault();
                    if (optIdx < opts.length) {
                        opts.splice(optIdx, 1);
                        currentCustomQuestions[idx].options = opts;
                        renderBuilderBlocks();
                        
                        // Focus the previous input
                        setTimeout(() => {
                            const inputs = document.querySelectorAll(`.options-input[data-index="${idx}"]`);
                            if (inputs[Math.max(0, optIdx - 1)]) inputs[Math.max(0, optIdx - 1)].focus();
                        }, 10);
                    }
                }
            });
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Tally Popover Logic
    const tallyBtn = document.getElementById('open-tally-btn');
    const tallyPopover = document.getElementById('tally-popover');
    const tallySearch = document.getElementById('tally-search-input');
    const tallyItems = document.querySelectorAll('.tally-block-item');

    tallyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = tallyBtn.getBoundingClientRect();
        // Position relative to the button
        tallyPopover.style.top = (tallyBtn.offsetTop + tallyBtn.offsetHeight + 10) + 'px';
        tallyPopover.style.left = tallyBtn.offsetLeft + 'px';
        tallyPopover.classList.toggle('active');
        if (tallyPopover.classList.contains('active')) {
            tallySearch.focus();
            tallySearch.value = '';
            tallyItems.forEach(item => item.style.display = 'flex');
        }
    });

    document.addEventListener('click', (e) => {
        if (!tallyPopover.contains(e.target) && e.target !== tallyBtn) {
            tallyPopover.classList.remove('active');
        }
    });

        // Support typing '/' to open (if not in an input)
        document.addEventListener('keydown', (e) => {
            // Only trigger if we are on the create job tab
            const createJobTab = document.querySelector('[data-tab="create-job"]');
            if (!createJobTab) return;
            
            const tabContent = document.getElementById('tab-create-job');
            if (tabContent && tabContent.classList.contains('active')) {
                if (e.key === '/') {
                    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                        tallyBtn.click();
                    }
                }
            }
        });

    tallySearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().replace(/^\//, '').trim();
        
        tallyItems.forEach(item => {
            const text = item.querySelector('span').textContent.toLowerCase();
            // Treat "message" as "answer" for matching (e.g. "short message" matches "short answer")
            const searchSpace = text + " " + item.dataset.type.replace(/_/g, ' ');
            const normalizedSearchSpace = searchSpace.replace(/answer/g, 'answer message');
            
            const words = query.split(' ').filter(w => w);
            const isMatch = words.length === 0 || words.every(word => normalizedSearchSpace.includes(word));
            
            item.style.display = isMatch ? 'flex' : 'none';
        });
    });

    tallySearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            // Find the first visible tally item and click it
            const firstVisible = Array.from(tallyItems).find(item => item.style.display !== 'none');
            if (firstVisible) {
                firstVisible.click();
            }
        }
    });

    tallyItems.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = btn.dataset.type;
            const textContent = btn.querySelector('span').textContent;
            
            const layoutTypes = ['new_page', 'thank_you_page', 'text', 'heading_1', 'heading_2', 'heading_3', 'divider', 'title', 'label'];
            
            const newQuestion = {
                id: 'q_' + Math.random().toString(36).substr(2, 9),
                type: type,
                label: '',
                required: false
            };
            if (['dropdown', 'multiple_choice', 'checkboxes', 'multi_select', 'ranking'].includes(type)) {
                newQuestion.options = [];
            }
            currentCustomQuestions.push(newQuestion);
            
            tallyPopover.classList.remove('active');
            renderBuilderBlocks();
        });
    });


    // Handle Form Submission for Create Job
    document.getElementById('create-job-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Ensure all custom questions have labels
        for (let q of currentCustomQuestions) {
            if (!q.label || q.label.trim() === '') {
                return alert("Please fill out the question text for all custom fields!");
            }
        }
        
        try {
            const formEl = document.getElementById('create-job-form');
            const editId = formEl.dataset.editId;
            
            if (editId) {
                await convex.mutation(api.jobs.updateJob, {
                    jobId: editId,
                    title: document.getElementById('job-title-input').value,
                    department: document.getElementById('job-dept-input').value,
                    location: document.getElementById('job-loc-input').value,
                    type: document.getElementById('job-type-input').value,
                    description: document.getElementById('job-desc-input').value,
                    customQuestions: currentCustomQuestions
                });
                alert("Job updated successfully!");
                formEl.removeAttribute('data-edit-id');
                document.getElementById('submit-job-text').textContent = 'Publish Comprehensive Job Live';
                document.querySelector('#submit-job-btn i').setAttribute('data-lucide', 'rocket');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else {
                await convex.mutation(api.jobs.createJob, {
                    title: document.getElementById('job-title-input').value,
                    department: document.getElementById('job-dept-input').value,
                    location: document.getElementById('job-loc-input').value,
                    type: document.getElementById('job-type-input').value,
                    description: document.getElementById('job-desc-input').value,
                    customQuestions: currentCustomQuestions
                });
                alert("Job published successfully!");
            }
            
            formEl.reset();
            currentCustomQuestions = [];
            renderBuilderBlocks(); // Reset canvas
            document.querySelector('[data-tab="jobs"]').click(); // Switch to jobs tab
            loadDashboardData();
        } catch (error) {
            console.error(error);
            alert("Error saving job: " + error.message);
        }
    });


    async function showDashboard(email) {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        logoutBtn.style.display = 'inline-block';
        adminEmailDisplay.textContent = `Logged in as: ${email}`;
        
        loadDashboardData();
    }

    function renderApplicationsTable(applicationsToRender, tbodyElement) {
        tbodyElement.innerHTML = '';
        if (applicationsToRender.length === 0) {
            tbodyElement.innerHTML = '<tr><td colspan="5">No applications received yet.</td></tr>';
            return;
        }

        for (const app of applicationsToRender) {
            const statusClass = app.status === 'interview' ? 'interview' : (app.status === 'rejected' ? 'rejected' : 'new');
            const statusText = app.status === 'interview' ? 'Next Round' : (app.status === 'rejected' ? 'Closed' : 'New');

            const mainResumeHTML = app.resumeStorageId ? `<a href="#" class="fetch-file-url" data-id="${app.resumeStorageId}" style="font-size: 0.85rem; color: #1a73e8; text-decoration: none;">📄 View Main Resume</a>` : '<span style="font-size: 0.8rem; color: #888;">No PDF Attached</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong>${app.name}</strong><br>
                    ${mainResumeHTML}
                </td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${app.email}</td>
                <td>${app.phone}</td>
                <td>
                    <button class="action-btn btn-view-app" data-id="${app._id}" style="background: #17a2b8; color: white; margin-bottom: 5px;">View Details</button><br>
                    <button class="action-btn btn-advance" data-id="${app._id}" data-email="${app.email}" data-name="${app.name}">Advance</button>
                    <button class="action-btn btn-reject" data-id="${app._id}">Close</button>
                    <button class="action-btn btn-delete" data-id="${app._id}">Delete</button>
                </td>
            `;
            tbodyElement.appendChild(tr);
        }

        // Reattach all the event listeners, scoped to this specific tbodyElement
        const appModal = document.getElementById('application-modal');
        const closeAppModal = document.getElementById('close-app-modal');
        const appModalContent = document.getElementById('app-modal-content');

        tbodyElement.querySelectorAll('.btn-view-app').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const appId = e.target.dataset.id;
                const app = applicationsToRender.find(a => a._id === appId);
                if (!app) return;

                document.getElementById('app-modal-title').textContent = `${app.name}'s Application`;
                
                let detailsHTML = `<p><strong>Email:</strong> ${app.email}</p>
                                   <p><strong>Phone:</strong> ${app.phone}</p>`;
                                   
                if (app.resumeStorageId) {
                    detailsHTML += `<p><strong>Main Resume:</strong> <a href="#" class="fetch-file-url" data-id="${app.resumeStorageId}" style="color: #1a73e8;">View Attached PDF</a></p>`;
                }

                if (app.customAnswers && Object.keys(app.customAnswers).length > 0) {
                    detailsHTML += `<hr style="margin: 15px 0; border: none; border-top: 1px solid #eee;"><h3 style="margin-bottom: 10px;">Custom Form Answers:</h3><ul style="list-style: none; padding: 0;">`;
                    for (const [q, a] of Object.entries(app.customAnswers)) {
                        if (typeof a === 'string' && a.startsWith('FILE_UPLOAD|')) {
                            const parts = a.split('|');
                            detailsHTML += `<li style="margin-bottom: 10px; background: #f8f9fa; padding: 10px; border-radius: 6px;"><strong>${q}</strong><br><a href="#" class="fetch-file-url" data-id="${parts[1]}" style="color: #1a73e8; text-decoration: underline;">📎 View ${parts[2]}</a></li>`;
                        } else {
                            detailsHTML += `<li style="margin-bottom: 10px; background: #f8f9fa; padding: 10px; border-radius: 6px;"><strong>${q}</strong><br>${a}</li>`;
                        }
                    }
                    detailsHTML += `</ul>`;
                }
                
                appModalContent.innerHTML = detailsHTML;
                appModal.style.display = 'flex';

                appModalContent.querySelectorAll('.fetch-file-url').forEach(link => {
                    link.addEventListener('click', async (event) => {
                        event.preventDefault();
                        const storageId = event.target.dataset.id;
                        try {
                            const url = await convex.query(api.applications.getFileUrl, { storageId });
                            window.open(url, '_blank');
                        } catch (err) {
                            alert("Failed to load file: " + err.message);
                        }
                    });
                });
            });
        });

        // Ensure close button works (only bind once ideally, but safe here)
        if (closeAppModal && !closeAppModal.dataset.bound) {
            closeAppModal.addEventListener('click', () => {
                appModal.style.display = 'none';
            });
            closeAppModal.dataset.bound = 'true';
        }

        tbodyElement.querySelectorAll('.fetch-file-url').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const storageId = e.target.dataset.id;
                try {
                    const url = await convex.query(api.applications.getFileUrl, { storageId });
                    window.open(url, '_blank');
                } catch (err) {
                    alert("Failed to load file: " + err.message);
                }
            });
        });

        tbodyElement.querySelectorAll('.btn-advance').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const email = e.target.dataset.email;
                const name = e.target.dataset.name;
                if(confirm(`Advance ${name} to Next Round? This will automatically email ${email} right now.`)) {
                    e.target.textContent = "Emailing...";
                    await convex.action(api.applications.advanceApplicant, { applicationId: id, email, name });
                    loadDashboardData();
                }
            });
        });

        tbodyElement.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if(confirm('Close this application?')) {
                    await convex.mutation(api.applications.updateApplicationStatus, { applicationId: id, status: "rejected" });
                    loadDashboardData();
                }
            });
        });

        tbodyElement.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if(confirm('Permanently delete this application?')) {
                    await convex.mutation(api.applications.deleteApplication, { applicationId: id });
                    loadDashboardData();
                }
            });
        });
    }

    async function loadDashboardData() {
        try {
            // Load Analytics
            const analytics = await convex.query(api.analytics.getAnalytics);
            document.getElementById('total-visits').textContent = `Total Visits: ${analytics.visits} | Job Views: ${analytics.jobViews}`;

            // Load Jobs (Include inactive)
            const jobs = await convex.query(api.jobs.getJobs, { includeInactive: true });
            const jobsTbody = document.getElementById('jobs-table-body');
            jobsTbody.innerHTML = '';
            if (jobs.length === 0) {
                jobsTbody.innerHTML = '<tr><td colspan="5">No jobs posted yet.</td></tr>';
            } else {
                jobs.forEach(job => {
                    const statusHTML = job.isActive ? '<span class="badge new">Active</span>' : '<span class="badge rejected">Inactive</span>';
                    const toggleAction = job.isActive ? 'Deactivate' : 'Activate';
                    
                    // Use clean slug URL
                    const jobUrl = job.slug ? `${job.slug}` : `job?id=${job._id}`;
                    const fullUrl = window.location.origin + '/' + jobUrl;

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>
                            <strong>${job.title}</strong><br>
                            <a href="#" class="copy-link-btn" data-link="${fullUrl}" style="font-size: 0.85rem; color: #1a73e8; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; margin-top: 4px;"><i data-lucide="link" style="width: 12px; height: 12px;"></i> Copy Link</a>
                        </td>
                        <td>${job.department}</td>
                        <td>${job.location}</td>
                        <td>${statusHTML}</td>
                        <td>
                            <button class="action-btn btn-view-analytics" style="background: #673ab7; color: white; display: inline-flex; align-items: center;" data-id="${job._id}" data-title="${job.title}">
                                <i data-lucide="bar-chart-2" style="width: 14px; height: 14px; margin-right: 4px;"></i> Analytics
                            </button>
                        </td>
                        <td>
                            <button class="action-btn btn-advance btn-edit-job" data-id="${job._id}">Edit</button>
                            <button class="action-btn btn-advance btn-toggle-job" data-id="${job._id}" data-active="${job.isActive}">${toggleAction}</button>
                            <button class="action-btn btn-delete btn-delete-job" data-id="${job._id}">Delete</button>
                        </td>
                    `;
                    jobsTbody.appendChild(tr);
                });

                // Attach Job actions
                document.querySelectorAll('.copy-link-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const link = e.currentTarget.dataset.link;
                        await navigator.clipboard.writeText(link);
                        const originalHtml = e.currentTarget.innerHTML;
                        e.currentTarget.innerHTML = '<i data-lucide="check" style="width: 12px; height: 12px;"></i> Copied!';
                        if (typeof lucide !== 'undefined') lucide.createIcons();
                        setTimeout(() => {
                            e.currentTarget.innerHTML = originalHtml;
                            if (typeof lucide !== 'undefined') lucide.createIcons();
                        }, 2000);
                    });
                });

                document.querySelectorAll('.btn-edit-job').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.dataset.id;
                        const jobToEdit = jobs.find(j => j._id === id);
                        if (!jobToEdit) return;
                        
                        document.getElementById('job-title-input').value = jobToEdit.title;
                        document.getElementById('job-dept-input').value = jobToEdit.department;
                        document.getElementById('job-loc-input').value = jobToEdit.location;
                        document.getElementById('job-type-input').value = jobToEdit.type;
                        document.getElementById('job-desc-input').value = jobToEdit.description;
                        
                        currentCustomQuestions = jobToEdit.customQuestions ? JSON.parse(JSON.stringify(jobToEdit.customQuestions)) : [];
                        renderBuilderBlocks();
                        
                        const formEl = document.getElementById('create-job-form');
                        formEl.dataset.editId = id;
                        document.getElementById('submit-job-text').textContent = 'Update Job Live';
                        document.querySelector('#submit-job-btn i').setAttribute('data-lucide', 'save');
                        if (typeof lucide !== 'undefined') lucide.createIcons();
                        
                        document.querySelector('[data-tab="create-job"]').click();
                    });
                });

                document.querySelectorAll('.btn-toggle-job').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = e.target.dataset.id;
                        const currentlyActive = e.target.dataset.active === 'true';
                        await convex.mutation(api.jobs.updateJobStatus, { jobId: id, isActive: !currentlyActive });
                        loadDashboardData();
                    });
                });

                document.querySelectorAll('.btn-delete-job').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = e.target.dataset.id;
                        if(confirm('Permanently delete this job? This will remove it from the careers page.')) {
                            await convex.mutation(api.jobs.deleteJob, { jobId: id });
                            loadDashboardData();
                        }
                    });
                });

                // Analytics Modal Logic
                const analyticsModal = document.getElementById('analytics-modal');
                const closeAnalyticsModal = document.getElementById('close-analytics-modal');

                document.querySelectorAll('.btn-view-analytics').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const jobId = e.currentTarget.dataset.id;
                        const jobTitle = e.currentTarget.dataset.title;
                        document.getElementById('analytics-modal-title').textContent = `Job Analytics & Applications: ${jobTitle}`;
                        document.getElementById('analytics-views').textContent = '...';
                        document.getElementById('analytics-applications').textContent = '...';
                        
                        const analyticsAppsBody = document.getElementById('analytics-applications-body');
                        analyticsAppsBody.innerHTML = '<tr><td colspan="5">Loading applications...</td></tr>';
                        
                        analyticsModal.style.display = 'flex';

                        try {
                            const stats = await convex.query(api.analytics.getJobAnalytics, { jobId });
                            document.getElementById('analytics-views').textContent = stats.views;
                            document.getElementById('analytics-applications').textContent = stats.applications;
                            
                            const jobApps = await convex.query(api.applications.getApplicationsByJob, { jobId });
                            renderApplicationsTable(jobApps, analyticsAppsBody);
                        } catch (err) {
                            console.error("Failed to load analytics", err);
                            document.getElementById('analytics-views').textContent = 'Error';
                            document.getElementById('analytics-applications').textContent = 'Error';
                            analyticsAppsBody.innerHTML = '<tr><td colspan="5" style="color:red;">Error loading applications.</td></tr>';
                        }
                    });
                });

                closeAnalyticsModal.addEventListener('click', () => {
                    analyticsModal.style.display = 'none';
                });
            }

            // Load Applications
            const applications = await convex.query(api.applications.getApplications);
            const appsTbody = document.getElementById('applications-table-body');
            renderApplicationsTable(applications, appsTbody);

            // Load Admins
            const admins = await convex.query(api.admin.getAdmins);
            const adminsTbody = document.getElementById('admins-table-body');
            adminsTbody.innerHTML = '';
            admins.forEach(admin => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${admin.username}</strong></td>
                    <td>Super Admin</td>
                    <td>
                        <button class="action-btn btn-delete btn-delete-admin" data-id="${admin._id}">Remove Access</button>
                    </td>
                `;
                adminsTbody.appendChild(tr);
            });

            // Delete Admin Action
            document.querySelectorAll('.btn-delete-admin').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    if(confirm('Revoke access for this admin?')) {
                        try {
                            await convex.mutation(api.admin.deleteAdmin, { adminId: id });
                            loadDashboardData();
                        } catch (err) {
                            alert(err.message);
                        }
                    }
                });
            });

        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    }

    // Create New Admin
    const createAdminForm = document.getElementById('create-admin-form');
    if (createAdminForm) {
        createAdminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('new-admin-email').value;
            const password = document.getElementById('new-admin-password').value;
            try {
                await convex.mutation(api.admin.createAdmin, { username: email, password });
                alert("Admin created successfully!");
                createAdminForm.reset();
                loadDashboardData();
            } catch (err) {
                alert("Failed to create admin: " + err.message);
            }
        });
    }
});
