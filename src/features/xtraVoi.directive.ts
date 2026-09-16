import { Directive, Input, Optional } from "@angular/core";
import { VoiFeature } from "./guards";
import { map, switchMap } from "rxjs/operators";
import { ExperimentalService } from "src/experimental/experimental.service";
import { BehaviorSubject, combineLatest, from, Observable, of } from "rxjs";

const BIGBRAIN_XZ = [
  [-70.677, 62.222],
  [-70.677, -58.788],
  [68.533, -58.788],
  [68.533, 62.222],
]

type _Voi = VoiFeature

@Directive({
  selector: '[extra-voi-dir]',
  standalone: true,
  exportAs: "extraVol"
})

export class ExtraVoiDirective {

  #voi$ = new BehaviorSubject<VoiFeature | null>(null)
  @Input()
  set voi(value: VoiFeature) {
    this.#voi$.next(value)
  }

  additionalVoi$: Observable<_Voi[]> = combineLatest([
    this.#voi$,
    (this.svc ? this.svc.showExperimentalFlag$ : of(false)),
  ]).pipe(
    switchMap(([voi, showflag]) => {
      if (!showflag) {
        return of([])
      }
      const found = /B20_([0-9]{4})/.exec(voi?.ngVolume?.url || '')
      if (!found) {
        return of([])
      }


      const sectionId = parseInt(found[1])
      const sectionIdStr = sectionId.toString().padStart(4, '0')
      const realYDis = (sectionId * 2e4 - 70010000 - 10e3) / 1e6
      const url = `https://zam12104.jsc.fz-juelich.de/gpuvm-deploy/cuda/bb1micron/B20_${sectionIdStr}.tif::pipelines/cpn.json`


      return from(
        fetch(`${url}/meta.json`).then(res => res.json())
      ).pipe(
        map(meta => {
          const transform = JSON.parse(JSON.stringify(meta.transform))
          transform[1][3] = transform[1][3] - 40e3
          
          return {
            bbox: {
              center: [0, realYDis, 0] as [number, number, number],
              minpoint: [-70.677, realYDis, -58.788] as [number, number, number],
              maxpoint: [68.533, realYDis, 62.222] as [number, number, number],
              spaceId: "minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588"
            },
            ngVolume: {
              info: null,
              transform,
              // replace with /cpn later
              url: `https://zam12104.jsc.fz-juelich.de/gpuvm-deploy/cuda/bb1micron/B20_${sectionIdStr}.tif::pipelines/cpn.json`,
              meta: {
                preferredColormap: ["rgba (4 channel)"],
                version: 1 as const,
                bestViewPoints: [{
                  type: "enclosed",
                  points: BIGBRAIN_XZ.map(([x, z]) => ({
                    type: "point",
                    value: [x, realYDis, z]
                  }))
                }]
              },
              format: "neuroglancer-precomputed",
              insertIndex: 2
            },
            id: `${sectionId}-cpn`,
            name: `Contour Proposal Network`,
            contributors: [
              `Eric Upschulte`,
              `Alexander Oberstraß`
            ],
            desc: `Contour Proposal Network`,
            link: [
              {
                href: `https://huggingface.co/spaces/ericup/celldetection`,
                text: `huggingface.co/spaces/ericup/celldetection`
              },
              {
                href: `https://github.com/FZJ-INM1-BDA/celldetection`,
                text: `github.com/FZJ-INM1-BDA/celldetection`
              },
              {
                href: `https://doi.org/10.1016/j.media.2022.102371`,
                text: `10.1016/j.media.2022.102371`
              },
              {
                href: `https://proceedings.mlr.press/v212/upschulte23a.html`,
                text: `Uncertainty-Aware Contour Proposal Networks for Cell Segmentation in Multi-Modality High-Resolution Microscopy Images`
              },
            ]
          }
        }),
        map(extravol => [extravol])
      )
    })
  )

  constructor(@Optional() private svc: ExperimentalService) {
  }
}