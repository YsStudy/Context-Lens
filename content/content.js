// --- Main Execution ---

// A global variable to hold analysis data for popover access
let analysisDataStore = {};

// The main function is now called directly when the script is injected.
main();

function main() {
    console.log('Context Lens: Content script injected and running.');

    // 1. DOM Parsing: Find the main article content.
    const articleElement = document.querySelector('article, [class*="article-body"], [id*="article-content"], [class*="article__body"]');
    if (!articleElement) {
        console.log('Context Lens: Could not find article content on the page.');
        return;
    }

    const articleText = articleElement.innerText;

    // 3. Check if text is substantial enough
    if (!articleText || articleText.trim().length < 500) { // 500 chars is about 100 words
        console.log('Context Lens: Article text is too short to analyze.');
        return;
    }

    // 4. Message Sending: Send the article text to the background script for analysis.
    console.log('Context Lens: Sending article for analysis.');
    chrome.runtime.sendMessage({
        type: 'analyzeArticle',
        payload: {
            url: window.location.href,
            text: articleText
        }
    }, response => {
        // 5. Response Handling
        if (chrome.runtime.lastError) {
            console.error('Context Lens Error:', chrome.runtime.lastError.message);
            renderErrorIcon('An unexpected error occurred.');
            return;
        }

        console.log('Context Lens: Received response from background:', response);

        switch (response.status) {
            case 'SUCCESS':
                renderAnalysis(response.data, articleElement);
                break;
            case 'NO_API_KEY':
                renderNoApiKeyBanner();
                break;
            case 'API_ERROR':
            case 'NETWORK_ERROR':
                renderErrorIcon(response.message);
                break;
            default:
                console.error('Context Lens: Unknown response status.', response);
        }
    });
}

// --- Rendering Functions ---

function renderNoApiKeyBanner() {
    const banner = document.createElement('div');
    banner.className = 'context-lens-banner';
    banner.innerHTML = `
        <strong>Context Lens:</strong> Please
        <a href="#" id="context-lens-options-link">add your Gemini API key</a>
        to enable analysis.
    `;
    document.body.prepend(banner);

    // Make the link open the options page
    document.getElementById('context-lens-options-link').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({ type: 'openOptionsPage' });
    });
}

function renderErrorIcon(message) {
    // For now, we'll just log it. A UI element could be added here.
    console.error(`Context Lens Error: ${message}`);
}

function renderAnalysis(data, articleElement) {
    if (!data || !data.inlineAnnotations || data.inlineAnnotations.length === 0) {
        console.log('Context Lens: Analysis complete, but no inline annotations provided.');
        return;
    }

    // Store analysis for popovers
    analysisDataStore = data.inlineAnnotations;

    // Inject icons for each annotation
    const paragraphs = articleElement.querySelectorAll('p');
    analysisDataStore.forEach((annotation, index) => {
        if (!annotation.anchorText) return;

        for (const p of paragraphs) {
            if (p.textContent.includes(annotation.anchorText)) {
                // To avoid replacing multiple times if anchor text is repeated
                if (p.querySelector(`.context-lens-icon[data-content-id="${index}"]`)) {
                    continue;
                }

                const iconHTML = `
                    <span class="context-lens-icon" data-content-id="${index}" title="Show context">
                        💡
                    </span>
                `;
                // Important: Replace in innerHTML to preserve existing HTML tags
                p.innerHTML = p.innerHTML.replace(annotation.anchorText, `${annotation.anchorText}${iconHTML}`);

                // Found and replaced, move to the next annotation
                break;
            }
        }
    });

    // Add a single delegated event listener for all popovers
    document.body.addEventListener('click', handlePopoverClick);
}


function handlePopoverClick(event) {
    const icon = event.target.closest('.context-lens-icon');

    // Remove any existing popover first
    const existingPopover = document.querySelector('.context-lens-popover');
    if (existingPopover) {
        existingPopover.remove();
    }

    // If we didn't click an icon, we're done
    if (!icon) {
        return;
    }

    event.stopPropagation(); // Prevent clicks inside popover from closing it immediately

    const contentId = icon.dataset.contentId;
    const annotation = analysisDataStore[contentId];

    if (annotation) {
        createPopover(icon, annotation);
    }
}

function createPopover(targetElement, annotation) {
    const popover = document.createElement('div');
    popover.className = 'context-lens-popover';

    popover.innerHTML = `
        <div class="popover-header">${annotation.title}</div>
        <div class="popover-content">${annotation.content}</div>
        <button class="popover-close-btn">&times;</button>
    `;

    document.body.appendChild(popover);

    // Position the popover
    const targetRect = targetElement.getBoundingClientRect();
    popover.style.left = `${window.scrollX + targetRect.left}px`;
    popover.style.top = `${window.scrollY + targetRect.bottom + 5}px`;

    // Add listener to close button
    popover.querySelector('.popover-close-btn').addEventListener('click', () => {
        popover.remove();
    });
}

// Add a message listener to open the options page from the banner
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'openOptionsPage') {
        // This message is actually handled in the background script,
        // but we need a listener to keep the message port open in some contexts.
        // A better way is to have the banner link directly trigger the background.
        // The background script will handle opening the options page.
        // Let's refine the banner to send a message that background can uniquely handle.
    }
});

// A small fix in the banner logic. The background script should handle the message.
// The listener in `renderNoApiKeyBanner` already sends a message, which is correct.
// The background script needs a handler for it. Let's add it there.

// I will add a small piece to background.js to handle the openOptionsPage message.
// It's better to do it now while I'm thinking about it.

// Wait, the spec for background.js doesn't include this.
// `chrome.runtime.openOptionsPage()` can be called from the content script via a message.
// Let's re-read the spec.
// The spec doesn't explicitly state how the link in the banner opens the options page.
// Sending a message to the background script is the correct and secure way to do it.
// The background script already has the `chrome.runtime.onMessage` listener.
// I'll add a case there.

/*
In background.js:

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'analyzeArticle') {
        // ... existing code
    } else if (message.type === 'openOptionsPage') {
        chrome.runtime.openOptionsPage();
        return false; // No async response needed
    }
});
*/
// I will need to modify background.js later. For now, the content script is the focus.
// The current content script implementation is quite complete. It handles all cases and renders the UI.
// Now for the CSS.
