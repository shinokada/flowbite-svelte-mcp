/**
 * @fileoverview Main UriTemplateMatcher class
 */

import { match_uri, parse_template } from './parser.js';

/**
 * @typedef {import('./types.js').MatchResult} MatchResult
 * @typedef {import('./types.js').ParsedTemplate} ParsedTemplate
 */

/**
 * URI Template Matcher class for registering and matching URI templates
 */
export class UriTemplateMatcher {
	/**
	 * Create a new UriTemplateMatcher instance
	 */
	constructor() {
		/** @type {ParsedTemplate[]} */
		this.templates = [];
	}

	/**
	 * Add a URI template to the matcher
	 * @param {string} template - The URI template string to add
	 * @throws {Error} If template is invalid
	 */
	add(template) {
		if (typeof template !== 'string') {
			throw new Error('Template must be a string');
		}

		// Empty template is valid - matches empty string
		// But whitespace-only templates are invalid
		if (template !== '' && template.trim() === '') {
			throw new Error('Template cannot be empty');
		}

		try {
			const parsed = parse_template(template);
			this.templates.push(parsed);
		} catch (error) {
			throw new Error(
				`Invalid template: ${template} - ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Match a URI against all registered templates
	 * @param {string} uri - The URI to match
	 * @returns {MatchResult | null} Match result or null if no match found
	 * @throws {Error} If URI is invalid
	 */
	match(uri) {
		if (typeof uri !== 'string') {
			throw new Error('URI must be a string');
		}

		for (const template of this.templates) {
			const params = match_uri(uri, template);
			if (params !== null) {
				return {
					template: template.template,
					params,
				};
			}
		}

		return null;
	}

	/**
	 * Clear all registered templates
	 */
	clear() {
		this.templates = [];
	}

	/**
	 * Get all registered template strings
	 * @returns {string[]} Array of template strings
	 */
	all() {
		return this.templates.map((t) => t.template);
	}
}
