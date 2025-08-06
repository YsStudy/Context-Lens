document.addEventListener('DOMContentLoaded', async () => {
    // --- Get DOM Elements ---
    const views = {
        loading: document.getElementById('loading-view'),
        noKey: document.getElementById('no-key-view'),
        notAnalyzed: document.getElementById('not-analyzed-view'),
        analysis: document.getElementById('analysis-view'),
    };
    const optionsBtn = document.getElementById('options-btn');
    const tabBar = document.querySelector('.tab-bar');
    const tabContent = document.getElementById('tab-content');
    const summaryContent = document.getElementById('executive-summary-content');
    const factCheckContent = document.getElementById('fact-check-report-content');

    // --- Helper to switch views ---
    const showView = (viewName) => {
        Object.values(views).forEach(view => view.style.display = 'none');
        views[viewName].style.display = 'block';
    };

    // --- Main Logic ---
    showView('loading');

    // 1. Check for API Key
    const syncData = await chrome.storage.sync.get(['apiKey']);
    if (!syncData.apiKey) {
        showView('noKey');
        optionsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
        return;
    }

    // 2. Get Active Tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    if (!currentTab || !currentTab.url) {
        showView('notAnalyzed');
        return;
    }
    const url = currentTab.url;

    // 3. Check for Analysis in local storage
    const localData = await chrome.storage.local.get([url]);
    const analysis = localData[url];

    if (!analysis) {
        showView('notAnalyzed');
    } else {
        renderPopupAnalysis(analysis);
        showView('analysis');
    }

    // --- Rendering and Event Handling ---
    function renderPopupAnalysis(data) {
        renderSummary(data.executiveSummary);
        renderFactCheck(data.factCheckReport);
        setupTabs();
    }

    function renderSummary(summary) {
        if (!summary) {
            summaryContent.innerHTML = '<p>No summary available.</p>';
            return;
        }
        let html = '<h3>Key Claims</h3><ul>';
        summary.keyClaims.forEach(claim => {
            html += `<li>${claim}</li>`;
        });
        html += '</ul>';

        html += '<h3>Broader Context</h3>';
        summary.broaderContextIn3Points.forEach(point => {
            html += `<p><strong>${point.keyword}:</strong> ${point.text}</p>`;
        });

        html += `<h3>Bottom Line</h3><p>${summary.bottomLine}</p>`;
        summaryContent.innerHTML = html;
    }

    function renderFactCheck(report) {
        if (!report || report.length === 0) {
            factCheckContent.innerHTML = '<p>No fact-check report available.</p>';
            return;
        }

        let html = '';
        report.forEach(item => {
            html += `
                <div class="fact-check-item">
                    <p class="claim"><strong>Claim:</strong> ${item.claim}</p>
                    <p class="status"><strong>Status:</strong> <span class="status-${item.status.toLowerCase().replace(' ', '-')}">${item.status}</span></p>
                    <p class="explanation">${item.explanation}</p>
                    <p class="source"><strong>Source:</strong> <a href="${item.source.url}" target="_blank">${item.source.name}</a></p>
                </div>
            `;
        });
        factCheckContent.innerHTML = html;
    }

    function setupTabs() {
        tabBar.addEventListener('click', (e) => {
            if (e.target.matches('.tab-btn')) {
                const tabId = e.target.dataset.tab;

                // Update button active state
                tabBar.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                // Update panel active state
                tabContent.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
            }
        });
    }
});
