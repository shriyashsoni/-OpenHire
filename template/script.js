import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const CONVEX_URL = (import.meta && import.meta.env && import.meta.env.VITE_CONVEX_URL) ? import.meta.env.VITE_CONVEX_URL : "https://exuberant-jackal-851.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

document.addEventListener('DOMContentLoaded', async () => {
    // Increment total visit count (optional but good for tracking)
    try {
        await convex.mutation(api.analytics.trackVisit);
    } catch (e) {
        console.error("Failed to track visit", e);
    }

    // Hamburger menu toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Load Real Jobs from Backend
    const jobsListContainer = document.getElementById('jobs-list-container');
    
    try {
        const jobs = await convex.query(api.jobs.getJobs);
        jobsListContainer.innerHTML = ''; // Clear loading text

        if (jobs.length === 0) {
            jobsListContainer.innerHTML = '<p style="text-align: center; color: #666; width: 100%;">No open positions at the moment. Check back later!</p>';
        } else {
            jobs.forEach(job => {
                // Determine a category class based on department for filtering
                let category = 'engineering';
                const dept = (job.department || '').toLowerCase();
                if (dept.includes('counsel') || dept.includes('hr') || dept.includes('mentor')) category = 'counseling';
                if (dept.includes('market') || dept.includes('sales') || dept.includes('ambassador')) category = 'marketing';

                // Use clean slug URL
                const jobUrl = job.slug ? `/${job.slug}` : `job?id=${job._id}`;
                const jobCard = document.createElement('a');
                jobCard.href = jobUrl;
                jobCard.className = 'job-card';
                jobCard.dataset.category = category;

                jobCard.innerHTML = `
                    <div class="job-info">
                        <h3>${job.title}</h3>
                        <div class="job-meta">
                            <span>${job.location}</span>
                            <span>${job.type || 'Full-time'}</span>
                        </div>
                    </div>
                    <div class="job-action">
                        <span class="btn btn-outline">Apply</span>
                    </div>
                `;
                jobsListContainer.appendChild(jobCard);
            });
        }
    } catch (error) {
        console.error("Failed to load jobs:", error);
        jobsListContainer.innerHTML = '<p style="text-align: center; color: red; width: 100%;">Failed to load jobs. Please try again later.</p>';
    }

    // Job filtering functionality
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            const jobCards = document.querySelectorAll('.job-card');

            jobCards.forEach(card => {
                // If filter is 'all', show all cards
                if (filterValue === 'all') {
                    card.style.display = 'flex';
                } else {
                    // Hide cards that don't match the filter
                    if (card.getAttribute('data-category') === filterValue) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

