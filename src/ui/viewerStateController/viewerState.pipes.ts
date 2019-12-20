import { Pipe, PipeTransform } from "@angular/core";
import { RegionSelection } from "src/services/state/userConfigState.store";

@Pipe({
  name: 'binSavedRegionsSelectionPipe',
})

export class BinSavedRegionsSelectionPipe implements PipeTransform {
  public transform(regionSelections: RegionSelection[]): Array<{parcellationSelected: any, templateSelected: any, regionSelections: RegionSelection[]}> {
    const returnMap = new Map()
    for (const regionSelection of regionSelections) {
      const key = `${regionSelection.templateSelected.name}\n${regionSelection.parcellationSelected.name}`
      const existing = returnMap.get(key)
      if (existing) { existing.push(regionSelection) } else { returnMap.set(key, [regionSelection]) }
    }
    return Array.from(returnMap)
      .map(([_, regionSelections]) => {
        const {parcellationSelected = null, templateSelected = null} = regionSelections[0] || {}
        return {
          regionSelections,
          parcellationSelected,
          templateSelected,
        }
      })
  }
}

@Pipe({
  name: 'savedRegionsSelectionBtnDisabledPipe',
})

export class SavedRegionsSelectionBtnDisabledPipe implements PipeTransform {
  public transform(regionSelection: RegionSelection, templateSelected: any, parcellationSelected: any): boolean {
    return regionSelection.parcellationSelected.name !== parcellationSelected.name
      || regionSelection.templateSelected.name !== templateSelected.name
  }
}
