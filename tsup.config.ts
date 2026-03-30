import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/cli/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    banner: {
        js: '#!/usr/bin/env node',
    },
})