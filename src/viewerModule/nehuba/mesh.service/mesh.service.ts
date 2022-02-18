import { Injectable, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, Observable, of } from "rxjs";
import {switchMap, withLatestFrom} from "rxjs/operators";
import { viewerStateSelectedParcellationSelector, viewerStateSelectedRegionsSelector, viewerStateSelectedTemplateSelector } from "src/services/state/viewerState/selectors";
import { IMeshesToLoad } from '../constants'
import { flattenReducer } from 'common/util'
import {IAuxMesh, selectorAuxMeshes, actionSetAuxMeshes, actionSetAuxMesh} from "../store";

interface IRegion {
  ngId?: string
  labelIndex?: number
  children: IRegion[]
}

interface IParc {
  ngId?: string
  regions: IRegion[]
}

type TCollatedLayerNameIdx = {
  [key: string]: number[]
}

export function findFirstChildrenWithLabelIndex(region: IRegion): IRegion[]{
  if (region.ngId && region.labelIndex) {
    return [ region ]
  }
  return region.children
    .map(findFirstChildrenWithLabelIndex)
    .reduce(flattenReducer, [])
}

export function collateLayerNameIndicies(regions: IRegion[]){
  const returnObj: TCollatedLayerNameIdx = {}
  for (const r of regions) {
    if (returnObj[r.ngId]) {
      returnObj[r.ngId].push(r.labelIndex)
    } else {
      returnObj[r.ngId] = [r.labelIndex]
    }
  }
  return returnObj
}

export function getLayerNameIndiciesFromParcRs(parc: IParc, rs: IRegion[]): TCollatedLayerNameIdx {

  const arrOfRegions = (rs.length === 0 ? parc.regions : rs)
    .map(findFirstChildrenWithLabelIndex)
    .reduce(flattenReducer, []) as IRegion[]

  return collateLayerNameIndicies(arrOfRegions)
}

/**
 * control mesh loading etc
 */

@Injectable()
export class NehubaMeshService implements OnDestroy {

  private onDestroyCb: (() => void)[] = []

  constructor(
    private store$: Store<any>
  ){
    const auxMeshSub = combineLatest([
      this.selectedTemplate$,
      this.selectedParc$
    ]).subscribe(([ tmpl, parc ]) => {
      const { auxMeshes: tmplAuxMeshes = [] as IAuxMesh[] } = tmpl || {}
      const { auxMeshes: parcAuxMeshes = [] as IAuxMesh[]} = parc || {}
      this.store$.dispatch(
        actionSetAuxMeshes({
          payload: [...tmplAuxMeshes, ...parcAuxMeshes]
        })
      )
    })
    this.onDestroyCb.push(() => auxMeshSub.unsubscribe())

    // ToDo move logic to nehuba config
    let greyMatterChanged: boolean = false
    const selectedParcSub = this.selectedParc$.pipe(
      withLatestFrom(this.store$.select(selectorAuxMeshes))
    ).subscribe(([p, am]) => {
      const corticalId = 'juelich/iav/atlas/v1.0.0/3'
      const greyAuxMeshId = 'Big Brain auxmesh Grey matter'
      
      const greyMatter = am.find(a => a['@id'] === greyAuxMeshId)
      if (greyMatter) {
        if (p['@id'] === corticalId) {
          // Turn off grey matter when cortical layers selected
          greyMatter.visible = false
          this.store$.dispatch(actionSetAuxMesh({payload: greyMatter}))
          greyMatterChanged = true
        } else if (p['@id'] !== corticalId && greyMatterChanged) {
          // Turn on grey matter on cortical layers disable
          greyMatter.visible = true
          this.store$.dispatch(actionSetAuxMesh({payload: greyMatter}))
          greyMatterChanged = false
        }
      }

    })
    this.onDestroyCb.push(() => selectedParcSub.unsubscribe())

  }

  ngOnDestroy(){
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }

  private selectedTemplate$ = this.store$.pipe(
    select(viewerStateSelectedTemplateSelector)
  )

  private selectedRegions$ = this.store$.pipe(
    select(viewerStateSelectedRegionsSelector)
  )

  private selectedParc$ = this.store$.pipe(
    select(viewerStateSelectedParcellationSelector)
  )

  private auxMeshes$ = this.store$.pipe(
    select(selectorAuxMeshes),
  )

  public loadMeshes$: Observable<IMeshesToLoad> = combineLatest([
    this.auxMeshes$,
    this.selectedTemplate$,
    this.selectedParc$,
    this.selectedRegions$,
  ]).pipe(
    switchMap(([auxMeshes, template, parc, selRegions]) => {
      
      /**
       * if colin 27 and julich brain 2.9.0, select all regions
       */
      let overrideSelRegion = null
      if (
        template['@id'] === 'minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992' &&
        parc['@id'] === 'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290'
      ) {
        overrideSelRegion = []
      }

      const obj = getLayerNameIndiciesFromParcRs(parc, overrideSelRegion || selRegions)
      const { auxillaryMeshIndices = [] } = parc
      const arr: IMeshesToLoad[] = []
      for (const key in obj) {
        const labelIndicies = Array.from(new Set([...obj[key], ...auxillaryMeshIndices]))
        arr.push({
          layer: {
            name: key
          },
          labelIndicies
        })
      }
      
      const auxLayers: {
        [key: string]: number[]
      } = {}

      for (const auxMesh of auxMeshes) {
        const { name, ngId, labelIndicies } = auxMesh
        if (!auxLayers[ngId]) {
          auxLayers[ngId] = []
        }
        if (auxMesh.visible) {
          auxLayers[ngId].push(...labelIndicies)
        }
      }
      for (const key in auxLayers) {
        arr.push({
          layer: {
            name: key
          },
          labelIndicies: auxLayers[key]
        })
      }

      return of(...arr)
    }),
  )
}
