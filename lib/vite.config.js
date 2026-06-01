import path from "path";

import {defineConfig} from "vite";

const isExternal = (id) => !id.startsWith(".") && !path.isAbsolute(id);

const shaderMinifierPlugin = {
    name: 'shader-minifier',
    transform(code, id) {
        if (id.endsWith('shaders.ts')) {
            // Find all template literals `...` and minify their contents
            const minifiedCode = code.replace(/`([\s\S]*?)`/g, (match, p1) => {
                const minified = p1
                    .replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments
                    .replace(/\/\/.*$/gm, '')        // remove line comments
                    .replace(/[ \t]+/g, ' ')         // collapse horizontal whitespace
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .join('\n');
                return '`' + minified + '`';
            });
            return {
                code: minifiedCode,
                map: null
            };
        }
    }
};

export default defineConfig(() => ({
    esbuild: {
        logOverride: {"this-is-undefined-in-esm": "silent"}
    },
    plugins: [shaderMinifierPlugin],
    build: {
        lib: {
            entry: path.resolve(__dirname, "src/index.ts"),
            name: "neat",
            fileName: (format) => `index.${format}.js`
        },
        target: "esnext",
        sourcemap: true,
        rollupOptions: {
            external: isExternal
        }
    }
}));
