import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    platform: 'node',
    format: 'esm',
    dts: false,
    clean: false,
    outputOptions: { entryFileNames: 'index.js' },
  },
  {
    entry: { client: 'src/client/index.tsx' },
    outDir: 'lib',
    platform: 'browser',
    target: 'es2022',
    format: 'cjs',
    dts: false,
    clean: false,
    fixedExtension: false,
    deps: { neverBundle: ['react', 'react/jsx-runtime', '@deepseek-ai/dsh-client-ui-primitives'], alwaysBundle: [/^\.\.?\//] },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: 'window.__ModuleLoader__.load({ id: "dsh-ui", factory: (require) => {',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
      footer: 'return module.exports; } });',
    },
  },
])
