import { Directive, HostListener } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Subject, concat, of } from 'rxjs';
import { distinctUntilChanged, shareReplay, take } from 'rxjs/operators';
import { SAPI } from 'src/atlasComponents/sapi';
import { MainState } from 'src/state';
import { fromRootStore, selectors } from "src/state/atlasSelection"
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

      const selectedRegions = await this.store.pipe(
        select(selectors.selectedRegions),
        take(1)
      ).toPromise()

      const endpoint = await SAPI.BsEndpoint$.pipe(
        take(1)
      ).toPromise()

      const url = new URL(`${endpoint}/atlas_download`)
      const query = {
        parcellation_id: parcellation.id,
        space_id: template.id,
      }
      if (selectedRegions.length === 1) {
        query['region_id'] = selectedRegions[0].name
      }
      for (const key in query) {
        url.searchParams.set(key, query[key])
      }
  
      const resp = await fetch(url)
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
      const anchor = document.createElement('a')
      anchor.href = `${endpoint}/atlas_download/${task_id}/download`
      anchor.target = "_blank"
      anchor.download = "download.zip"
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      this.#busy$.next(false)
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

  constructor(private store: Store<MainState>) { }

}
