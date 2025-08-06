# Context Lens Extension: Build and Deployment Guidelines

This document provides instructions on how to set up, build, and deploy the Context Lens Chrome extension.

## 1. Loading for Development and Testing

During development, you can load the extension directly into your Chrome browser from the source files. This allows you to test changes instantly.

1.  **Open Chrome Extensions Page:**
    *   Navigate to `chrome://extensions` in your Chrome browser.

2.  **Enable Developer Mode:**
    *   Ensure the "Developer mode" toggle at the top-right of the page is switched on.

3.  **Load the Extension:**
    *   Click the **"Load unpacked"** button.
    *   In the file selection dialog, navigate to the root directory of this project (the one containing `manifest.json`).
    *   Click "Select Folder".

The extension should now appear in your list of extensions and be active in your browser. You can make changes to the code, and they will be reflected after you reload the extension from the `chrome://extensions` page.

## 2. Building for Production

To distribute the extension, such as by uploading it to the Chrome Web Store, you need to package it into a `.zip` file. A build script is provided to automate this process.

1.  **Make the Script Executable:**
    *   If you haven't already, open your terminal and run the following command from the project root to make the build script executable:
        ```sh
        chmod +x build.sh
        ```

2.  **Run the Build Script:**
    *   Execute the script from your terminal:
        ```sh
        ./build.sh
        ```

This script will create a file named `context-lens-build.zip` in the project's root directory. This is the file you will use for distribution.

## 3. Deployment to the Chrome Web Store

1.  **Go to the Developer Dashboard:**
    *   Log in to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).

2.  **Upload the Package:**
    *   Click "Add new item".
    *   Upload the `context-lens-build.zip` file you created.

3.  **Complete the Store Listing:**
    *   Fill out all the required information for the store listing, such as the description, icons, promotional images, and privacy policy.

4.  **Submit for Review:**
    *   Once everything is filled out, submit the extension for review by Google.

## 4. Important Note on Permissions

When you update the extension with **new domains** in the `host_permissions` section of the `manifest.json` file, please be aware of the following:

*   **Existing users will be prompted to accept the new permissions.** The extension will be automatically disabled for them until they manually approve the update. This is a security measure enforced by Chrome to ensure users are aware of what new websites the extension can access.
*   For a future version, this behavior could be avoided by refactoring the extension to use the `optional_permissions` API, which would require a different user workflow (e.g., clicking to activate the extension on a new site).
