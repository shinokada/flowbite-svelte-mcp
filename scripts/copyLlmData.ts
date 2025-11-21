#!/usr/bin/env tsx
/**
 * Script to copy LLM documentation files from flowbite-svelte to flowbite-svelte-mcp
 *
 * This copies:
 * - All files/directories from flowbite-svelte/static/llm
 * - The llms.txt index file
 *
 * Run with: npm run copy:llm or tsx scripts/copyLlmData.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths - using absolute paths for clarity and robustness
const SOURCE_LLM_DIR = '/Users/shinichiokada/Flowbite/flowbite-svelte/static/llm';
const SOURCE_LLMS_TXT = '/Users/shinichiokada/Flowbite/flowbite-svelte/static/llms.txt';
const DEST_LLM_DIR = path.resolve(__dirname, '../src/data/llm');

/**
 * Recursively copy directory contents
 * @param {string} src - Source directory path
 * @param {string} dest - Destination directory path
 */
async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
      console.log(`  ✓ Copied: ${entry.name}`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting LLM data migration...\n');

    // Check if source directories exist
    try {
      await fs.access(SOURCE_LLM_DIR);
      await fs.access(SOURCE_LLMS_TXT);
    } catch {
      console.error('❌ Error: Source files not found!');
      console.error(`   Expected paths:`);
      console.error(`   - ${SOURCE_LLM_DIR}`);
      console.error(`   - ${SOURCE_LLMS_TXT}`);
      process.exit(1);
    }

    // Copy LLM directory
    console.log('📂 Copying LLM directory...');
    await copyDir(SOURCE_LLM_DIR, DEST_LLM_DIR);

    // Copy llms.txt
    console.log('\n📄 Copying llms.txt...');
    await fs.copyFile(SOURCE_LLMS_TXT, path.join(DEST_LLM_DIR, 'llms.txt'));
    console.log('  ✓ Copied: llms.txt');

    console.log('\n✅ Migration completed successfully!');
    console.log(`   Files copied to: ${DEST_LLM_DIR}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
