# Context Lens Chrome Extension

Context Lens is a Chrome browser extension that provides users with real-time, AI-driven contextual analysis of news articles. It uses the Gemini API with a user-provided key to identify key claims, provide broader context, and fact-check information directly on the page.

## Features

*   **In-Page Analysis:** Injects non-invasive icons (💡) next to key claims in an article.
*   **Rich Context Popovers:** Clicking an icon reveals a popover with a concise analysis, a Socratic question, or a fact-check.
*   **Detailed Popup View:** The extension popup provides a comprehensive executive summary and a detailed fact-check report for the current article.
*   **User-Controlled & Private:** Operates on a user-provided Gemini API key, ensuring user control over API usage. No data is sent to any third-party servers except the Google Gemini API.
*   **Multilingual:** Automatically detects the article's language and provides analysis in that same language.
*   **Broad Website Support:** Works on dozens of popular Israeli and international news sites.

## How to Use

1.  **Add your API Key:** After installing, the options page will open. Enter your Gemini API key here. You can access this page at any time from the extension's options.
2.  **Browse to a Supported Article:** Navigate to a news article on a supported site (e.g., BBC, Ynet, The New York Times).
3.  **Activate the Extension:** Click the Context Lens icon in your browser's toolbar to activate analysis for that page. The first time you use it on a new site (e.g., `nytimes.com`), Chrome will ask you to approve the permission. This one-time approval is required for each new site you use it on.
4.  **Look for the Icons:** Once activated, the script will run, and after a few moments, you will see 💡 icons appear next to certain sentences.
5.  **Get Context:** Click on an icon to view the inline analysis in a popover.
6.  **View the Full Report:** Click on the Context Lens icon in your browser's toolbar again to open the popup, which contains a full summary and fact-check report.

## For Developers

This project is built with standard web technologies (HTML, CSS, JavaScript) and follows the Chrome Extension Manifest V3 standard.

*   For instructions on how to load the extension for development, run the build script, and deploy it, see [**GUIDELINES.md**](./GUIDELINES.md).
*   For a detailed breakdown of the technical architecture, data flow, and design choices made during development, see [**SPEC.md**](./SPEC.md).
