#!/usr/bin/node
/*
 * Cord, a Discord client based on Vencord
 * Copyright (c) 2024 Cord contributors
 * Code based on Vencord.
 * Copyright (c) 2022 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const originalEmit = process.emit;
process.emit = (name, data) => !(name === 'warning' && data?.name === 'ExperimentalWarning') && originalEmit.apply(process, arguments);

import esbuild from 'esbuild';
import { access, readdir, readFile, writeFile, constants as FsConstants } from 'fs/promises';
import { minify as minifyHtml } from 'html-minifier-terser';
import { join, relative } from 'path';
import { builtinModules } from 'module';

const IS_DEV = process.argv.includes('--watch');

/**
 * @type {(filter: RegExp, message: string) => import("esbuild").Plugin}
 */
const banImportPlugin = (filter, message) => ({
	name: 'ban-imports',
	setup: b => b.onResolve({ filter }, () => ({ errors: [{ text: message }] }))
});

await esbuild
	.build({
		logLevel: 'info',
		bundle: true,
		write: false, // Handled by the style injector plugin
		watch: IS_DEV,
		minify: !IS_DEV,
		sourcemap: IS_DEV ? 'inline' : '',
		legalComments: 'none',
		external: ['~plugins', '~git', '/assets/*'],
		entryPoints: ['src/Vencord.ts'],
		globalName: 'Vencord',
		format: 'iife',
		external: ['~plugins', '~git', '/assets/*'],
		plugins: [
			{
				name: 'file-uri-plugin',
				setup: build => {
					const filter = /^file:\/\/.+$/;
					build.onResolve({ filter }, args => ({
						namespace: 'file-uri',
						path: args.path,
						pluginData: {
							uri: args.path,
							path: join(args.resolveDir, args.path.slice('file://'.length).split('?')[0])
						}
					}));
					build.onLoad({ filter, namespace: 'file-uri' }, async ({ pluginData: { path, uri } }) => {
						let content;
						if (!uri.endsWith('minify')) content = (await readFile(path, 'utf-8')).trimEnd();
						else {
							if (path.endsWith('.html')) {
								content = await minifyHtml(await readFile(path, 'utf-8'), {
									collapseWhitespace: true,
									removeComments: true,
									minifyCSS: true,
									minifyJS: true,
									removeEmptyAttributes: true,
									removeRedundantAttributes: true,
									removeScriptTypeAttributes: true,
									removeStyleLinkTypeAttributes: true,
									useShortDoctype: true
								});
							} else if (/[mc]?[jt]sx?$/.test(path)) {
								const res = await esbuild.build({
									entryPoints: [path],
									write: false,
									minify: true
								});
								content = res.outputFiles[0].text;
							} else {
								throw new Error(`Don't know how to minify file type: ${path}`);
							}
						}

						return {
							contents: `export default ${JSON.stringify(content)}`
						};
					});
				}
			},
			{
				name: 'style-plugin',
				setup: ({ onResolve, onLoad }) => {
					onResolve({ filter: /\.css\?managed$/, namespace: 'file' }, ({ path, resolveDir }) => ({
						path: relative(process.cwd(), join(resolveDir, path.replace('?managed', ''))),
						namespace: 'managed-style'
					}));
					onLoad({ filter: /\.css$/, namespace: 'managed-style' }, async ({ path }) => {
						const css = await readFile(path, 'utf-8');
						const name = relative(process.cwd(), path).replaceAll('\\', '/');

						return {
							loader: 'js',
							contents: `(window.VencordStyles ??= new Map()).set(${JSON.stringify(name)}, {
    name: ${JSON.stringify(name)},
    source: ${JSON.stringify(css)},
    classNames: {},
    dom: null,
});
export default ${JSON.stringify(name)};`
						};
					});
				}
			},
			{
				name: 'glob-plugins',
				setup: build => {
					const filter = /^~plugins$/;
					build.onResolve({ filter }, args => {
						return {
							namespace: 'import-plugins',
							path: args.path
						};
					});

					build.onLoad({ filter, namespace: 'import-plugins' }, async () => {
						let code = '';
						let pluginsCode = '\n';
						let i = 0;
						for (const dir of ['plugins/_api', 'plugins/_core', 'plugins']) {
							const fullDir = `./src/${dir}`;
							if (
								!(await access(fullDir, FsConstants.F_OK)
									.then(() => true)
									.catch(() => false))
							)
								continue;
							for (const { fileName } of await readdir(fullDir, {
								withFileTypes: true
							})) {
								if (fileName.startsWith('_') ||
								    fileName === 'index.ts' ||
                                    (!IS_DEV && fileName.endsWith(".dev"))) continue;

								code += `import p${i} from "./${dir}/${fileName.replace(/\.tsx?$/, '')}";\n`;
								pluginsCode += `[p${i}.name]:p${i},\n`;
								i++;
							}
						}
						return {
							contents: code + `export default {${pluginsCode}};`,
							resolveDir: './src'
						};
					});
				}
			},
			banImportPlugin(
				new RegExp(`^(node:)?(${builtinModules.map(m => m.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})$`),
				'Cannot import node inbuilt modules in browser code.'
			),
			banImportPlugin(/^react$/, 'Cannot import from react. React and hooks should be imported from @webpack/common'),
			banImportPlugin(/^ts-pattern$/, 'Cannot import from ts-pattern. match and P should be imported from @webpack/common'),
			{
				name: 'style-injector',
				setup: b =>
					b.onEnd(result =>
						writeFile(
							'plugin.js',
							result.outputFiles
								.map(f =>
									f.path.endsWith('.css')
										? `document.addEventListener("DOMContentLoaded",()=>document.documentElement.appendChild(Object.assign(document.createElement("style"),{textContent:\`${f.text.replaceAll('`', '\\`')}\`,id:"vencord-css-core"})),{once:true});`
										: f.text
								)
								.join('')
						)
					)
			}
		],
		target: ['esnext'],
		define: {
			IS_DEV,
			VERSION: (await import('./package.json')).version
		},
		outdir: '.'
	})
	.catch(err => {
		console.error('Build failed');
		console.error(err.message);
		if (!IS_DEV) process.exit(1);
	});
