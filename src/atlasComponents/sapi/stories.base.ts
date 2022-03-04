import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionalFeatureModel, SapiRegionModel, SapiSpaceModel } from "."
import { SapiParcellationFeatureModel } from "./type"
import addons from '@storybook/addons';
import { DARKTHEME } from "src/util/injectionTokens";
import { APP_INITIALIZER, NgZone } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { BehaviorSubject } from "rxjs";

export function addAddonEventListener(eventName: string, callback: (...args: any[]) => void){
  const channel = addons.getChannel()
  channel.on(eventName, callback)
  return () => channel.off(eventName, callback)
}

export const provideDarkTheme = [{
  provide: DARKTHEME,
  useFactory: (zone: NgZone, document: Document) => {
    const useDarkTheme = document.body.getAttribute('darktheme') === "true"
    const sub = new BehaviorSubject(useDarkTheme)
    addAddonEventListener("DARK_MODE", flag => {
      zone.run(() => {
        sub.next(flag)
      })
    })
    return sub
  },
  deps: [ NgZone, DOCUMENT ]
}, {
  provide: APP_INITIALIZER,
  multi: true,
  useFactory: (document: Document) => {
    addAddonEventListener("DARK_MODE", flag => {
      document.body.setAttribute('darktheme', flag.toString())
    })
    return () => Promise.resolve()
  }, 
  deps: [ DOCUMENT ]
}]

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

export async function getHoc1FeatureDetail(featId: string): Promise<SapiRegionalFeatureModel>{
  return await (await fetch(`${SAPI.bsEndpoint}/atlases/${atlasId.human}/parcellations/${parcId.human.jba29}/regions/hoc1%20left/features/${encodeURIComponent(featId)}`)).json()
}

export async function getJba29Features(): Promise<SapiParcellationFeatureModel[]> {
  return await (await fetch(`${SAPI.bsEndpoint}/atlases/${atlasId.human}/parcellations/${parcId.human.jba29}/features`)).json()
}
