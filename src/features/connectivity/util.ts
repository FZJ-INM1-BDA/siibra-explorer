import { SPECIES_ENUM } from 'src/util/constants';
import { IDS } from 'src/atlasComponents/sapi';

type ConnectiivtyFilter = {
  SPECIES: string[]
  PARCELLATION: string[]
  SPACE: string[]
}

export const WHITELIST_CONNECTIVITY: ConnectiivtyFilter = {
  SPECIES: [
    SPECIES_ENUM.RATTUS_NORVEGICUS,
    SPECIES_ENUM.HOMO_SAPIENS
  ],
  PARCELLATION: [
    IDS.PARCELLATION.JBA29,
    IDS.PARCELLATION.JBA30,
    IDS.PARCELLATION.WAXHOLMV4
  ],
  SPACE: [],
}

export const EXPERIMENTAL_CONNECTIVITY: ConnectiivtyFilter = {
  SPECIES: [],
  PARCELLATION: [
    IDS.PARCELLATION.JBA31,
  ],
  SPACE: [],
}

export const BANLIST_CONNECTIVITY: ConnectiivtyFilter = {
  SPECIES: [],
  PARCELLATION: [],
  SPACE: [
    IDS.TEMPLATES.BIG_BRAIN
  ]
}
