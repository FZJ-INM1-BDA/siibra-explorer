/**
 * Ambient declarations for non-code assets imported directly in TS.
 *
 * `.md` files are imported as raw text via the esbuild `application` builder's
 * `loader` option (see angular.json -> `loader`). Previously these were pulled
 * in with webpack's `!!raw-loader!` inline syntax, which esbuild does not
 * support.
 */
declare module '*.md' {
  const content: string
  export default content
}
