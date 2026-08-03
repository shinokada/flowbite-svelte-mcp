#!/usr/bin/env tsx
/**
 * Script to fetch and save LLM documentation files from flowbite-svelte.com
 *
 * This fetches:
 * - All documentation files from the /llm directory
 * - The llms.txt index file
 *
 * Run with: npm run copy:llm or tsx scripts/copyLlmData.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parseLlmsTxt, isValidFilePath } from '../src/lib/parser.js';
import { GITHUB_RAW_LLMS_TXT_URL, GITHUB_RAW_LLM_DIR_URL } from '../src/lib/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local destination
const DEST_LLM_DIR = path.resolve(__dirname, '../src/data/llm');

/**
 * Fetch llms.txt content from remote URL
 * @returns {Promise<string>} The raw content of llms.txt
 */
async function fetchLlmsTxtContent(): Promise<string> {
  const response = await fetch(GITHUB_RAW_LLMS_TXT_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch llms.txt from GitHub: ${response.statusText}`);
  }
  return response.text();
}

/**
 * Fetch a file from URL and save it locally
 * @param {string} relativePath - Relative path of the file to fetch
 * @returns {Promise<void>}
 */
async function fetchAndSaveFile(relativePath: string): Promise<void> {
  // Validate the file path for security
  if (!isValidFilePath(relativePath)) {
    throw new Error(`Invalid file path detected: ${relativePath}`);
  }

  const url = `${GITHUB_RAW_LLM_DIR_URL}/${relativePath}`;
  const destPath = path.join(DEST_LLM_DIR, relativePath);

  // Create directory if needed
  await fs.mkdir(path.dirname(destPath), { recursive: true });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const content = await response.text();
  await fs.writeFile(destPath, content, 'utf-8');
  console.log(`  ✓ Downloaded: ${relativePath}`);
}

/**
 * Main execution
 * @returns {Promise<void>}
 */
async function main() {
  try {
    console.log('🚀 Starting LLM data download from GitHub Raw (Bypassing Cloudflare)...\n');

    // Clean destination directory
    console.log('🧹 Cleaning destination directory...');
    try {
      await fs.rm(DEST_LLM_DIR, { recursive: true, force: true });
    } catch {
      // Directory might not exist, that's fine
    }
    await fs.mkdir(DEST_LLM_DIR, { recursive: true });

    // Fetch llms.txt content (single fetch)
    console.log('\n📄 Downloading llms.txt...');
    const llmsTxtContent = await fetchLlmsTxtContent();
    
    // Save llms.txt locally
    await fs.writeFile(path.join(DEST_LLM_DIR, 'llms.txt'), llmsTxtContent, 'utf-8');
    console.log('  ✓ Downloaded: llms.txt');

    // Parse llms.txt to get file list (no additional fetch)
    console.log('\n📋 Parsing file list from llms.txt...');
    const files = parseLlmsTxt(llmsTxtContent);
    console.log(`  Found ${files.length} files to download`);

    if (files.length === 0) {
      throw new Error("No files parsed. Check llms.txt content or parseLlmsTxt logic.");
    }

    // Validate all files before downloading
    const invalidFiles = files.filter(f => !isValidFilePath(f));
    if (invalidFiles.length > 0) {
      console.error('\n❌ Invalid file paths detected:');
      invalidFiles.forEach(f => console.error(`   - ${f}`));
      throw new Error('Security check failed: Invalid file paths found');
    }

    // Download all files in parallel
    console.log('\n📂 Downloading documentation files...');
    const downloadPromises = files.map(file => 
      fetchAndSaveFile(file).catch(e => {
        console.error(`  ❌ Error downloading ${file}: ${e.message}`);
      })
    );
    
    await Promise.all(downloadPromises);

    console.log('\n✅ Download completed successfully!');
    console.log(`   Files saved to: ${DEST_LLM_DIR}`);
    console.log(`   Total files: ${files.length + 1} (including llms.txt)`);
  } catch (error) {
    console.error('\n❌ Download failed:', error);
    process.exit(1);
  }
}

main();
