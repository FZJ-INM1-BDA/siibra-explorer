/**
 * These are self-hosted ES module web components, copied into the build output
 * under `lib/*` via the `assets` config in angular.json.
 *
 * They used to be referenced directly as `<script type="module" src="lib/...">`
 * in index.html. The esbuild `application` builder's Vite dev server, however,
 * eagerly "pre-transforms" any `type="module"` script it finds in the static
 * HTML, resolving the src against its module graph rather than the copied
 * assets, and fails with:
 *
 *   Pre-transform error: Failed to load url /lib/.../*.esm.js
 *
 * Injecting the same tags at runtime keeps them out of the HTML that Vite
 * parses, so the browser (not Vite) fetches them from the asset middleware.
 */
const MODULE_SCRIPTS = [
  'lib/ng-layer-tune/dist/ng-layer-tune/ng-layer-tune.esm.js',
  'lib/hbp-connectivity-component/dist/connectivity-component/connectivity-component.js',
  'lib/export-nehuba/dist/index.js',
]

export function injectExternalScripts() {
  for (const src of MODULE_SCRIPTS) {
    const script = document.createElement('script')
    script.type = 'module'
    script.src = src
    document.head.appendChild(script)
  }
}
