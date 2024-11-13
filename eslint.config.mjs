/*
 * Cord, a Discord client mod based on Vencord
 * Copyright (c) 2024 Cord contributors
 * Code based on Vencord.
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import pathAlias from 'eslint-plugin-path-alias';
import header from 'eslint-plugin-simple-header';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{ ignores: ['dist', 'browser', 'packages/vencord-types'] },
	{
		files: ['vencord/src/**/*.{tsx,ts,mts,mjs,js,jsx}', 'eslint.config.mjs'],
		plugins: {
			'simple-header': header,
			'@typescript-eslint': tseslint.plugin,
			'simple-import-sort': simpleImportSort,
			'unused-imports': unusedImports,
			'path-alias': pathAlias
		},
		settings: {
			'import/resolver': {
				map: [
					['@webpack', './src/webpack'],
					['@webpack/common', './src/webpack/common'],
					['@utils', './src/utils'],
					['@api', './src/api'],
					['@components', './src/components']
				]
			}
		},
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: ['./tsconfig.json'],
				tsconfigRootDir: import.meta.dirname
			}
		},
		rules: {
			/*
			 * Since it's only been a month and Vencord has already been stolen
			 * by random skids who rebranded it to "AlphaCord" and erased all license
			 * information
			 */
			'simple-header/header': [
				'error',
				{
					files: ['licenses/header-based-on.txt', 'licenses/header.txt', 'licenses/header-vencord.txt', 'licenses/header-vencord-old.txt'],
					templates: {
						author: ['.*', 'Vendicated and contributors'],
						cord_author: ['.*', 'Cord contributors']
					}
				}
			],

			// ESLint Rules
			yoda: 'error',
			eqeqeq: ['error', 'smart'],
			'prefer-destructuring': [
				'error',
				{
					VariableDeclarator: { array: false, object: true },
					AssignmentExpression: { array: false, object: false }
				}
			],
			'operator-assignment': ['error', 'always'],
			'no-useless-computed-key': 'error',
			'no-unneeded-ternary': ['error', { defaultAssignment: false }],
			'no-invalid-regexp': 'error',
			'no-constant-condition': ['error', { checkLoops: false }],
			'no-duplicate-imports': 'error',
			'dot-notation': 'error',
			'no-useless-escape': [
				'error',
				{
					extra: 'i'
				}
			],
			'no-fallthrough': 'error',
			'for-direction': 'error',
			'no-async-promise-executor': 'error',
			'no-cond-assign': 'error',
			'no-dupe-else-if': 'error',
			'no-duplicate-case': 'error',
			'no-irregular-whitespace': 'error',
			'no-loss-of-precision': 'error',
			'no-misleading-character-class': 'error',
			'no-prototype-builtins': 'error',
			'no-regex-spaces': 'error',
			'no-shadow-restricted-names': 'error',
			'no-unexpected-multiline': 'error',
			'no-unsafe-optional-chaining': 'error',
			'no-useless-backreference': 'error',
			'use-isnan': 'error',
			'prefer-const': 'error',
			'prefer-spread': 'error',

			// Plugin Rules
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',
			'unused-imports/no-unused-imports': 'error',
			'path-alias/no-relative': 'error'
		}
	}
);
