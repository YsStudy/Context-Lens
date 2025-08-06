document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('save-btn');
    const statusMessage = document.getElementById('status-message');

    // Load the saved API key and display it in the input field.
    chrome.storage.sync.get(['apiKey'], (result) => {
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }
    });

    // Save the API key when the save button is clicked.
    saveBtn.addEventListener('click', () => {
        const newKey = apiKeyInput.value.trim();

        chrome.storage.sync.set({ apiKey: newKey }, () => {
            if (newKey) {
                statusMessage.textContent = 'API Key saved successfully!';
            } else {
                statusMessage.textContent = 'API Key removed.';
            }
            // Clear the message after 3 seconds
            setTimeout(() => {
                statusMessage.textContent = '';
            }, 3000);
        });
    });
});
