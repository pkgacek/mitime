const path = require('path');
const { defineConfig } = require('vite');

module.exports = defineConfig({
    build: {
        rollupOptions: {
            preserveEntrySignatures: 'strict',
        },
        lib: {
            entry: path.resolve(__dirname, 'lib/Code.js'),
            formats: ['es'],
            fileName: () => `Code.tmp.js`,
        },
    },
});
