const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig } = require('vite');

module.exports = defineConfig({
    build: {
        rollupOptions: {
            preserveEntrySignatures: 'strict',
        },
        lib: {
            entry: path.resolve(__dirname, 'src/index.js'),
            formats: ['es'],
            fileName: () => `Code.js`,
        },
    },
});
