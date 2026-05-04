/// <reference types="vite/client" />

// hls.js v1.6.x ships package.json with `types: ./dist/hls.d.ts` but the file
// is missing from the published tarball. Declare a permissive ambient module
// so tsc -b stops complaining; usages already cast through `any`.
declare module 'hls.js' {
  type Hls = any;
  const Hls: any;
  export default Hls;
  export type HlsConfig = any;
  export type ErrorData = any;
  export type Level = any;
  export type FragmentLoaderContext = any;
  export type LoaderCallbacks<T = any> = any;
  export type LoaderConfiguration = any;
  export type LoaderStats = any;
  export const Events: any;
}

// pdf-lib ships an incomplete types tree (cjs/index.d.ts re-exports
// from ./api/index which doesn't exist). Stub permissively.
declare module 'pdf-lib' {
  export const PDFDocument: any;
  export const StandardFonts: any;
  export function rgb(...args: any[]): any;
}

// Vite's `?url` import suffix returns the asset URL as a string. The
// `vite/client` reference above already covers this for built-in suffixes,
// but pdfjs-dist uses an explicit `.mjs?url` path that some TS versions miss.
declare module '*.mjs?url' {
  const url: string;
  export default url;
}
