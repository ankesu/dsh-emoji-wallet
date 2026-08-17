/**
 * tsdown config for dsh-emoji-wallet — node half (lib/index.mjs) + browser client
 * bundle (lib/client.js, CJS with the harness loader handoff).
 *
 * The client bundle externals mirror the harness platform seed table
 * (see dsh-web-ui's shared/web-platform.ts): react comes from the shell, so
 * slot components share ONE React instance with the renderer. Bundling a
 * second react would break hooks ("Cannot read properties of null (reading
 * 'useState')" in the slot renderer).
 */
const PLATFORM_EXTERNALS = [
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-runtime',
  '@deepseek-ai/dsh-client-connection',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  'scheduler',
]

export default [
  {
    name: 'dsh-emoji-wallet',
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2022',
    dts: false,
    clean: false,
    external: ['@deepseek-ai/cordis'],
  },
  {
    name: 'dsh-emoji-wallet/client',
    entry: { client: 'src/client/index.tsx' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    dts: false,
    sourcemap: true,
    clean: false,
    external: [...PLATFORM_EXTERNALS],
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    },
    noExternal: (id: string) => (PLATFORM_EXTERNALS.includes(id) ? undefined : true),
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: "dsh-emoji-wallet", factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
]
