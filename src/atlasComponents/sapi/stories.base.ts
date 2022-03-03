import { forkJoin } from "rxjs"
import { map, switchMap, withLatestFrom } from "rxjs/operators"
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionalFeatureModel, SapiRegionModel, SapiSpaceModel } from "."
import { SapiParcellationFeatureModel } from "./type"

/**
 * base class used to generate wrapper class for storybook
 */
export class HumanHoc1StoryBase {

  public humanAtlas$ = this.sapi.atlases$.pipe(
    map(atlases => atlases.find(atlas => /human/i.test(atlas.name)))
  )
  public mni152$ = this.humanAtlas$.pipe(
    switchMap(atlas => 
      forkJoin(
        atlas.spaces.map(spc => this.sapi.getSpaceDetail(atlas['@id'], spc['@id']))
      ).pipe(
        map(spaces => spaces.find(spc => /152/.test(spc.fullName)))
      )
    )
  )
  public jba29$ = this.humanAtlas$.pipe(
    switchMap(atlas => 
      forkJoin(
        atlas.parcellations.map(parc => this.sapi.getParcDetail(atlas['@id'], parc['@id']))
      ).pipe(
        map(parc => parc.find(p => /2\.9/.test(p.name)))
      )
    )
  )
  public hoc1Left$ = this.jba29$.pipe(
    withLatestFrom(this.humanAtlas$, this.mni152$),
    switchMap(([ parc, atlas, space ]) => this.sapi.getParcRegions(atlas['@id'], parc['@id'], space['@id'])),
    map(regions => regions.find(r => /hoc1/i.test(r.name) && /left/i.test(r.name) ))
  )

  constructor(protected sapi: SAPI){
  }
}

const atlasId = {
  human: 'juelich/iav/atlas/v1.0.0/1'
}

const spaceId = {
  human: {
    mni152: 'minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2'
  }
}

const parcId = {
  human: {
    jba29: "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290"
  }
}

export async function getAtlases(): Promise<SapiAtlasModel[]> {
  return await (await fetch(`${SAPI.bsEndpoint}/atlases`)).json() as SapiAtlasModel[]
}

export async function getAtlas(id: string): Promise<SapiAtlasModel>{
  return await (await fetch(`${SAPI.bsEndpoint}/atlases/${id}`)).json()
}

export async function getParc(atlasId: string, id: string): Promise<SapiParcellationModel>{
  return await (await fetch(`${SAPI.bsEndpoint}/atlases/${atlasId}/parcellations/${id}`)).json()
}

export async function getSpace(atlasId: string, id: string): Promise<SapiSpaceModel> {
  return await (await fetch(`${SAPI.bsEndpoint}/atlases/${atlasId}/spaces/${id}`)).json()
}

export async function getHumanAtlas(): Promise<SapiAtlasModel> {
  return getAtlas(atlasId.human)
}

export async function getMni152(): Promise<SapiSpaceModel> {
  return await (await fetch(`${SAPI.bsEndpoint}/atlases/${atlasId.human}/spaces/${spaceId.human.mni152}`)).json()
}

export async function getJba29(): Promise<SapiParcellationModel> {
  return await getParc(atlasId.human, parcId.human.jba29)
}

export async function getHoc1Left(): Promise<SapiRegionModel> {
  return await (await fetch(`${SAPI.bsEndpoint}/atlases/${atlasId.human}/parcellations/${parcId.human.jba29}/regions/hoc1%20left`)).json()
}

export async function getHoc1Features(): Promise<SapiRegionalFeatureModel[]> {
  return await (await fetch(`${SAPI.bsEndpoint}/atlases/${atlasId.human}/parcellations/${parcId.human.jba29}/regions/hoc1%20left/features`)).json()
}

export async function getJba29Features(): Promise<SapiParcellationFeatureModel[]> {
  return await (await fetch(`${SAPI.bsEndpoint}/atlases/${atlasId.human}/parcellations/${parcId.human.jba29}/features`)).json()
}
