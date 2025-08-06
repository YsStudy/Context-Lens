// --- Onboarding & Initial Setup ---

chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === 'install') {
        chrome.runtime.openOptionsPage();
    }
});

// --- User-Invoked Action ---

// When the user clicks the extension icon, this listener is triggered.
chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.url) {
        console.log('Cannot run on this page (no URL).');
        return;
    }

    const url = new URL(tab.url);
    const origin = `https://${url.hostname}/*`; // e.g., https://www.ynet.co.il/*

    // Check if the origin is defined in our optional permissions
    const manifest = chrome.runtime.getManifest();
    const isSupported = manifest.optional_host_permissions.some(permission => {
        const permissionOrigin = new URL(permission).hostname.replace('*.', '');
        return url.hostname.endsWith(permissionOrigin);
    });

    if (!isSupported) {
        console.log(`Context Lens: ${url.hostname} is not a supported site.`);
        // Optionally, we could open the popup with an error message here.
        // For now, we do nothing.
        return;
    }

    // Check if we already have permission for this site.
    const hasPermission = await chrome.permissions.contains({ origins: [origin] });

    if (hasPermission) {
        console.log('Already have permission. Injecting script.');
        injectScripts(tab.id);
        return;
    }

    // If we don't have permission, request it.
    chrome.permissions.request({ origins: [origin] }, (granted) => {
        if (granted) {
            console.log('Permission granted. Injecting script.');
            injectScripts(tab.id);
        } else {
            console.log('Permission denied.');
        }
    });
});

// Helper function to inject the content script and its CSS
function injectScripts(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content/content.js'],
    });
    chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ['content/content.css'],
    });
}


// --- API & Analysis Logic (Message-based) ---

// This part remains the same, as it's triggered by the content script after injection.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'analyzeArticle') {
        handleArticleAnalysis(message.payload)
            .then(sendResponse)
            .catch(error => {
                console.error('Context Lens Error:', error);
                sendResponse({ status: 'API_ERROR', message: error.message });
            });
        return true; // Indicates that the response is sent asynchronously
    } else if (message.type === 'openOptionsPage') {
        chrome.runtime.openOptionsPage();
        return false; // No response needed
    }
});

async function handleArticleAnalysis(payload) {
    const { url, text } = payload;

    const syncData = await chrome.storage.sync.get(['apiKey']);
    const apiKey = syncData.apiKey;
    if (!apiKey) {
        return { status: 'NO_API_KEY' };
    }

    const localData = await chrome.storage.local.get([url]);
    if (localData[url]) {
        return { status: 'SUCCESS', data: localData[url] };
    }

    console.log('Calling Gemini API for:', url);
    const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent';

    const requestBody = {
        contents: [{
            parts: [{
                text: `${MASTER_PROMPT}\n\n\`\`\`\n${text}\n\`\`\``
            }]
        }],
        generationConfig: {
            responseMimeType: "application/json",
        }
    };

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`API request failed with status ${response.status}: ${errorBody.error?.message || 'Unknown error'}`);
        }

        const responseData = await response.json();
        const jsonText = responseData.candidates[0].content.parts[0].text;
        const analysisData = JSON.parse(jsonText);

        await chrome.storage.local.set({ [url]: analysisData });

        return { status: 'SUCCESS', data: analysisData };

    } catch (error) {
        console.error('Fetch/API Error:', error);
        if (error.message.includes('API request failed')) {
            return { status: 'API_ERROR', message: error.message };
        }
        return { status: 'NETWORK_ERROR', message: 'A network error occurred.' };
    }
}

