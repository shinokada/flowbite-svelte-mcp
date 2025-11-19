/**
 * @fileoverview URI template parser implementation without regex
 */

/**
 * @typedef {import('./types.js').ParsedTemplate} ParsedTemplate
 * @typedef {import('./types.js').TemplateExpression} TemplateExpression
 * @typedef {import('./types.js').TemplatePart} TemplatePart
 * @typedef {import('./types.js').ExpressionPart} ExpressionPart
 */

/**
 * Parse a URI template string into its component parts
 * @param {string} template - The URI template to parse
 * @returns {ParsedTemplate} Parsed template representation
 */
export function parse_template(template) {
	/** @type {TemplatePart[]} */
	const parts = [];
	let current_literal = '';
	let i = 0;

	while (i < template.length) {
		const char = template[i];

		if (char === '{') {
			// Found start of expression
			if (current_literal) {
				parts.push({ type: 'literal', value: current_literal });
				current_literal = '';
			}

			// Find the closing brace
			const expression_start = i + 1;
			let expression_end = expression_start;
			let brace_count = 1;

			while (expression_end < template.length && brace_count > 0) {
				if (template[expression_end] === '{') {
					brace_count++;
				} else if (template[expression_end] === '}') {
					brace_count--;
				}
				expression_end++;
			}

			if (brace_count > 0) {
				throw new Error(`Unclosed expression in template: ${template}`);
			}

			const expression_content = template.slice(
				expression_start,
				expression_end - 1,
			);
			const parsed_expression = parse_expression(expression_content);
			parts.push(parsed_expression);

			i = expression_end;
		} else {
			current_literal += char;
			i++;
		}
	}

	if (current_literal) {
		parts.push({ type: 'literal', value: current_literal });
	}

	return { template, parts };
}

/**
 * Parse an expression content (without braces)
 * @param {string} content - Expression content
 * @returns {TemplatePart} Parsed expression part
 */
function parse_expression(content) {
	if (!content.trim()) {
		throw new Error('Empty expression');
	}

	// Check for operator prefix
	const first_char = content[0];
	const operators = ['+', '#', '.', '/', ';', '?', '&'];
	/** @type {string | undefined} */
	let operator = undefined;
	let variables_part = content;

	if (operators.includes(first_char)) {
		operator = first_char;
		variables_part = content.slice(1);
	}

	// Parse variable list
	const variable_names = split_variables(variables_part);
	const expressions = variable_names.map(parse_variable);

	return {
		type: 'expression',
		expressions,
		operator,
	};
}

/**
 * Split variables by comma, handling nested structures
 * @param {string} variables - Variables string
 * @returns {string[]} Array of variable strings
 */
function split_variables(variables) {
	/** @type {string[]} */
	const result = [];
	let current = '';
	let i = 0;

	while (i < variables.length) {
		const char = variables[i];

		if (char === ',') {
			if (current.trim()) {
				result.push(current.trim());
				current = '';
			}
		} else {
			current += char;
		}
		i++;
	}

	if (current.trim()) {
		result.push(current.trim());
	}

	return result;
}

/**
 * Parse a single variable specification
 * @param {string} variable - Variable string
 * @returns {TemplateExpression} Parsed variable expression
 */
function parse_variable(variable) {
	let name = variable;
	/** @type {number | undefined} */
	let prefix = undefined;
	let explode = false;

	// Check for explode modifier
	if (name.endsWith('*')) {
		explode = true;
		name = name.slice(0, -1);
	}

	// Check for prefix modifier
	const colon_index = name.indexOf(':');
	if (colon_index !== -1) {
		const prefix_str = name.slice(colon_index + 1);
		prefix = parseInt(prefix_str, 10);
		if (isNaN(prefix) || prefix < 0) {
			throw new Error(`Invalid prefix length: ${prefix_str}`);
		}
		name = name.slice(0, colon_index);
	}

	if (!name) {
		throw new Error('Empty variable name');
	}

	return { name, prefix, explode };
}

/**
 * Match a URI against a parsed template
 * @param {string} uri - URI to match
 * @param {ParsedTemplate} parsed_template - Parsed template
 * @returns {Record<string, string | string[]> | null} Extracted parameters or null
 */
export function match_uri(uri, parsed_template) {
	/** @type {Record<string, string | string[]>} */
	const params = {};

	// Handle consecutive variables with backtracking
	const result = match_parts(uri, 0, parsed_template.parts, 0, params);

	// Must match exactly - consume entire URI
	if (!result || result.uri_index !== uri.length) {
		return null;
	}

	return params;
}

