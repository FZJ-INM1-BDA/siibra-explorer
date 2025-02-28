import { Injectable } from "@angular/core";
import { take } from "rxjs/operators";

import { SAPI } from "./sapi.service";
import { SxplrAtlas, SxplrParcellation, SxplrTemplate } from "./sxplrTypes";

type PossibleATP = {
  atlases: SxplrAtlas[]
  spaces: SxplrTemplate[]
  parcellations: SxplrParcellation[]
}

@Injectable({
  providedIn: "root"
})
export class DecisionCollapse{
  constructor(private sapi: SAPI){}

  cleanup<T>(val: T[]|T|null){
    if (!val) {
      return []
    }
    if (Array.isArray(val)){
      return val?.filter(v => !!v) || []
    }
    return [val]
  }

  async collapseAtlasId(atlasId: string): Promise<PossibleATP> {
    const atlases = await this.sapi.atlases$.pipe(
      take(1)
    ).toPromise()
    const atlas = atlases.find(a => a.id === atlasId)
    const parcellations = atlas && await this.sapi.getAllParcellations(atlas).toPromise()
    const spaces = atlas && await this.sapi.getAllSpaces(atlas).toPromise()

    return {
      atlases: this.cleanup(atlas),
      parcellations: this.cleanup(parcellations),
      spaces: this.cleanup(spaces),
    }
  }
  
  async collapseTemplateId(templateId: string): Promise<PossibleATP> {
    const atlases = await this.sapi.atlases$.pipe(
      take(1)
    ).toPromise()

    const atlasId = this.sapi.reverseLookupAtlas(templateId)
    const atlas = atlasId && atlases.find(a => a.id === atlasId)
    const spaces = atlas && await this.sapi.getAllSpaces(atlas).toPromise()

    const space = spaces.find(s => s.id === templateId)
    const parcellations = atlas && space && await this.sapi.getSupportedParcellations(atlas, space).toPromise()

    return {
      atlases: this.cleanup(atlas),
      parcellations: this.cleanup(parcellations),
      spaces: this.cleanup(space),
    }
  }

  async collapseParcId(parcellationId: string): Promise<PossibleATP> {
    const atlases = await this.sapi.atlases$.pipe(
      take(1)
    ).toPromise()

    const atlasId = this.sapi.reverseLookupAtlas(parcellationId)
    const atlas = atlasId && atlases.find(a => a.id === atlasId)
    const parcellations = atlas && await this.sapi.getAllParcellations(atlas).toPromise()
    
    const parcellation = parcellations && parcellations.find(p => p.id === parcellationId)
    const spaces = atlas && parcellation && await this.sapi.getSupportedTemplates(atlas, parcellation).toPromise()

    return {
      atlases: this.cleanup(atlas),
      parcellations: this.cleanup(parcellation),
      spaces: this.cleanup(spaces),
    }
  }

  static _Intersect(parta: PossibleATP, partb: PossibleATP): PossibleATP {
    const partbAtlasIds = partb.atlases.map(a => a.id)
    const partbParcIds = partb.parcellations.map(a => a.id)
    const partbSpaceIds = partb.spaces.map(a => a.id)
    return {
      atlases: parta.atlases.filter(a => partbAtlasIds.includes(a.id)),
      parcellations: parta.parcellations.filter(a => partbParcIds.includes(a.id)),
      spaces: parta.spaces.filter(a => partbSpaceIds.includes(a.id)),
    }
  }

  static Intersect(...allATPs: (PossibleATP|null)[]): PossibleATP {
    let result: PossibleATP
    for (const item of allATPs) {
      if (!item) {
        continue
      }
      if (!result) {
        result = item
        continue
      }
      result = DecisionCollapse._Intersect(result, item)
    }
    return result
  }

  /**
   * @param result 
   * @returns error of Verify as a list of string
   */
  static Verify(result: PossibleATP|null): string[] {
    const errorMessage: string[] = []
    if (!result) {
      errorMessage.push(`Result is nullish.`)
    }
    if (result?.atlases.length === 0) {
      errorMessage.push(`No overlapping atlas is found!`)
    }
    if (result?.parcellations.length === 0) {
      errorMessage.push(`No overlapping parcellation is found!`)
    }
    if (result?.spaces.length === 0) {
      errorMessage.push(`No overlapping space is found!`)
    }
    return errorMessage
  }
}
