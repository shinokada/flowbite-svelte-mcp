/**
 * Shared constants for the Flowbite-Svelte MCP server
 */

/**
 * Base URL for Flowbite-Svelte documentation
 */
export const BASE_URL = 'https://flowbite-svelte.com';

/**
 * URL for llms.txt index file
 */
export const LLMS_TXT_URL = `${BASE_URL}/llms.txt`;

/**
 * Base URL for LLM documentation directory
 */
export const LLM_DIR_URL = `${BASE_URL}/llm`;

/**
 * GitHub Raw URLs to bypass WAF protection during automated downloads.
 * Used by the copy:llm script to fetch documentation directly from the source.
 */
export const GITHUB_RAW_LLMS_TXT_URL = 'https://raw.githubusercontent.com/themesberg/flowbite-svelte/main/static/llms.txt';
export const GITHUB_RAW_LLM_DIR_URL = 'https://raw.githubusercontent.com/themesberg/flowbite-svelte/main/src/routes/llm';
