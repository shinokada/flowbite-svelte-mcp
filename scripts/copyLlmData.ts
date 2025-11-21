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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Remote URLs
const BASE_URL = 'https://flowbite-svelte.com';
const LLMS_TXT_URL = `${BASE_URL}/llms.txt`;
const LLM_DIR_URL = `${BASE_URL}/llm`;

// Local destination
const DEST_LLM_DIR = path.resolve(__dirname, '../src/data/llm');

/**
 * Fetch and parse llms.txt to get list of documentation files
 */
async function fetchLlmsTxt(): Promise<string[]> {
  const response = await fetch(LLMS_TXT_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch llms.txt: ${response.statusText}`);
  }
  const content = await response.text();
  
  // Parse llms.txt to extract file paths
  // Format is typically: # Comments and https://domain.com/path/to/file.md
  const lines = content.split('\n');
  const files: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Extract path from URL
    if (trimmed.startsWith(BASE_URL)) {
      const urlPath = trimmed.replace(BASE_URL, '');
      if (urlPath.startsWith('/llm/')) {
        files.push(urlPath.replace('/llm/', ''));
      }
    }
  }
  
  return files;
}

/**
 * Fetch a file from URL and save it locally
 */
async function fetchAndSaveFile(relativePath: string): Promise<void> {
  const url = `${LLM_DIR_URL}/${relativePath}`;
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
 */
async function main() {
  try {
    console.log('🚀 Starting LLM data download from flowbite-svelte.com...\n');

    // Clean destination directory
    console.log('🧹 Cleaning destination directory...');
    try {
      await fs.rm(DEST_LLM_DIR, { recursive: true, force: true });
    } catch {
      // Directory might not exist, that's fine
    }
    await fs.mkdir(DEST_LLM_DIR, { recursive: true });

    // Fetch and save llms.txt
    console.log('\n📄 Downloading llms.txt...');
    const llmsTxtResponse = await fetch(LLMS_TXT_URL);
    if (!llmsTxtResponse.ok) {
      throw new Error(`Failed to fetch llms.txt: ${llmsTxtResponse.statusText}`);
    }
    const llmsTxtContent = await llmsTxtResponse.text();
    await fs.writeFile(path.join(DEST_LLM_DIR, 'llms.txt'), llmsTxtContent, 'utf-8');
    console.log('  ✓ Downloaded: llms.txt');

    // Parse llms.txt to get file list
    console.log('\n📋 Parsing file list from llms.txt...');
    const files = await fetchLlmsTxt();
    console.log(`  Found ${files.length} files to download`);

    // Download all files
    console.log('\n📂 Downloading documentation files...');
    for (const file of files) {
      await fetchAndSaveFile(file);
    }

    console.log('\n✅ Download completed successfully!');
    console.log(`   Files saved to: ${DEST_LLM_DIR}`);
    console.log(`   Total files: ${files.length + 1} (including llms.txt)`);
  } catch (error) {
    console.error('❌ Download failed:', error);
    process.exit(1);
  }
}

main();
