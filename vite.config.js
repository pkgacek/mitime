const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig } = require('vite');

module.exports = defineConfig({
    esbuild: {
        banner: '/* minified */',
        minifyIdentifiers: false,
        minifySyntax: true,
        minifyWhitespace: true,
    },
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.js'),
            formats: ['es'],
            fileName: () => `Code.js`,
        },
    },
});
