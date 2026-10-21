import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { combineLatest, EMPTY, from, timer } from "rxjs";
import { MetaError, SpatialOption } from "./spatialOpt.directive";
import { NgLayerCtrlCmp } from "src/viewerModule/nehuba/nehubaViewerInterface/ngLayerCtl/ngLayerCtrl.component";
import { catchError, map, switchMap, take } from "rxjs/operators";
import { MetaV1Schema } from "src/atlasComponents/sapi/volumeMeta";

type Meta = {
  version: 1
  preferredColormap: ("magma" | "viridius")[]
  "https://schema.brainatlas.eu/github/humanbrainproject/neuroglancer": {
    opacity: number
  }
}

type GeomBase = {
  url: string
  format: 'neuroglancer-precomputed'
  label?: string
  meta?: Meta
}

type GeomVolume = {
  type: "image"
  transform: number[][]
} & GeomBase

// type GeomAnnotation = {
//   type: "annotation"
// } & GeomBase

async function getAnnotMeta(url: string) {
  const base = {
    format: "neuroglancer-precomputed",
    type: "annotation",
    url,
    transform: undefined,
    meta: {
    } as any
  }
  try {
    const resp = await fetch(`${url}/info`)
    const respJson = await resp.json()
    if ((respJson['properties'] || []).some((p: any) => p.id === "color" && p.type === "rgb")) {
      base['meta']["https://schema.brainatlas.eu/github/humanbrainproject/neuroglancer"] = {
        shader: `void main() { setColor(prop_color());}`
      }
    }
  } catch {
    console.debug("info cannot be found")
  }
  return base
}

async function getMeta(url: string) {
  try {
    const resp = await fetch(`${url}/meta.json`)
    const meta: MetaV1Schema = await resp.json()
    const transform = meta['transform']
    if (url.includes("cpn")) {
      transform[1][3] -= 40e3
      meta.preferredColormap = ['rgba (4 channel)']
    }
    return {
      url,
      type: `image`,
      label: url,
      format: "neuroglancer-precomputed",
      transform,
      meta,
    }
  } catch {

    const resp = await fetch(`${url}/transform.json`)
    const transform = await resp.json()
    return {
      url,
      type: `image`,
      label: url,
      format: "neuroglancer-precomputed",
      transform,
      meta: {
        preferredColormap: ["magma"],
        version: 1,
      }
    }
  }
}

@Component({
  selector: 'spatial-feature-cmp',
  templateUrl: './spatial.template.html',
  styleUrls: [
    './spatial.style.scss'
  ],
  standalone: true,
  imports: [
    CommonModule,
    NgLayerCtrlCmp,
  ]
})

export class SpatialFeatureCmp extends SpatialOption {

  isVolume(v: unknown): v is GeomVolume {
    return (v as any).type === "image"
  }

  #datum$ = this.metaJson$.pipe(
    map(v => {
      if (!v) {
        return
      }
      if (v instanceof MetaError) {
        return
      }
      return v['https://schema.brainatlas.eu/apps.ebrains.eu/geom-svc/datum']
    })
  )

  view$ = combineLatest([
    this.#datum$,
    this._url$,
  ]).pipe(
    switchMap(([datum, url]) => {
      if (!datum) {
        return EMPTY
      }
      if (!url) {
        return EMPTY
      }
      const trimmedUrl = url.replace(/\/$/, "")
      if (datum["format"] === "multiresAnnot") {
        const overlays = (datum["overlays"] || []) as any[]
        return from(
          Promise.all([
            ...overlays
              .filter(ol => ol['format'] === "neuroglancer-precomputed")
              .map(ol => getMeta(ol["url"])),
            getAnnotMeta(url).then(view => ({
              ...view,
              label: datum['modality'] || url
            }))
          ])
        ).pipe(
          map(views => {
            return { views }
          })
        )
        // return of({
        //   views: [
        //     {
        //       format: "neuroglancer-precomputed",
        //       type: "annotation",
        //       label: datum["modality"] || url,
        //       url,
        //     } as GeomAnnotation
        //   ]
        // })
      }
      if (datum["protocol"] === "neuroglancer-precomputed") {
        const overlays = (datum["overlays"] || []) as any[]
        return from(
          Promise.all([
            ...overlays.filter(ol => ol['format'] === "neuroglancer-precomputed").map(ol => getMeta(ol["url"])),
            from(fetch(`${trimmedUrl}/transform.json`).then(res => res.json() as Promise<number[][]>)).pipe(
              catchError((err, obs) => timer(5000).pipe(
                switchMap(() => obs)
              )),
              take(1)
            ).toPromise().then(transform => {
              return {
                  type: "image",
                  url,
                  transform,
                  format: "neuroglancer-precomputed",
                  label: datum["modality"] || url,
                  meta: {
                    preferredColormap: ["magma"],
                    "https://schema.brainatlas.eu/github/humanbrainproject/neuroglancer": {
                      opacity: 0.75
                    }
                  }
              }
            })
          ])
        ).pipe(
          map(views => {

            return {
              views
            }
          })
        )
        // return from(fetch(`${trimmedUrl}/transform.json`).then(res => res.json() as Promise<number[][]>)).pipe(
        //   catchError((err, obs) => timer(5000).pipe(
        //     switchMap(() => obs)
        //   )),
        //   map(transform => {
        //     return {
        //       views: [
        //         {
        //           type: "image",
        //           url,
        //           transform,
        //           format: "neuroglancer-precomputed",
        //           label: datum["modality"] || url,
        //           meta: {
        //             preferredColormap: ["magma"],
        //             "https://schema.brainatlas.eu/github/humanbrainproject/neuroglancer": {
        //               opacity: 0.75
        //             }
        //           }
        //         } as GeomVolume
        //       ]
        //     }
        //   })
        // )
      }
      return EMPTY
    })
  )
}
