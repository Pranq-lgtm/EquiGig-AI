// EquiGig AI - Client Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const envStatusPill = document.getElementById('envStatusPill');
    const apiStatusPill = document.getElementById('apiStatusPill');
    const vectorStatusPill = document.getElementById('vectorStatusPill');
    const presetButtons = document.getElementById('presetButtons');

    const workerNameInput = document.getElementById('workerName');
    const workerSkillsInput = document.getElementById('workerSkills');
    const minHourlyRateInput = document.getElementById('minHourlyRate');

    const jobTitleInput = document.getElementById('jobTitle');
    const companyNameInput = document.getElementById('companyName');
    const proposedRateInput = document.getElementById('proposedRate');
    const contractClausesInput = document.getElementById('contractClauses');

    const runAgentBtn = document.getElementById('runAgentBtn');
    const pipelineStatusText = document.getElementById('pipelineStatusText');
    const issuesList = document.getElementById('issuesList');
    const negotiationSummary = document.getElementById('negotiationSummary');
    const emailPreview = document.getElementById('emailPreview');
    const endeeRagCard = document.getElementById('endeeRagCard');
    const endeeSourceBadge = document.getElementById('endeeSourceBadge');
    const terminalLogs = document.getElementById('terminalLogs');
    const clearLogsBtn = document.getElementById('clearLogsBtn');

    // Initialize API Status Checks & Presets
    checkHealth();
    loadPresets();
    initJobUrlExtractor();

    // Clear logs handler
    clearLogsBtn.addEventListener('click', () => {
        terminalLogs.innerHTML = '';
        appendLog('[System]: Log terminal cleared.', 'system');
    });

    // Run Agent Click Handler
    runAgentBtn.addEventListener('click', handleRunAgent);

    // --- API Functions ---
    async function checkHealth() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/health`);
            if (res.ok) {
                const data = await res.json();

                // Update env badge
                if (data.env_file_loaded) {
                    envStatusPill.innerHTML = `<span class="dot green"></span><span class="text">.env Loaded (${data.api_provider})</span>`;
                } else {
                    envStatusPill.innerHTML = `<span class="dot yellow"></span><span class="text">.env Missing</span>`;
                }

                // Update API status
                apiStatusPill.innerHTML = `<span class="dot green"></span><span class="text">Backend: Online (${data.environment})</span>`;

                // Update Endee Vector DB status
                if (data.vector_db) {
                    vectorStatusPill.innerHTML = `<span class="dot blue"></span><span class="text">${data.vector_db.provider} (${data.vector_db.status})</span>`;
                }

                appendLog(`[System]: Connected to Backend (${data.agent}). Provider: ${data.api_provider}. Vector DB: ${data.vector_db ? data.vector_db.provider : 'Active'}.`, 'system');
            } else {
                throw new Error("Backend health error");
            }
        } catch (err) {
            envStatusPill.innerHTML = `<span class="dot red"></span><span class="text">Offline</span>`;
            apiStatusPill.innerHTML = `<span class="dot red"></span><span class="text">Backend Offline</span>`;
            appendLog(`[System Warning]: Unable to connect to FastAPI backend server. Ensure server.py is running.`, 'warning');
        }
    }

    async function loadPresets() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/presets`);
            if (res.ok) {
                const data = await res.json();
                presetButtons.innerHTML = '';
                data.presets.forEach(preset => {
                    const btn = document.createElement('button');
                    btn.className = 'preset-btn';
                    btn.textContent = preset.name;
                    btn.addEventListener('click', () => applyPreset(preset));
                    presetButtons.appendChild(btn);
                });
            }
        } catch (err) {
            console.error('Failed to load presets:', err);
        }
    }

    function applyPreset(preset) {
        workerNameInput.value = preset.profile.name;
        workerSkillsInput.value = preset.profile.skills.join(', ');
        minHourlyRateInput.value = preset.profile.min_hourly_rate;

        jobTitleInput.value = preset.job.title;
        companyNameInput.value = preset.job.company;
        proposedRateInput.value = preset.job.proposed_rate;
        contractClausesInput.value = preset.job.contract_snippet.join('\n');

        appendLog(`[Preset Loaded]: Applied template '${preset.name}'.`, 'system');
    }

    async function handleRunAgent() {
        const payload = {
            user_profile: {
                name: workerNameInput.value.trim() || 'Gig Worker',
                skills: workerSkillsInput.value.split(',').map(s => s.trim()).filter(Boolean),
                min_hourly_rate: parseInt(minHourlyRateInput.value) || 30
            },
            custom_job: {
                title: jobTitleInput.value.trim() || 'Software Engineer',
                company: companyNameInput.value.trim() || 'Tech Client',
                proposed_rate: parseInt(proposedRateInput.value) || 25,
                contract_snippet: contractClausesInput.value.split('\n').map(c => c.trim()).filter(Boolean)
            }
        };

        // UI Loading State
        runAgentBtn.classList.add('loading');
        runAgentBtn.disabled = true;
        pipelineStatusText.textContent = "Executing LangGraph State Graph...";

        // Reset Pipeline Nodes
        resetPipelineNodes();

        try {
            // Step 1 Animation: Analyze Profile
            await animateNode('node-analyze', 'pipe-1', 400);
            appendLog(`[LangGraph Node 1]: Analyzing worker profile for ${payload.user_profile.name}...`, 'agent');

            // Step 2 Animation: Search Jobs
            await animateNode('node-search', 'pipe-2', 400);
            appendLog(`[LangGraph Node 2]: Matching job '${payload.custom_job.title}' @ $${payload.custom_job.proposed_rate}/hr...`, 'agent');

            // Step 3 Animation: Review Contract
            await animateNode('node-review', 'pipe-3', 400);
            appendLog(`[LangGraph Node 3]: Scanning contract clauses for risks against minimum target ($${payload.user_profile.min_hourly_rate}/hr)...`, 'agent');

            // Call Backend REST API
            const response = await fetch(`${API_BASE_URL}/api/run-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API returned error status ${response.status}`);
            }

            const data = await response.json();
            const result = data.result;

            // Step 4 Animation: Decision & Negotiation Node
            await animateNode('node-decision', 'pipe-4', 300);

            if (result.negotiation_status === "Successful Negotiation") {
                await animateNode('node-negotiate', 'pipe-5', 400);
            } else {
                markNodeComplete('node-decision');
                const pipe5 = document.getElementById('pipe-5');
                if (pipe5) pipe5.classList.add('active');
            }

            // Step 5 Animation: Draft Email Node
            await animateNode('node-email', null, 400);

            // Render Results
            renderResults(result, payload);
            pipelineStatusText.textContent = "Workflow Complete!";

            // Logs
            if (result.log && Array.isArray(result.log)) {
                result.log.forEach(msg => appendLog(`[Agent Log]: ${msg}`, 'success'));
            }

        } catch (err) {
            const errorMsg = (err.name === 'TypeError' || err.message === 'Failed to fetch')
                ? 'Cannot connect to backend server. Please verify that python server.py is running on http://127.0.0.1:8000.'
                : err.message;
            appendLog(`[Execution Error]: ${errorMsg}`, 'warning');
            pipelineStatusText.textContent = "Execution Failed";
        } finally {
            runAgentBtn.classList.remove('loading');
            runAgentBtn.disabled = false;
        }
    }

    // --- Helper UI Functions ---
    function resetPipelineNodes() {
        const nodes = ['node-analyze', 'node-search', 'node-review', 'node-decision', 'node-negotiate', 'node-email'];
        const pipes = ['pipe-1', 'pipe-2', 'pipe-3', 'pipe-4', 'pipe-5'];

        nodes.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.className = el.className.replace(/\b(active|completed)\b/g, '').trim();
        });
        pipes.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
    }

    function animateNode(nodeId, pipeId, duration = 400) {
        return new Promise(resolve => {
            const node = document.getElementById(nodeId);
            if (node) node.classList.add('active');

            setTimeout(() => {
                if (node) {
                    node.classList.remove('active');
                    node.classList.add('completed');
                }
                if (pipeId) {
                    const pipe = document.getElementById(pipeId);
                    if (pipe) pipe.classList.add('active');
                }
                resolve();
            }, duration);
        });
    }

    function markNodeComplete(nodeId) {
        const node = document.getElementById(nodeId);
        if (node) node.classList.add('completed');
    }

    function renderResults(result, payload) {
        // Render Issues
        const issues = result.identified_issues || [];
        issuesList.innerHTML = '';

        // If negotiation occurred, we check pre-negotiation issues log or result logs
        const originalProposedRate = payload.custom_job.proposed_rate;
        const minRate = payload.user_profile.min_hourly_rate;

        let detectedIssues = [];
        if (originalProposedRate < minRate) {
            detectedIssues.push(`Underpaid: Offered $${originalProposedRate}/hr vs Target $${minRate}/hr`);
        }

        payload.custom_job.contract_snippet.forEach(clause => {
            if (clause.toLowerCase().includes('non-compete')) {
                detectedIssues.push("Exploitative Clause: Restrictive Non-Compete detected");
            }
            if (clause.toLowerCase().includes('net-90') || clause.toLowerCase().includes('90 days')) {
                detectedIssues.push("Unfair Payment: Delayed Net-90 payment schedule");
            }
            if (clause.toLowerCase().includes('off-hours')) {
                detectedIssues.push("Overreaching IP: Off-hours IP assignment");
            }
        });

        if (detectedIssues.length === 0) {
            issuesList.innerHTML = `
                <div class="issue-item clean">
                    <span>✓ No critical contract risks detected. Fair gig terms!</span>
                </div>
            `;
        } else {
            detectedIssues.forEach(issue => {
                const item = document.createElement('div');
                item.className = 'issue-item';
                item.innerHTML = `<span>⚠️ ${issue}</span>`;
                issuesList.appendChild(item);
            });
        }

        // Render Negotiation Outcome
        const finalRate = result.matched_job ? result.matched_job.proposed_rate : originalProposedRate;
        const status = result.negotiation_status || "Completed";

        let clausesHtml = '';
        if (result.matched_job && result.matched_job.contract_snippet) {
            clausesHtml = result.matched_job.contract_snippet.map(c => `<div class="clause-diff-item">${c}</div>`).join('');
        }

        negotiationSummary.innerHTML = `
            <div class="rate-comparison">
                <div class="rate-box old">
                    <div class="label">Initial Offer</div>
                    <div class="val">$${originalProposedRate}/hr</div>
                </div>
                <div class="rate-arrow">➔</div>
                <div class="rate-box new">
                    <div class="label">Negotiated Rate</div>
                    <div class="val">$${finalRate}/hr</div>
                </div>
            </div>
            <div style="font-size:0.85rem; font-weight:600; color:var(--text-muted); margin-top:8px;">Revised Contract Clauses:</div>
            <div>${clausesHtml}</div>
        `;

        // Render Email Preview
        if (result.drafted_email) {
            emailPreview.innerHTML = result.drafted_email;
        } else {
            emailPreview.innerHTML = `<div class="empty-state">No email drafted.</div>`;
        }

        // Render Endee.io Vector DB RAG Insights
        const rag = result.endee_rag_insights || {};
        if (rag.role_category) {
            if (endeeSourceBadge) endeeSourceBadge.textContent = rag.source || "Endee.io Vector DB";

            const risksHtml = (rag.known_clause_risks || []).map(r => `<div style="font-size:0.85rem; color:#9ca3af; margin-bottom:6px;">🔹 ${r}</div>`).join('');

            endeeRagCard.innerHTML = `
                <div class="endee-stat-box">
                    <div class="stat-label">Vector Match Category</div>
                    <div class="stat-value" style="font-size:1.1rem; color:#a78bfa;">${rag.role_category}</div>
                    <div class="stat-label" style="margin-top:8px;">Similarity Index</div>
                    <div class="stat-value">${Math.round((rag.similarity_score || 0.9) * 100)}%</div>
                    <div class="stat-label" style="margin-top:8px;">Market Average Rate</div>
                    <div class="stat-value" style="color:#34d399;">$${rag.market_avg_rate || 45}/hr</div>
                </div>
                <div class="endee-risks-box">
                    <div style="font-size:0.88rem; font-weight:600; color:#f3f4f6; margin-bottom:8px;">Endee Vector RAG Analysis:</div>
                    <div style="font-size:0.85rem; color:#6ee7b7; margin-bottom:12px; font-weight:500;">${rag.rate_analysis || ''}</div>
                    <div style="font-size:0.82rem; font-weight:600; color:var(--text-muted); margin-bottom:6px;">Historical Vector Risk Database Matches:</div>
                    ${risksHtml}
                </div>
            `;
        }
    }

    // --- Job Listing URL Auto-Extractor Functions ---
    function initJobUrlExtractor() {
        if (!jobUrlInput || !extractJobBtn) return;

        // URL input listener to toggle clear button
        jobUrlInput.addEventListener('input', () => {
            clearUrlBtn.style.display = jobUrlInput.value.trim() ? 'block' : 'none';
        });

        // Clear button
        clearUrlBtn.addEventListener('click', () => {
            jobUrlInput.value = '';
            clearUrlBtn.style.display = 'none';
            jobUrlInput.focus();
        });

        // Enter key in URL input
        jobUrlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performJobExtraction(jobUrlInput.value.trim(), null);
            }
        });

        // Extract button click
        extractJobBtn.addEventListener('click', () => {
            const url = jobUrlInput.value.trim();
            if (!url) {
                jobUrlInput.focus();
                appendLog('[Job Extractor]: Please paste a job listing URL or use the sample links below.', 'warning');
                return;
            }
            performJobExtraction(url, null);
        });

        // Sample quick links chips
        const sampleChips = document.querySelectorAll('.sample-chip');
        sampleChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const url = chip.dataset.url;
                if (url) {
                    jobUrlInput.value = url;
                    clearUrlBtn.style.display = 'block';
                    performJobExtraction(url, null);
                }
            });
        });

        // Toggle raw text panel
        if (toggleRawTextBtn && rawTextPanel) {
            toggleRawTextBtn.addEventListener('click', () => {
                const isHidden = rawTextPanel.style.display === 'none';
                rawTextPanel.style.display = isHidden ? 'block' : 'none';
                if (isHidden && rawJobTextInput) rawJobTextInput.focus();
            });
        }

        // Cancel raw text panel
        if (cancelRawTextBtn && rawTextPanel) {
            cancelRawTextBtn.addEventListener('click', () => {
                rawTextPanel.style.display = 'none';
            });
        }

        // Extract from raw text button
        if (extractRawTextBtn && rawJobTextInput) {
            extractRawTextBtn.addEventListener('click', () => {
                const text = rawJobTextInput.value.trim();
                if (!text) {
                    appendLog('[Job Extractor]: Please paste raw job posting text before extracting.', 'warning');
                    return;
                }
                performJobExtraction(null, text);
            });
        }

        // Sync skills to worker profile button
        if (syncSkillsBtn) {
            syncSkillsBtn.addEventListener('click', syncSkillsToProfile);
        }
    }

    async function performJobExtraction(url, rawText) {
        if (!url && !rawText) return;

        // UI Loading State
        extractSpinner.style.display = 'inline-block';
        extractBtnText.textContent = 'Analyzing...';
        extractJobBtn.disabled = true;

        const targetLabel = url || 'pasted job text';
        appendLog(`[Job Extractor]: Fetching and analyzing listing from ${targetLabel}...`, 'agent');

        try {
            const response = await fetch(`${API_BASE_URL}/api/extract-job`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url || null, raw_text: rawText || null })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ detail: 'Extraction failed' }));
                throw new Error(errData.detail || `Server returned status ${response.status}`);
            }

            const data = await response.json();

            // Auto-populate form inputs
            jobTitleInput.value = data.title || '';
            companyNameInput.value = data.company || '';
            proposedRateInput.value = data.proposed_rate || 35;
            contractClausesInput.value = (data.contract_snippet || []).join('\n');

            // Trigger visual pulse animation on auto-filled fields
            [jobTitleInput, companyNameInput, proposedRateInput, contractClausesInput].forEach(el => {
                if (el) {
                    el.classList.remove('field-highlight');
                    void el.offsetWidth; // force DOM reflow
                    el.classList.add('field-highlight');
                }
            });

            // Store extracted skills for 1-click sync
            currentExtractedSkills = data.required_skills || [];

            // Render Extracted Preview Panel
            if (extractedPreviewPanel) {
                previewSummaryText.textContent = data.description_summary || 'Role details successfully extracted.';
                previewSalaryText.textContent = `$${data.proposed_rate}/hr (${data.salary_raw || 'Rate Estimated'})`;
                previewMethodTag.textContent = data.extraction_method || 'AI Extractor';

                if (previewSkillsList) {
                    previewSkillsList.innerHTML = currentExtractedSkills.map(skill =>
                        `<span class="skill-chip">${skill}</span>`
                    ).join('');
                }

                extractedPreviewPanel.style.display = 'block';
            }

            // Close raw text panel if open
            if (rawTextPanel) rawTextPanel.style.display = 'none';

            appendLog(
                `[Job Extractor]: Success! Auto-filled '${data.title}' at ${data.company}. ` +
                `Salary: $${data.proposed_rate}/hr. Extracted ${currentExtractedSkills.length} required skill(s) & contract clauses.`,
                'success'
            );

        } catch (err) {
            const errorMsg = (err.name === 'TypeError' || err.message === 'Failed to fetch')
                ? 'Cannot connect to backend server. Please verify that python server.py is running on http://127.0.0.1:8000.'
                : err.message;
            appendLog(`[Job Extractor Error]: ${errorMsg}`, 'warning');
        } finally {
            extractSpinner.style.display = 'none';
            extractBtnText.textContent = '✨ Search & Fill';
            extractJobBtn.disabled = false;
        }
    }

    function syncSkillsToProfile() {
        if (!currentExtractedSkills || currentExtractedSkills.length === 0) return;

        const currentSkills = workerSkillsInput.value.split(',').map(s => s.trim()).filter(Boolean);
        const lowerSet = new Set(currentSkills.map(s => s.toLowerCase()));

        let addedCount = 0;
        currentExtractedSkills.forEach(s => {
            if (!lowerSet.has(s.toLowerCase())) {
                currentSkills.push(s);
                lowerSet.add(s.toLowerCase());
                addedCount++;
            }
        });

        workerSkillsInput.value = currentSkills.join(', ');

        // Animate worker skills input
        workerSkillsInput.classList.remove('field-highlight');
        void workerSkillsInput.offsetWidth;
        workerSkillsInput.classList.add('field-highlight');

        if (addedCount > 0) {
            appendLog(`[Worker Profile]: Synchronized ${addedCount} new skill(s) from job listing into worker profile!`, 'success');
        } else {
            appendLog(`[Worker Profile]: Worker profile already contains all detected skills.`, 'system');
        }
    }

    function appendLog(message, type = 'system') {
        const div = document.createElement('div');
        div.className = `log-entry ${type}`;
        div.textContent = message;
        terminalLogs.appendChild(div);
        terminalLogs.scrollTop = terminalLogs.scrollHeight;
    }
});
