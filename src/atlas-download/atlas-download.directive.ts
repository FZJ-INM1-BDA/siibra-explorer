import { Directive, HostListener } from '@angular/core';
import { MatSnackBar } from 'src/sharedModules/angularMaterial.exports'
import { Store, select } from '@ngrx/store';
import { Subject, concat, of } from 'rxjs';
import { distinctUntilChanged, shareReplay, take } from 'rxjs/operators';
import { SAPI } from 'src/atlasComponents/sapi';
import { MainState } from 'src/state';
import { fromRootStore, selectors } from "src/state/atlasSelection"
import { selectors as userInteractionSelectors } from "src/state/userInteraction"
import { wait } from "src/util/fn"

@Directive({
  selector: '[sxplrAtlasDownload]',
  exportAs: 'atlasDlDct'
})
export class AtlasDownloadDirective {

  @HostListener('click')
  async onClick(){
    try {

      this.#busy$.next(true)
      const { parcellation, template } = await this.store.pipe(
        fromRootStore.distinctATP(),
        take(1)
      ).toPromise()

      const bbox = await this.store.pipe(
        select(selectors.currentViewport),
        take(1),
      ).toPromise()

      const selectedRegions = await this.store.pipe(
        select(selectors.selectedRegions),
        take(1)
      ).toPromise()

      const selectedFeature = await this.store.pipe(
        select(userInteractionSelectors.selectedFeature),
        take(1)
      ).toPromise()

      const endpoint = await this.sapi.sapiEndpoint$.pipe(
        take(1)
      ).toPromise()

      const url = new URL(`${endpoint}/atlas_download`)
      const query = {
        parcellation_id: parcellation.id,
        space_id: template.id,
      }

      if (bbox) {
        query['bbox'] = JSON.stringify([bbox.minpoint, bbox.maxpoint])
      }

      if (selectedRegions.length === 1) {
        query['region_id'] = selectedRegions[0].name
      }
      if (selectedFeature) {
        query['feature_id'] = selectedFeature.id
      }
      for (const key in query) {
        url.searchParams.set(key, query[key])
      }
  
      const resp = await fetch(url)
      const ct = resp.headers.get("content-type")
      if (ct === "application/octet-stream") {
        const cd = resp.headers.get("content-disposition") || "filename=download.zip"
        const filename = cd.split("=")[1]
        const blob = await resp.blob()
        const url = URL.createObjectURL(blob)
        
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        this.#busy$.next(false)
        return
      }

      const { task_id } = await resp.json()
  
      if (!task_id) {
        throw new Error(`Task id not found`)
      }
      const pingUrl = new URL(`${endpoint}/atlas_download/${task_id}`)
      // eslint-disable-next-line no-constant-condition
      while (true) {
        await wait(320)
        const resp = await fetch(pingUrl)
        if (resp.status >= 400) {
          throw new Error(`task id thrown error ${resp.status}, ${resp.statusText}, ${resp.body}`)
        }
        const { status } = await resp.json()
        if (status === "SUCCESS") {
          break
        }
      }

      /**
       * n.b. this *needs* to happen in the same invocation chain from when click happened
       * modern browser is pretty strict on what can and cannot 
       */
      window.open(`${endpoint}/atlas_download/${task_id}/download`, "_blank")
      this.#busy$.next(false)
      this.snackbar.open(`Download starting. If it has not, please check your browser's popup blocker.`, 'Dismiss')
    } catch (e) {
      this.#busy$.next(false)
      this.#error$.next(e.toString())
    }
    
  }

  #busy$ = new Subject<boolean>()
  busy$ = concat(
    of(false),
    this.#busy$,
  ).pipe(
    distinctUntilChanged(),
    shareReplay(1)
  )

  #error$ = new Subject<string>()
  error$ = this.#error$.pipe()

  constructor(private store: Store<MainState>, private snackbar: MatSnackBar, private sapi: SAPI) { }

}
