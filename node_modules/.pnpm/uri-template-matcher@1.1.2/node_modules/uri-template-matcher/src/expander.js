/**
 * @fileoverview URI template expander implementation
 */

import { parse_template } from './parser.js';

/**
 * Expand a URI template with given variables
 * @param {string} template - The URI template to expand
 * @param {Record<string, any>} variables - Variables to substitute
 * @returns {string} Expanded URI
 */
export function expand_template(template, variables) {
	try {
		const parsed = parse_template(template);
		let result = '';

		for (const part of parsed.parts) {
			if (part.type === 'literal') {
				result += part.value;
			} else if (part.type === 'expression') {
				result += expand_expression(part, variables);
			}
		}

		return result;
	} catch (error) {
		throw new Error(
			`Failed to expand template: ${error instanceof Error ? error.message : error}`,
		);
	}
}

/**
 * Expand a template expression
 * @param {import('./types.js').ExpressionPart} expression
 * @param {Record<string, any>} variables
 * @returns {string}
 */
function expand_expression(expression, variables) {
	const { operator, expressions } = expression;
	const values = [];

	for (const varSpec of expressions) {
		const result = get_variable_value(varSpec, variables);
		if (result !== undefined) {
			values.push(result);
		}
	}

	if (values.length === 0) {
		return '';
	}

	return format_values(operator || '', values);
}

/**
 * Get the processed value for a variable specification
 * @param {import('./types.js').TemplateExpression} varSpec
 * @param {Record<string, any>} variables
 * @returns {{name: string, value: any, explode?: boolean} | undefined}
 */
function get_variable_value(varSpec, variables) {
	const { name, prefix, explode } = varSpec;
	const value = variables[name];

	if (value === undefined || value === null) {
		return undefined;
	}

	// Handle empty arrays and objects - they should be treated as undefined
	if (Array.isArray(value) && value.length === 0) {
		return undefined;
	}
	if (
		typeof value === 'object' &&
		value !== null &&
		Object.keys(value).length === 0
	) {
		return undefined;
	}

	let processedValue = value;

	if (typeof value === 'string') {
		if (prefix && prefix > 0) {
			processedValue = value.substring(0, prefix);
		} else {
			processedValue = value;
		}
	} else if (Array.isArray(value)) {
		processedValue = value;
	} else if (typeof value === 'object') {
		processedValue = value;
	} else {
		processedValue = String(value);
	}

	return { name, value: processedValue, explode };
}

/**
 * Format values according to the operator
 * @param {string} operator
 * @param {{name: string, value: any, explode?: boolean}[]} values
 * @returns {string}
 */
function format_values(operator, values) {
	switch (operator) {
		case '':
			return values
				.map((v) => format_value(v.value, '', v.explode))
				.join(',');
		case '+':
			return values
				.map((v) => format_value(v.value, '+', v.explode))
				.join(',');
		case '#':
			return (
				'#' +
				values
					.map((v) => format_value(v.value, '#', v.explode))
					.join(',')
			);
		case '.': {
			const dot_values = values.map((v) =>
				format_value(v.value, '.', v.explode),
			);
			// For dot expansion, empty values still contribute dots
			return dot_values.length > 0 ? '.' + dot_values.join('.') : '';
		}
		case '/': {
			const path_values = values.map((v) =>
				format_value(v.value, '/', v.explode),
			);
			// For path expansion, empty values still contribute slashes
			return path_values.length > 0 ? '/' + path_values.join('/') : '';
		}
		case ';':
			return values
				.map(
					(v) =>
						';' +
						format_named_value(v.name, v.value, ';', v.explode),
				)
				.join('');
		case '?':
			return (
				'?' +
				values
					.map((v) =>
						format_named_value(v.name, v.value, '?', v.explode),
					)
					.join('&')
			);
		case '&':
			return values
				.map(
					(v) =>
						'&' +
						format_named_value(v.name, v.value, '&', v.explode),
				)
				.join('');
		default:
			return values
				.map((v) => format_value(v.value, '', v.explode))
				.join(',');
	}
}

/**
 * Format a single value
 * @param {any} value
 * @param {string} operator
 * @param {boolean} [explode]
 * @returns {string}
 */
