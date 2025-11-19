/**
 * @fileoverview Type definitions for URI template matching
 */

/**
 * @typedef {Object} TemplateExpression
 * @property {string} name - Variable name
 * @property {number} [prefix] - Prefix length modifier (e.g., :3)
 * @property {boolean} explode - Whether to explode arrays/objects
 */

/**
 * @typedef {Object} LiteralPart
 * @property {'literal'} type - Part type
 * @property {string} value - Literal text value
 */

/**
 * @typedef {Object} ExpressionPart
 * @property {'expression'} type - Part type
 * @property {TemplateExpression[]} expressions - Array of variable expressions
 * @property {string} [operator] - RFC 6570 operator (+, #, ., /, ;, ?, &)
 */

/**
 * @typedef {LiteralPart | ExpressionPart} TemplatePart
 */

/**
 * @typedef {Object} ParsedTemplate
 * @property {string} template - Original template string
 * @property {TemplatePart[]} parts - Parsed template parts
 */

/**
 * @typedef {Object} MatchResult
 * @property {string} template - Matched template string
 * @property {Record<string, string | string[]>} params - Extracted parameters
 */

// Export empty object to make this a proper ES module
export {};
