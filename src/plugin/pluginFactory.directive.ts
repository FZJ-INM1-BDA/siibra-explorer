import { Directive, ViewContainerRef, Inject, Optional } from "@angular/core";
import { APPEND_SCRIPT_TOKEN, REMOVE_SCRIPT_TOKEN } from "src/util/constants";

export const SUPPORT_LIBRARY_MAP: Map<string, Map<string, string>> = new Map([
  ['jquery', new Map<string, string>([
    ['3', 'https://code.jquery.com/jquery-3.3.1.min.js'],
    ['2', 'https://code.jquery.com/jquery-2.2.4.min.js']
  ])],
  ['webcomponentsLite', new Map([
    ['1.1.0', 'https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.1.0/webcomponents-lite.js']
  ])],
  ['react', new Map([
    ['16', 'https://unpkg.com/react@16/umd/react.development.js']
  ])],
  ['reactdom', new Map([
    ['16', 'https://unpkg.com/react-dom@16/umd/react-dom.development.js']
  ])],
  ['vue', new Map([
    ['2.5.16', 'https://cdn.jsdelivr.net/npm/vue@2.5.16/dist/vue.js']
  ])],
  ['preact', new Map([
    ['8.4.2', 'https://cdn.jsdelivr.net/npm/preact@8.4.2/dist/preact.min.js']
  ])],
  ['d3', new Map([
    ['5.7.0', 'https://cdnjs.cloudflare.com/ajax/libs/d3/5.7.0/d3.min.js'],
    ['6.2.0', 'https://cdnjs.cloudflare.com/ajax/libs/d3/6.2.0/d3.min.js']
  ])],
  ['mathjax', new Map([
    ['3.1.2', 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.1.2/es5/tex-svg.js']
  ])]
])

export const parseLibrary = (libVer: string) => {
  const re = /^([a-zA-Z0-9]+)@([0-9.]+)$/.exec(libVer)
  if (!re) throw new Error(`${libVer} cannot be parsed properly`)
  const lib = re[1]
  const ver = re[2]
  const libMap = SUPPORT_LIBRARY_MAP.get(lib) 
  if (!libMap) throw new Error(`${lib} not supported. Only supported libraries are ${Array.from(SUPPORT_LIBRARY_MAP.keys())}`)
  const src = libMap.get(ver)
  if (!src) throw new Error(`${lib} version ${ver} not supported. Only supports ${Array.from(libMap.keys())}`)
  return src
}

export const REGISTER_PLUGIN_FACTORY_DIRECTIVE = `REGISTER_PLUGIN_FACTORY_DIRECTIVE`

@Directive({
  selector: '[pluginFactoryDirective]',
})

export class PluginFactoryDirective {
  constructor(
    public viewContainerRef: ViewContainerRef,
    @Optional() @Inject(REGISTER_PLUGIN_FACTORY_DIRECTIVE) registerPluginFactoryDirective: (directive: PluginFactoryDirective) => void,
    @Inject(APPEND_SCRIPT_TOKEN) private appendScript: (src: string) => Promise<HTMLScriptElement>,
    @Inject(REMOVE_SCRIPT_TOKEN) private removeScript: (srcEl: HTMLScriptElement) => void,
  ) {
    if (registerPluginFactoryDirective) {
      registerPluginFactoryDirective(this)
    }
  }

  private loadedLibraries: Map<string, {counter: number, srcEl: HTMLScriptElement|null}> = new Map()
  
  async loadExternalLibraries(libraries: string[]) {
    const libsToBeLoaded = libraries.map(libName => {
      return {
        libName,
        libSrc: parseLibrary(libName),
      }
    })

    for (const libToBeLoaded of libsToBeLoaded) {
  
      const { libSrc, libName } = libToBeLoaded

      // if browser natively support custom element, do not append polyfill
      if ('customElements' in window && /^webcomponentsLite@/.test(libName)) continue

      let srcEl
      const { counter, srcEl: srcElOld } = this.loadedLibraries.get(libName) || { counter: 0 }
      if (counter === 0) {

        // slight performance penalty not loading external libraries in parallel, but this should be an edge case any way
        srcEl = await this.appendScript(libSrc)
      }
      this.loadedLibraries.set(libName, { counter: counter + 1, srcEl: srcEl || srcElOld })
    }
  }

  unloadExternalLibraries(libraries: string[]) {
    for (const lib of libraries) {
      const { counter, srcEl } = this.loadedLibraries.get(lib) || { counter: 0 }
      if (counter > 1) {
        this.loadedLibraries.set(lib, { counter: counter - 1, srcEl })
      } else {
        this.loadedLibraries.set(lib, { counter: 0, srcEl: null })
        this.removeScript(srcEl)
      }
    }
  }
}
