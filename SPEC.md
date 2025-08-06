# Technical Specification & Design Choices: Context Lens v1.0

This document outlines the technical architecture of the Context Lens Chrome extension and explains the key design choices made during its development.

## 1. Overview

Context Lens is a Chrome extension that provides AI-powered contextual analysis of news articles. It is built using standard web technologies (JavaScript, HTML, CSS) and adheres to the **Manifest V3** standard for Chrome extensions. The core principle is to be non-invasive while providing powerful, on-demand context to the reader.

## 2. Architecture: Manifest V3

The extension is built on the Manifest V3 platform, which is the modern standard for Chrome extensions. This choice dictates the overall architecture:

*   **Service Worker (`background.js`):** Manifest V3 replaces persistent background pages with service workers. This is a more memory-efficient approach, as the service worker only runs when needed (e.g., to respond to an event like a message from a content script). All core logic, including API calls and cache management, resides here.
*   **Decoupled Scripts:** The architecture separates concerns into a service worker for logic, content scripts for page interaction, and standard HTML/JS/CSS for UI pages (popup and options). This makes the extension more modular and maintainable.

## 3. File & Directory Structure

The directory structure is organized by feature/component to keep related files together:

```
/context-lens
|-- manifest.json         # Core configuration
|-- background.js         # Main service worker
|-- content/              # Scripts injected into web pages
|-- options/              # Options page for API key
|-- popup/                # Main UI popup
|-- icons/                # Extension icons
|-- assets/               # UI assets like SVGs
|-- GUIDELINES.md         # Developer guidelines
|-- SPEC.md               # This file
|-- build.sh              # Packaging script
```
This structure makes it easy to locate files related to a specific part of the extension.

## 4. State Management

The extension uses two different storage mechanisms for specific reasons:

*   **`chrome.storage.sync`:** The user's Gemini API key is stored here.
    *   **Reasoning:** `sync` storage is automatically synchronized across all browsers where the user is logged into their Chrome profile. This provides a seamless experience, as the user only needs to enter their API key once. The data limit is lower, but it is more than sufficient for a single API key.
*   **`chrome.storage.local`:** Caching of analysis results is done here.
    *   **Reasoning:** `local` storage offers a much larger capacity (several megabytes) compared to `sync`. Since analysis JSON can be large, this is the appropriate choice. This data is specific to the device and does not need to be synced across browsers, which would be inefficient. The article URL serves as the cache key.

## 5. Core Components & Data Flow

1.  **Content Script (`content.js`):**
    *   **Activation:** The script first checks if `window.location.host` matches a predefined list of supported news sites. This is a secondary check, as `host_permissions` in the manifest is the primary gatekeeper.
    *   **DOM Interaction:** It uses a robust but generic query selector (`article, [class*="article-body"]`) to find the main content. This is designed to work across many different site layouts without needing custom code for each one.
    *   **UI Injection:** To avoid breaking website functionality, the script does not simply overwrite `innerHTML`. It finds text within paragraphs (`<p>`) and appends a `<span>` for the icon. Event handling for the popovers is delegated from the `document.body` to avoid attaching a listener to every single icon, which is much more performant.

2.  **Service Worker (`background.js`):**
    *   **User-Invoked Logic:** The extension is activated when the user clicks the action icon (toolbar icon). An `onClicked` listener in the service worker manages the core workflow.
    *   **Permissions on Demand:** When activated on a new site, the service worker uses the `chrome.permissions` API to request access for only that specific host. This avoids requesting broad permissions at install time and prevents the extension from being disabled for existing users when new sites are added.
    *   **Programmatic Injection:** Once permission is granted, the service worker uses the `chrome.scripting` API to programmatically inject `content.js` and `content.css` into the active tab.
    *   **Message-Based Analysis:** The `onMessage` listener still exists to handle the `analyzeArticle` message from the now-injected content script. The data pipeline within this listener (API key check, cache check, API call) remains the same.

3.  **Popup (`popup.js`):**
    *   **State-Driven UI:** The popup is designed to handle multiple states: loading, no API key, page not analyzed, and analysis found. The HTML contains separate `div` containers for each state, and the JavaScript's primary job is to show/hide the correct one based on data retrieved from `chrome.storage`. This makes the UI logic clean and predictable.

## 6. API Interaction (Gemini)

*   **Prompt Engineering:** The `MASTER_PROMPT` is the heart of the AI functionality. It is engineered to request a specific, structured JSON output. This is crucial for reliability, as it allows the extension to parse the response predictably.
*   **Multilingual Support:** A `[LANGUAGE]` directive was added to the prompt, instructing the AI to detect the source language and respond accordingly. This makes the extension more user-friendly on non-English sites.
*   **API Key Security:** The API key is sent in the `x-goog-api-key` HTTP header, which is a more secure practice than sending it as a URL query parameter.

## 7. Known Issues and Future Improvements

*   **Anchor Text Matching:** The current method of finding `anchorText` in paragraphs is robust but could fail if the text is split across multiple HTML tags (e.g., `This is <b>some</b> text`).
    *   **Future Improvement:** A more advanced implementation could walk the DOM tree node by node to find and replace text segments without being affected by child elements. This would be significantly more complex but also more accurate.
