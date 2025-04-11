import { Directive, HostListener, Input } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { BehaviorSubject, Subject } from "rxjs";
import { take } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { BoundingBox, Feature, SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { DialogService } from "src/services/dialogService.service";
import { MatSnackBar } from "src/sharedModules";
import { userInterface } from "src/state";
import { wait } from "src/util/fn";

@Directive({
  selector: '[dumb-download-atlas]',
  exportAs: 'dumbAtlasDl'
})

export class DumpDownloadAtlasDownload{
  @Input()
  template: SxplrTemplate

  @Input()
  parcellation: SxplrParcellation

  @Input()
  bbox: BoundingBox

  @Input()
  region: SxplrRegion

  @Input()
  feature: Feature

  @Input()
  strictMode: string

  busy$ = new BehaviorSubject(false)

  #error$ = new Subject<string>()
  error$ = this.#error$.pipe()

  @HostListener('click')
  async onClick(){
    try {
      
      this.busy$.next(true)

      const { parcellation, template, bbox, region, feature, strictMode } = this

      const endpoint = await this.sapi.sapiEndpoint$.pipe(
        take(1)
      ).toPromise()

      const url = new URL(`${endpoint}/atlas_download`)
      const query = {}
      if (parcellation) {
        query['parcellation_id'] = parcellation.id
      }
      if (template) {
        query['space_id'] = template.id
      }

      const mode = await this.store.pipe(
        select(userInterface.selectors.panelMode),
        take(1)
      ).toPromise()

      /**
       * default value of mode is null
       */
      if (mode && mode !== "FOUR_PANEL") {
        await this.dialogSvc.getUserConfirm({
          markdown: `Download current view only works in \`four panel\` mode. \n\nContinue the download - as if \`four panel\` view was active?`,
        })
      }
      if (bbox) {
        query['bbox'] = JSON.stringify([bbox.minpoint, bbox.maxpoint])
      }

      if (region) {
        query['region_id'] = region.name
      }
      if (feature) {
        query['feature_id'] = feature.id
      }
      if (strictMode) {
        query['query_mode'] = strictMode
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
        
        this.busy$.next(false)
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
      this.busy$.next(false)
      this.snackbar.open(`Download starting. If it has not, please check your browser's popup blocker.`, 'Dismiss')
    } catch (e) {
      console.log("error!", e)
      this.busy$.next(false)
      this.#error$.next(e.toString())
    }
  }

  constructor(private store: Store, private snackbar: MatSnackBar, private sapi: SAPI, private dialogSvc: DialogService) { }
  
}