/**
 * Type definitions for URI template matcher library
 */

/**
 * Template expression with variable name and modifiers
 */
export interface TemplateExpression {
	/** Variable name */
	name: string;
	/** Prefix length modifier (e.g., :3) */
	prefix?: number;
	/** Whether to explode arrays/objects */
	explode: boolean;
}

/**
 * Literal part of a template
 */
export interface LiteralPart {
	/** Part type */
	type: 'literal';
	/** Literal text value */
	value: string;
}

/**
 * Expression part of a template
 */
export interface ExpressionPart {
	/** Part type */
	type: 'expression';
	/** Array of variable expressions */
	expressions: TemplateExpression[];
	/** RFC 6570 operator (+, #, ., /, ;, ?, &) */
	operator?: string;
}

/**
 * Union type for template parts
 */
export type TemplatePart = LiteralPart | ExpressionPart;

/**
 * Parsed template representation
 */
export interface ParsedTemplate {
	/** Original template string */
	template: string;
	/** Parsed template parts */
	parts: TemplatePart[];
}

/**
 * Match result containing template and extracted parameters
 */
export interface MatchResult {
	/** Matched template string */
	template: string;
	/** Extracted parameters */
	params: Record<string, string | string[]>;
}

/**
 * URI Template Matcher class for registering and matching URI templates
 */
export declare class UriTemplateMatcher {
	/**
	 * Create a new UriTemplateMatcher instance
	 */
	constructor();

	/**
	 * Add a URI template to the matcher
	 * @param template - The URI template string to add
	 * @throws {Error} If template is invalid
	 */
	add(template: string): void;

	/**
	 * Match a URI against all registered templates
	 * @param uri - The URI to match
	 * @returns Match result or null if no match found
	 * @throws {Error} If URI is invalid
	 */
	match(uri: string): MatchResult | null;

	/**
	 * Clear all registered templates
	 */
	clear(): void;

	/**
	 * Get all registered template strings
	 * @returns Array of template strings
	 */
	all(): string[];
}

/**
 * URI Template Expander class
 */
export class UriTemplateExpander {
	/**
	 * Create a new UriTemplateExpander instance
	 * @param {string} template - The URI template string
	 */
	constructor(template: string);

	/**
	 * Expand the template with given variables
	 * @param {Record<string, unknown>} variables - Variables to substitute
	 * @returns {string} Expanded URI
	 */
	expand(variables: Record<string, unknown>): string;
}