/**
 * Recursively match template parts with backtracking for consecutive variables
 * @param {string} uri - URI to match
 * @param {number} uri_index - Current position in URI
 * @param {TemplatePart[]} parts - Template parts to match
 * @param {number} part_index - Current template part index
 * @param {Record<string, string | string[]>} params - Parameters object
 * @returns {{ uri_index: number } | null} Match result or null
 */
function match_parts(uri, uri_index, parts, part_index, params) {
	// Base case: all parts matched
	if (part_index >= parts.length) {
		return { uri_index };
	}

	const part = parts[part_index];

	if (part.type === 'literal') {
		// Match literal text exactly
		if (!uri.slice(uri_index).startsWith(part.value)) {
			return null;
		}

		return match_parts(
			uri,
			uri_index + part.value.length,
			parts,
			part_index + 1,
			params,
		);
	} else {
		// Expression - try different boundaries
		const next_part = parts[part_index + 1];

		// Find all possible end boundaries for this expression
		const boundaries = find_expression_boundaries(
			uri,
			uri_index,
			next_part,
		);

		// Try boundaries in a way that favors the first variable getting more content
		const sorted_boundaries = boundaries.sort((a, b) => {
			// For consecutive variables, prioritize longer matches for the first variable
			if (
				next_part &&
				next_part.type === 'expression' &&
				!next_part.operator
			) {
				return b - a; // Try longer first
			}
			return a - b; // Try shorter first for other cases
		});

		for (const boundary of sorted_boundaries) {
			const segment = uri.slice(uri_index, boundary);
			const temp_params = { ...params };

			const match_result = match_simple_expression(
				segment,
				part,
				temp_params,
				uri,
				uri_index,
			);

			if (match_result) {
				// Try to match the rest with this boundary
				const rest_result = match_parts(
					uri,
					boundary,
					parts,
					part_index + 1,
					temp_params,
				);

				if (rest_result) {
					// Success! Update the original params
					Object.assign(params, temp_params);
					return rest_result;
				}
			}
		}

		return null;
	}
}

/**
 * Find possible boundaries for an expression
 * @param {string} uri - URI to search
 * @param {number} start_index - Start position
 * @param {TemplatePart | undefined} next_part - Next template part
 * @returns {number[]} Array of possible boundary positions
 */
function find_expression_boundaries(uri, start_index, next_part) {
	/** @type {number[]} */
	const boundaries = [];

	if (next_part && next_part.type === 'literal') {
		// Look for all occurrences of the next literal
		let search_index = start_index;
		while (search_index < uri.length) {
			const found_index = uri.indexOf(next_part.value, search_index);
			if (found_index === -1) break;

			boundaries.push(found_index);
			search_index = found_index + 1;
		}

		// If no boundaries found, this means no match is possible
		if (boundaries.length === 0) {
			return [];
		}
	} else if (next_part && next_part.type === 'expression') {
		// Next part is another expression - need to find natural boundaries
		// For consecutive variables, try different split points
		const next_expr = /** @type {ExpressionPart} */ (next_part);
		if (next_expr.operator === '.') {
			// Look for dots as potential boundaries
			for (let i = start_index; i < uri.length; i++) {
				if (uri[i] === '.') {
					boundaries.push(i);
				}
			}
			// Also consider the end of the URI as a boundary for optional dot notation
			boundaries.push(uri.length);
		} else if (next_expr.operator === '/') {
			// Look for slashes as potential boundaries
			for (let i = start_index; i < uri.length; i++) {
				if (uri[i] === '/') {
					boundaries.push(i);
				}
			}
		} else {
			// For simple consecutive variables, try all possible split points
			// Try shorter matches first for greedy matching
			for (let i = start_index; i <= uri.length; i++) {
				boundaries.push(i);
			}
		}
	} else {
		// No next literal - this is the last part, use the entire rest of the URI
		boundaries.push(uri.length);
	}

	return boundaries.sort((a, b) => a - b);
}

/**
 * Match a simple expression (no complex operators)
 * @param {string} segment - URI segment to match
 * @param {TemplatePart} expression - Expression part
 * @param {Record<string, string | string[]>} params - Parameters object
 * @param {string} uri - Full URI
 * @param {number} uri_index - Current URI index
 * @returns {boolean} Whether the match was successful
 */
