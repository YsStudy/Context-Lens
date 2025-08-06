#!/bin/bash

# This script packages the Chrome extension into a zip file for distribution.

# --- Configuration ---
BUILD_DIR="build"
ZIP_FILE="context-lens-build.zip"
SOURCE_FILES=(
  "manifest.json"
  "background.js"
  "README.md"
  "content/"
  "options/"
  "popup/"
  "icons/"
  "assets/"
)

# --- Main Script ---

# 1. Clean up previous builds
echo "Cleaning up old build files..."
rm -rf "$BUILD_DIR"
rm -f "$ZIP_FILE"

# 2. Create build directory
echo "Creating build directory: $BUILD_DIR"
mkdir -p "$BUILD_DIR"

# 3. Copy source files
echo "Copying extension files to build directory..."
for file in "${SOURCE_FILES[@]}"; do
  cp -r "$file" "$BUILD_DIR/"
done

# 4. Create the zip archive
echo "Creating zip file: $ZIP_FILE"
(cd "$BUILD_DIR" && zip -r "../$ZIP_FILE" .)

# 5. Clean up the build directory
echo "Cleaning up build directory..."
rm -rf "$BUILD_DIR"

# --- Done ---
echo ""
echo "✅ Success! Extension packaged into $ZIP_FILE"
echo "You can now upload this file to the Chrome Web Store."
