import { Pipe, PipeTransform } from "@angular/core";
import { SxplrMap, SxplrParcellation, SxplrTemplate } from "../sapi/sxplrTypes";
import { defaultdict } from "src/util/fn";
import { IDS } from "../sapi";

export type ReducedMapGroup = {
  id: string
  type: 'reducedMapGrp'
  name: string
  maps: SxplrMap[]
  classifiers: Record<string, string>
}

@Pipe({
  name: 'atlasMapRed',
  pure: true,
  standalone: true
})
export class AtlasMapReducerXform implements PipeTransform {
  public transform(maps: SxplrMap[], parcellations: SxplrParcellation[]): ReducedMapGroup[] {
    const returnArr: ReducedMapGroup[] = []
    const dfdict = defaultdict(() => [] as SxplrMap[])
    const classifiers: Record<string, Record<string, string>> = {}
    for (const m of maps) {
      const classifier: Record<string, string> = {}
      const parc = parcellations.find(p => p.id === m.parcellationId)

      const mapType = m.type.toLowerCase()
      classifier['mapType'] = mapType

      let key = `${mapType} map`
      if (parc?.versionName) {
        key += ` - ${parc.versionName}`
        classifier['version'] = parc.versionName
      } else {
        key += ` - other`
        classifier['version'] = "unknown"
      }
      dfdict[key].push(m)
      classifiers[key] = classifier
    }

    for (const [maptype, maps] of Object.entries(dfdict)) {
      returnArr.push({
        id: maptype,
        type: 'reducedMapGrp',
        name: maptype,
        maps,
        classifiers: classifiers[maptype] || {}
      })
    }
    return returnArr
  }
}

const pipe = new AtlasMapReducerXform()

@Pipe({
  name: 'currAtlasMapRed',
  pure: true,
  standalone: true
})
export class CurrentAtlasMapReduceXform implements PipeTransform {
  public transform(currmap: SxplrMap, maps: SxplrMap[], parcellations: SxplrParcellation[]): ReducedMapGroup | undefined {
    const v = pipe.transform(maps, parcellations)
    return v.find(grp => grp.maps.find(m => m.id === currmap.id))
  }
}

@Pipe({
  name: 'filterMapGrp',
  pure: true,
  standalone: true
})

export class FilterMapGrpPipe implements PipeTransform {
  transform(input: ReducedMapGroup[], classifiers: Record<string, string>[]) {

    if (classifiers.length === 0) {
      return input
    }
    return input.filter(grp => {
      for (const obj of classifiers) {
        for (const key in obj) {
          if (grp.classifiers[key] !== obj[key]) {
            return false
          }
        }
      }
      return true
    })
  }
}

/**
 * Grid / pivot view of maps: rows = parcellation versions (newest first),
 * columns = map type (Labelled / Statistical / ...).
 * Assumes exactly the two classifiers `version` and `mapType`.
 */
export type MapGridCell = {
  maps: SxplrMap[]
  selected: boolean
}

export type MapGridRow = {
  label: string
  parcellation: SxplrParcellation | null
  isNewest: boolean
  isCurrent: boolean
  cells: MapGridCell[]
}

export type MapGrid = {
  columns: { type: SxplrMap["type"], label: string }[]
  rows: MapGridRow[]
}

const COLUMN_ORDER: SxplrMap["type"][] = ["LABELLED", "STATISTICAL", "UNKNOWN"]
const COLUMN_LABEL: Record<SxplrMap["type"], string> = {
  LABELLED: "Labelled",
  STATISTICAL: "Statistical",
  UNKNOWN: "Other",
}
const PARC_ID_MAPPING = {
  [IDS.PARCELLATION.JBABB]: "high resolution",
  // [IDS.PARCELLATION.D64]: "DiFuMo 64",
  // [IDS.PARCELLATION.D128]: "DiFuMo 128",
  // [IDS.PARCELLATION.D256]: "DiFuMo 256",
  // [IDS.PARCELLATION.D512]: "DiFuMo 512",
  // [IDS.PARCELLATION.D1024]: "DiFuMo 1024",
}

