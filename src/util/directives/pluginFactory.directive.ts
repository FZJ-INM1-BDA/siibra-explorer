import { Directive, ViewContainerRef, Renderer2 } from "@angular/core";
import { PluginServices } from "src/atlasViewer/atlasViewer.pluginService.service";
import { AtlasViewerAPIServices } from "src/atlasViewer/atlasViewer.apiService.service";
import { SUPPORT_LIBRARY_MAP } from "src/atlasViewer/atlasViewer.constantService.service";

@Directive({
  selector: '[pluginFactoryDirective]'
})

export class PluginFactoryDirective{
  constructor(
    pluginService: PluginServices,
    viewContainerRef: ViewContainerRef,
    rd2: Renderer2,
    apiService:AtlasViewerAPIServices
  ){
    pluginService.pluginViewContainerRef = viewContainerRef
    pluginService.appendSrc = (src: HTMLElement) => rd2.appendChild(document.head, src)

    apiService.interactiveViewer.pluginControl.loadExternalLibraries = (libraries: string[]) => new Promise((resolve, reject) => {
      const srcHTMLElement = libraries.map(libraryName => ({
        name: libraryName,
        srcEl: SUPPORT_LIBRARY_MAP.get(libraryName)
      }))

      const rejected = srcHTMLElement.filter(scriptObj => scriptObj.srcEl === null)
      if (rejected.length > 0)
        return reject(`Some library names cannot be recognised. No libraries were loaded: ${rejected.map(srcObj => srcObj.name).join(', ')}`)

      Promise.all(srcHTMLElement.map(scriptObj => new Promise((rs, rj) => {
        /**
         * if browser already support customElements, do not append polyfill
         */
        if('customElements' in window && scriptObj.name === 'webcomponentsLite'){
          return rs()
        }
        const existingEntry = apiService.loadedLibraries.get(scriptObj.name)
        if (existingEntry) {
          apiService.loadedLibraries.set(scriptObj.name, { counter: existingEntry.counter + 1, src: existingEntry.src })
          rs()
        } else {
          const srcEl = scriptObj.srcEl
          srcEl.onload = () => rs()
          srcEl.onerror = (e: any) => rj(e)
          rd2.appendChild(document.head, srcEl)
          apiService.loadedLibraries.set(scriptObj.name, { counter: 1, src: srcEl })
        }
      })))
        .then(() => resolve())
        .catch(e => (console.warn(e), reject(e)))
    })

    apiService.interactiveViewer.pluginControl.unloadExternalLibraries = (libraries: string[]) =>
      libraries
        .filter((stringname) => SUPPORT_LIBRARY_MAP.get(stringname) !== null)
        .forEach(libname => {
          const ledger = apiService.loadedLibraries.get(libname!)
          if (!ledger) {
            console.warn('unload external libraries error. cannot find ledger entry...', libname, apiService.loadedLibraries)
            return
          }
          if (ledger.src === null) {
            console.log('webcomponents is native supported. no library needs to be unloaded')
            return
          }

          if (ledger.counter - 1 == 0) {
            rd2.removeChild(document.head, ledger.src)
            apiService.loadedLibraries.delete(libname!)
          } else {
            apiService.loadedLibraries.set(libname!, { counter: ledger.counter - 1, src: ledger.src })
          }
        })
  }
}