function match_simple_expression(segment, expression, params, uri, uri_index) {
	if (expression.type !== 'expression') {
		return false;
	}

	const operator = expression.operator;

	// Handle different operators
	switch (operator) {
		case '+':
			return handle_reserved_match(segment, expression, params);
		case '#':
			return handle_fragment_match(segment, expression, params);
		case '.':
			return handle_dot_match(segment, expression, params);
		case '/':
			return handle_path_match(segment, expression, params);
		case ';':
			return handle_semicolon_match(segment, expression, params);
		case '?':
		case '&':
			return handle_query_match(segment, expression, params);
		default:
			return handle_simple_match(
				segment,
				expression,
				params,
				uri,
				uri_index,
			);
	}
}

/**
 * Handle fragment match (# operator)
 * @param {string} segment - URI segment
 * @param {TemplatePart} expression - Expression part
 * @param {Record<string, string | string[]>} params - Parameters object
 * @returns {boolean} Whether the match was successful
 */
function handle_fragment_match(segment, expression, params) {
	if (expression.type !== 'expression') {
		return false;
	}

	// Fragment expansion starts with #, so strip it
	if (!segment.startsWith('#')) {
		// If no fragment, all variables are undefined
		for (const expr of expression.expressions) {
			params[expr.name] = '';
		}
		return segment === '';
	}

	const fragment_content = segment.slice(1);

	if (expression.expressions.length === 1) {
		const expr = expression.expressions[0];
		let value = fragment_content;

		if (expr.prefix && value.length > expr.prefix) {
			value = value.slice(0, expr.prefix);
		}

		params[expr.name] = decodeURIComponent(value);
		return true;
	} else {
		// Handle multiple variables in a single fragment expression
		const values = fragment_content.split(',');
		for (let i = 0; i < expression.expressions.length; i++) {
			const expr = expression.expressions[i];
			let value = values[i] || '';

			if (expr.prefix && value.length > expr.prefix) {
				value = value.slice(0, expr.prefix);
			}

			params[expr.name] = decodeURIComponent(value);
		}
		return true;
	}
}

/**
 * Handle reserved string match (+ operator)
 * @param {string} segment - URI segment
 * @param {TemplatePart} expression - Expression part
 * @param {Record<string, string | string[]>} params - Parameters object
 * @returns {boolean} Whether the match was successful
 */
function handle_reserved_match(segment, expression, params) {
	if (expression.type !== 'expression') {
		return false;
	}

	if (expression.expressions.length === 1) {
		const expr = expression.expressions[0];
		let value = segment;

		// Reserved expansion allows path separators
		if (expr.prefix && value.length > expr.prefix) {
			value = value.slice(0, expr.prefix);
		}

		params[expr.name] = decodeURIComponent(value);
		return true;
	} else {
		// Handle multiple variables in a single expression
		const values = segment.split(',');
		for (let i = 0; i < expression.expressions.length; i++) {
			const expr = expression.expressions[i];
			let value = values[i] || '';

			// Reserved expansion allows path separators
			if (expr.prefix && value.length > expr.prefix) {
				value = value.slice(0, expr.prefix);
			}

			params[expr.name] = decodeURIComponent(value);
		}
		return true;
	}
}

/**
 * Handle simple string match
 * @param {string} segment - URI segment
 * @param {TemplatePart} expression - Expression part
 * @param {Record<string, string | string[]>} params - Parameters object
 * @param {string} uri - Full URI
 * @param {number} uri_index - Current URI index
 * @returns {boolean} Whether the match was successful
 */
function handle_simple_match(segment, expression, params, uri, uri_index) {
	if (expression.type !== 'expression') {
		return false;
	}

	if (expression.expressions.length === 1) {
		const expr = expression.expressions[0];
		let value = segment;

		// Simple variables should not contain path separators
		if (value.includes('/')) {
			return false;
		}

		// Simple variables should not be empty when at the end of a URI (trailing slash scenario)
		if (
			value === '' &&
			uri_index + segment.length === uri.length &&
			uri.endsWith('/')
		) {
			return false;
		}

		if (expr.prefix && value.length > expr.prefix) {
			value = value.slice(0, expr.prefix);
		}

		params[expr.name] = decodeURIComponent(value);
		return true;
	} else {
		// Handle multiple variables in a single expression
		const values = segment.split(',');
		for (let i = 0; i < expression.expressions.length; i++) {
			const expr = expression.expressions[i];
			let value = values[i] || '';

			// Simple variables should not contain path separators
			if (value.includes('/')) {
				return false;
			}

			if (expr.prefix && value.length > expr.prefix) {
				value = value.slice(0, expr.prefix);
			}

			params[expr.name] = decodeURIComponent(value);
		}
		return true;
	}
}

/**
 * Handle dot notation match
 * @param {string} segment - URI segment
 * @param {TemplatePart} expression - Expression part
 * @param {Record<string, string | string[]>} params - Parameters object
 * @returns {boolean} Whether the match was successful
 */