function format_value(value, operator, explode) {
	if (typeof value === 'string') {
		// For empty strings in certain operators, we need to preserve the separator
		if (value === '' && (operator === '.' || operator === '/')) {
			return ''; // Empty value, but we'll handle separator in the join logic
		}
		return encode_value(value, operator);
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			// Empty arrays should not disappear entirely for certain operators
			return '';
		}
		if (explode) {
			// For exploded arrays, the separator depends on the operator
			if (operator === '.') {
				return value
					.map((v) => encode_value(String(v), operator))
					.join('.');
			} else if (operator === '/') {
				return value
					.map((v) => encode_value(String(v), operator))
					.join('/');
			}
		}
		return value.map((v) => encode_value(String(v), operator)).join(',');
	}

	if (typeof value === 'object') {
		if (Object.keys(value).length === 0) {
			return ''; // Empty objects expand to empty string
		}
		if (explode) {
			// For exploded objects, the format depends on the operator
			if (operator === '' || operator === '+' || operator === '#') {
				// Simple expansion - key=value pairs separated by commas
				return Object.entries(value)
					.map(
						([k, v]) =>
							`${encode_value(k, operator)}=${encode_value(String(v), operator)}`,
					)
					.join(',');
			} else if (operator === '.') {
				// Dot expansion - key=value pairs separated by dots
				return Object.entries(value)
					.map(
						([k, v]) =>
							`${encode_value(k, operator)}=${encode_value(String(v), operator)}`,
					)
					.join('.');
			} else if (operator === '/') {
				// Path expansion - key=value pairs separated by slashes
				return Object.entries(value)
					.map(
						([k, v]) =>
							`${encode_value(k, operator)}=${encode_value(String(v), operator)}`,
					)
					.join('/');
			}
			// For other operators, handled in format_named_value
			return Object.entries(value)
				.map(
					([k, v]) =>
						`${encode_value(k, operator)}=${encode_value(String(v), operator)}`,
				)
				.join(',');
		}
		// Non-exploded objects: key,value,key,value...
		return Object.entries(value)
			.map(
				([k, v]) =>
					`${encode_value(k, operator)},${encode_value(String(v), operator)}`,
			)
			.join(',');
	}

	return encode_value(String(value), operator);
}

/**
 * Format a named value (for query parameters)
 * @param {string} name
 * @param {any} value
 * @param {string} operator
 * @param {boolean} [explode]
 * @returns {string}
 */
function format_named_value(name, value, operator, explode) {
	// For query-style operators, use the variable name as-is if it's already encoded
	// Otherwise encode it appropriately
	let encoded_name = name;
	if (operator === '?' || operator === '&') {
		// Only encode if it's not already encoded (check for % pattern)
		if (!/(%[0-9A-Fa-f]{2})/.test(name)) {
			encoded_name = encodeURIComponent(name);
		}
	} else {
		encoded_name = encode_value(name, operator);
	}

	if (typeof value === 'string') {
		if (value === '') {
			return operator === ';' ? encoded_name : `${encoded_name}=`;
		}
		return `${encoded_name}=${encode_value(value, operator)}`;
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			// For empty arrays, some operators produce output, others don't
			if (operator === '?' || operator === '&') {
				return `${encoded_name}=`;
			} else if (operator === ';') {
				return encoded_name;
			}
			return '';
		}
		if (explode) {
			return value
				.map(
					(v) =>
						`${encoded_name}=${encode_value(String(v), operator)}`,
				)
				.join(operator === ';' ? ';' : '&');
		}
		return `${encoded_name}=${value.map((v) => encode_value(String(v), operator)).join(',')}`;
	}

	if (typeof value === 'object') {
		if (Object.keys(value).length === 0) {
			// For empty objects, some operators produce output, others don't
			if (operator === '?' || operator === '&') {
				return `${encoded_name}=`;
			} else if (operator === ';') {
				return encoded_name;
			}
			return '';
		}
		if (explode) {
			return Object.entries(value)
				.map(([k, v]) => {
					let encoded_key = k;
					if (operator === '?' || operator === '&') {
						// Only encode if it's not already encoded (check for % pattern)
						if (!/(%[0-9A-Fa-f]{2})/.test(k)) {
							encoded_key = encodeURIComponent(k);
						}
					} else {
						encoded_key = encode_value(k, operator);
					}
					return `${encoded_key}=${encode_value(String(v), operator)}`;
				})
				.join(operator === ';' ? ';' : '&');
		}
		return `${encoded_name}=${Object.entries(value)
			.map(
				([k, v]) =>
					`${encode_value(k, operator)},${encode_value(String(v), operator)}`,
			)
			.join(',')}`;
	}

	return value === ''
		? encoded_name
		: `${encoded_name}=${encode_value(String(value), operator)}`;
}

/**
 * Encode a value based on the operator
 * @param {string} value
 * @param {string} operator
 * @returns {string}
 */
function encode_value(value, operator) {
	if (operator === '+' || operator === '#') {
		// Reserved string expansion - allow reserved characters per RFC 6570
		// Keep: : / ? # [ ] @ ! $ & ' ( ) * + , ; =
		// But encode spaces and percent signs that aren't part of percent-encoded sequences
		return value
			.replace(/ /g, '%20')
			.replace(/%(?![0-9A-Fa-f]{2})/g, '%25'); // Encode lone % characters
	}
	// Default encoding - encode everything except unreserved characters
	// Note: encodeURIComponent doesn't encode ! but RFC 6570 requires it for simple expansion
	return encodeURIComponent(value).replace(/!/g, '%21');
}

/**
 * URI Template Expander class
 */
export class UriTemplateExpander {
	/**
	 * Create a new UriTemplateExpander instance
	 * @param {string} template - The URI template string
	 */
	constructor(template) {
		this.template = template;
	}

	/**
	 * Expand the template with given variables
	 * @param {Record<string, unknown>} variables - Variables to substitute
	 * @returns {string} Expanded URI
	 */
	expand(variables) {
		return expand_template(this.template, variables);
	}
}
