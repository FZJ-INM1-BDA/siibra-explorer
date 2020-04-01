import { Directive, Renderer2, ViewContainerRef } from "@angular/core";
import { SUPPORT_LIBRARY_MAP } from "src/atlasViewer/atlasViewer.constantService.service";
import { PluginServices } from "./atlasViewer.pluginService.service";
import { LoggingService } from "src/logging";

@Directive({
  selector: '[pluginFactoryDirective]',
})

export class PluginFactoryDirective {
  constructor(
    pluginService: PluginServices,
    viewContainerRef: ViewContainerRef,
    private rd2: Renderer2,
    private log: LoggingService,
  ) {
    pluginService.loadExternalLibraries = this.loadExternalLibraries.bind(this)
    pluginService.unloadExternalLibraries = this.unloadExternalLibraries.bind(this)
    pluginService.pluginViewContainerRef = viewContainerRef
    pluginService.appendSrc = (src: HTMLElement) => rd2.appendChild(document.head, src)
    pluginService.removeSrc = (src: HTMLElement) => rd2.removeChild(document.head, src)
  }

  private loadedLibraries: Map<string, {counter: number, src: HTMLElement|null}> = new Map()
  
  loadExternalLibraries(libraries: string[]) {
    const srcHTMLElement = libraries.map(libraryName => ({
      name: libraryName,
      srcEl: SUPPORT_LIBRARY_MAP.get(libraryName),
    }))

    const rejected = srcHTMLElement.filter(scriptObj => scriptObj.srcEl === null)
    if (rejected.length > 0) {
      return Promise.reject(`Some library names cannot be recognised. No libraries were loaded: ${rejected.map(srcObj => srcObj.name).join(', ')}`)
    }

    return Promise.all(srcHTMLElement.map(scriptObj => new Promise((rs, rj) => {
      /**
       * if browser already support customElements, do not append polyfill
       */
      if ('customElements' in window && scriptObj.name === 'webcomponentsLite') {
        return rs()
      }
      const existingEntry = this.loadedLibraries.get(scriptObj.name)
      if (existingEntry) {
        this.loadedLibraries.set(scriptObj.name, { counter: existingEntry.counter + 1, src: existingEntry.src })
        rs()
      } else {
        const srcEl = scriptObj.srcEl
        srcEl.onload = () => rs()
        srcEl.onerror = (e: any) => rj(e)
        this.rd2.appendChild(document.head, srcEl)
        this.loadedLibraries.set(scriptObj.name, { counter: 1, src: srcEl })
      }
    })))
  }

  unloadExternalLibraries(libraries: string[]) {
    libraries
      .filter((stringname) => SUPPORT_LIBRARY_MAP.get(stringname) !== null)
      .forEach(libname => {
        const ledger = this.loadedLibraries.get(libname)
        if (!ledger) {
          this.log.warn('unload external libraries error. cannot find ledger entry...', libname, this.loadedLibraries)
          return
        }
        if (ledger.src === null) {
          this.log.log('webcomponents is native supported. no library needs to be unloaded')
          return
        }

        if (ledger.counter - 1 == 0) {
          this.rd2.removeChild(document.head, ledger.src)
          this.loadedLibraries.delete(libname)
        } else {
          this.loadedLibraries.set(libname, { counter: ledger.counter - 1, src: ledger.src })
        }
      })
  }
}