function handle_dot_match(segment, expression, params) {
	if (expression.type !== 'expression') {
		return false;
	}

	// Handle empty segment for optional dot notation
	if (segment === '') {
		// Empty dot segment means all variables are undefined/empty
		for (const expr of expression.expressions) {
			params[expr.name] = '';
		}
		return true;
	}

	const clean_segment = segment.startsWith('.') ? segment.slice(1) : segment;

	if (expression.expressions.length === 1) {
		const expr = expression.expressions[0];

		if (expr.explode) {
			// Split by dots for explode
			const values = clean_segment.split('.');
			params[expr.name] = values.map((v) => decodeURIComponent(v));
		} else {
			params[expr.name] = decodeURIComponent(clean_segment);
		}
		return true;
	} else {
		// Handle multiple variables in a single dot expression
		const values = clean_segment.split('.');
		for (let i = 0; i < expression.expressions.length; i++) {
			const expr = expression.expressions[i];
			let value = values[i] || '';

			if (expr.prefix && value.length > expr.prefix) {
				value = value.slice(0, expr.prefix);
			}

			params[expr.name] = decodeURIComponent(value);
		}
		return true;
	}
}

/**
 * Handle path match
 * @param {string} segment - URI segment
 * @param {TemplatePart} expression - Expression part
 * @param {Record<string, string | string[]>} params - Parameters object
 * @returns {boolean} Whether the match was successful
 */
function handle_path_match(segment, expression, params) {
	if (expression.type !== 'expression') {
		return false;
	}

	const clean_segment = segment.startsWith('/') ? segment.slice(1) : segment;

	if (expression.expressions.length === 1) {
		const expr = expression.expressions[0];
		params[expr.name] = decodeURIComponent(clean_segment);
		return true;
	} else {
		// Handle multiple variables in a single path expression
		// For path expressions with multiple variables, they're comma-separated
		const values = clean_segment.split(',');
		for (let i = 0; i < expression.expressions.length; i++) {
			const expr = expression.expressions[i];
			let value = values[i] || '';

			if (expr.prefix && value.length > expr.prefix) {
				value = value.slice(0, expr.prefix);
			}

			params[expr.name] = decodeURIComponent(value);
		}
		return true;
	}
}

/**
 * Handle semicolon match
 * @param {string} segment - URI segment
 * @param {TemplatePart} expression - Expression part
 * @param {Record<string, string | string[]>} params - Parameters object
 * @returns {boolean} Whether the match was successful
 */
function handle_semicolon_match(segment, expression, params) {
	if (expression.type !== 'expression') {
		return false;
	}

	const parts = segment.split(';').filter((p) => p);

	for (const part of parts) {
		const eq_index = part.indexOf('=');
		if (eq_index !== -1) {
			const key = part.slice(0, eq_index);
			const value = part.slice(eq_index + 1);

			const expr = expression.expressions.find((e) => e.name === key);
			if (expr) {
				params[expr.name] = decodeURIComponent(value);
			}
		}
	}

	return true;
}

/**
 * Handle query match
 * @param {string} segment - URI segment
 * @param {TemplatePart} expression - Expression part
 * @param {Record<string, string | string[]>} params - Parameters object
 * @returns {boolean} Whether the match was successful
 */
function handle_query_match(segment, expression, params) {
	if (expression.type !== 'expression') {
		return false;
	}

	const clean_segment = segment.replace(/^[?&]/, '');

	if (expression.expressions.length === 1) {
		const expr = expression.expressions[0];

		if (expr.explode) {
			// Split by & for explode
			const values = clean_segment.split('&');
			params[expr.name] = values.map((v) => decodeURIComponent(v));
		} else {
			// Parse key=value pairs
			const parts = clean_segment.split('&');
			for (const part of parts) {
				const eq_index = part.indexOf('=');
				if (eq_index !== -1) {
					const key = part.slice(0, eq_index);
					const value = part.slice(eq_index + 1);

					if (key === expr.name) {
						params[expr.name] = decodeURIComponent(value);
					}
				}
			}
		}
	} else {
		// Multiple variables
		const parts = clean_segment.split('&');
		for (const part of parts) {
			const eq_index = part.indexOf('=');
			if (eq_index !== -1) {
				const key = part.slice(0, eq_index);
				const value = part.slice(eq_index + 1);

				const expr = expression.expressions.find((e) => e.name === key);
				if (expr) {
					params[expr.name] = decodeURIComponent(value);
				}
			}
		}
	}

	return true;
}