const MASTER_PROMPT = `
### **Master Prompt: Context Lens (Version 8.0 - JSON Output)**

**[LANGUAGE]**
First, detect the primary language of the **[ARTICLE FOR ANALYSIS]** (e.g., English, Hebrew, Arabic). Your entire JSON response, including all text in the `executiveSummary`, `factCheckReport`, and `inlineAnnotations` objects, **MUST** be in that same detected language. All field names in the JSON schema must remain in English as specified.

**[ROLE & GOAL]**

You are **Context Lens AI**, a sophisticated engine for media analysis and fact-checking. Your purpose is to receive an article's text and return a single, valid **JSON object** containing a multi-layered analysis. This analysis must include an executive summary, a detailed fact-check report, and a list of specific, in-line annotations (fact-checks, Socratic questions, and frame analysis) anchored to specific text from the original article. The tone must be neutral, academic, and empowering for the reader.

**[RESEARCH METHODOLOGY]**

Analyze the key claims in the provided article. For each major claim, perform targeted searches to gather context, counter-perspectives, and verifiable facts from a spectrum of reliable sources. Prioritize:

1.  Major international wire services (e.g., Reuters, AP).
2.  Official statements from all involved parties (e.g., UN bodies, COGAT, Palestinian MoH).
3.  Data from reputable NGOs and academic reports.

**[OUTPUT INSTRUCTIONS]**

Your entire response **MUST** be a single, valid JSON object and nothing else. Adhere strictly to the schema below.

**JSON Schema:**

\`\`\`json
{
  "executiveSummary": {
    "keyClaims": ["string"],
    "broaderContextIn3Points": [
      {"keyword": "string", "text": "string"}
    ],
    "bottomLine": "string"
  },
  "factCheckReport": [
    {
      "claim": "string",
      "status": "string (e.g., 'Confirmed', 'Contradicted', 'Lacks Context')",
      "explanation": "string",
      "source": { "name": "string", "url": "string" }
    }
  ],
  "inlineAnnotations": [
    {
      "anchorText": "string",
      "type": "string ('fact-check', 'socratic-question', 'frame-analysis')",
      "title": "string (e.g., 'בדיקת עובדות', 'שאלה למחשבה')",
      "content": "string (HTML-formatted text for the popover)"
    }
  ]
}
\`\`\`

**Instructions for Populating the JSON:**

1.  **\`executiveSummary\`**: Fill this with the concise, three-part summary as defined in our previous prompts.
2.  **\`factCheckReport\`**: Create a comprehensive list of all major verifiable claims in the article and the results of your fact-checking. This will populate the "Fact-Check" tab in the extension's main UI.
3.  **\`inlineAnnotations\`**: This is the most critical part. This array powers the in-page popups.
      * **\`anchorText\`**: Must be an **exact quote** from the original article text. This is how the content script will find where to place the icon.
      * **\`type\`**: Assign one of the three types based on your analysis.
      * **\`title\`**: A short, bolded title for the popover.
      * **\`content\`**: The text to be displayed inside the popover. Generate this content based on the following rules:
          * If \`type\` is **'fact-check'**: The content should be a direct statement of the claim, the finding, and the source. (e.g., \`<b>טענה:</b> 'אלף משאיות...'<br><b>בדיקה:</b> הטענה נכונה חלקית. קיימות משאיות אך הסיבה לעיכוב שנויה במחלוקת.<br><b>מקור:</b> דוח OCHA\`).
          * If \`type\` is **'socratic-question'**: Identify an underlying assumption in the \`anchorText\`. The content must be a neutral, open-ended question that encourages the reader to consider alternative explanations. (e.g., \`<b>שאלה למחשבה:</b> הכתבה מניחה שהמניע הוא פוליטי. אילו סיבות לוגיסטיות או ביטחוניות אחרות יכולות להסביר את המצב המתואר?\`).
          * If \`type\` is **'frame-analysis'**: Identify the narrative frame being used. The content should explain this frame to the user. (e.g., \`<b>ניתוח מסגור:</b> משפט זה ממסגר את הסכסוך כמאבק בין 'טובים' ל'רעים', בעוד שמקורות אחרים מתארים אותו כסכסוך מורכב עם אינטרסים מרובים.\`).

**[CRITICAL RULES]**

  * Adhere strictly to the JSON schema. Do not output any text before or after the JSON object.
  * Maintain a calm, academic, and detached tone in all generated content.
  * Use neutral, objective language.
  * Attribute all external information to its specific source.
  * Empower the reader by providing the raw materials for critical thinking.

-----

**[ARTICLE FOR ANALYSIS]**
`;