@Pipe({
  name: 'mapGridReducer',
  pure: true,
  standalone: true
})
export class MapGridReducerPipe implements PipeTransform {
  transform(maps: SxplrMap[], allParcVersions: SxplrParcellation[], selectedMap?: SxplrMap, parcellations?: SxplrParcellation[]): MapGrid {
    // which columns are actually present, in canonical order
    const presentTypes = new Set(maps.map(m => m.type))
    const columns = COLUMN_ORDER
      .filter(t => presentTypes.has(t))
      .map(type => ({ type, label: COLUMN_LABEL[type] }))

    const byParc = defaultdict(() => [] as SxplrMap[])
    for (const m of maps) {
      byParc[m.parcellationId].push(m)
    }

    const buildCells = (parcMaps: SxplrMap[]): MapGridCell[] =>
      columns.map(col => {
        // maps of different spaces are also here
        const fittingMaps = parcMaps.filter(m => m.type === col.type)
        return { maps: fittingMaps, selected: fittingMaps.some(m => m.id === selectedMap?.id) }
      })

    const rows: MapGridRow[] = []
    const seen = new Set<string>()

    // newest is the last element of allParcVersions -> display descending
    const newestId = allParcVersions[allParcVersions.length - 1]?.id
    for (const parc of [...allParcVersions].reverse()) {
      seen.add(parc.id)
      rows.push({
        label: parc.versionName || parc.shortName || parc.name,
        parcellation: parc,
        isNewest: parc.id === newestId,
        isCurrent: parc.id === selectedMap?.parcellationId,
        cells: buildCells(byParc[parc.id] || []),
      })
    }

    // non-versioned parc: one row per distinct parcellation
    if (allParcVersions.length === 0) {
      for (const [parcId, parcMaps] of Object.entries(byParc)) {
        seen.add(parcId)
        const foundParc = (parcellations || []).find(p => p.id === parcId)
        rows.push({
          label: PARC_ID_MAPPING[parcId] || (foundParc && (foundParc.shortName || foundParc.name)) || parcMaps[0]?.name || parcId,
          parcellation: null,
          isNewest: false,
          isCurrent: parcId === selectedMap?.parcellationId,
          cells: buildCells(parcMaps),
        })
      }
    }

    // anything left over (maps outside the known versions) -> "other"
    const leftover = maps.filter(m => !seen.has(m.parcellationId))
    if (leftover.length) {
      let label = "other"
      for (const m of leftover) {
        const mappedlabel = PARC_ID_MAPPING[m.parcellationId]
        label = mappedlabel
        break
      }
      rows.push({
        label,
        parcellation: null,
        isNewest: false,
        isCurrent: leftover.some(m => m.parcellationId === selectedMap?.parcellationId),
        cells: buildCells(leftover),
      })
    }

    return { columns, rows }
  }
}

@Pipe({
  name: 'gatherMapGrpClassifiers',
  pure: true,
  standalone: true
})

export class GatherMapGrpClassifersPipe implements PipeTransform {
  transform(input: ReducedMapGroup[]): Record<string, string[]> {
    const dfClassifiers = defaultdict(() => new Set<string>())
    for (const obj of input) {
      for (const key in obj.classifiers) {
        dfClassifiers[key].add(obj.classifiers[key])
      }
    }

    const returnV: Record<string, string[]> = {}
    for (const [key, values] of Object.entries(dfClassifiers)) {
      returnV[key] = Array.from(values)
    }
    return returnV
  }
}

@Pipe({
  name: 'mapToSpaces',
  pure: true,
  standalone: true,
})

export class MapToSpacesPipe implements PipeTransform {
  transform(selectedMap: SxplrMap, availableMaps: SxplrMap[], availableSpaces: SxplrTemplate[]): SxplrTemplate[] {
    const filteredMaps = availableMaps.filter(m => m.parcellationId === selectedMap.parcellationId && selectedMap.type === m.type)
    const spaceIdSet = new Set(filteredMaps.map(m => m.spaceId))
    return availableSpaces.filter(sp => spaceIdSet.has(sp.id))
  }
}

interface HasName {
  name: string
}

const BANNED_FEATURENAMES = [
  "ebrains",
  "layerwisebigbrainintensities",
  "BigBrainIntensityProfile",
]

@Pipe({
  name: 'featureCategoryBanFilter',
  pure: true,
  standalone: true,
})

export class FeatureCategoryBanFilePipe<T extends HasName> implements PipeTransform {
  transform(value: T[]): T[] {

    return value.filter(m => 
      !BANNED_FEATURENAMES.some(bannedFeatureName => 
        m.name.toLowerCase().includes(bannedFeatureName.toLocaleLowerCase())
      )
    )

    // return value.filter(m => !BAN_NAME.includes(m.name) )
  }
}