import { IDS } from "src/atlasComponents/sapi/constants"
import { SAPI } from "src/atlasComponents/sapi/sapi.service"
import { SapiParcellationModel } from "src/atlasComponents/sapi/type"
import { getTraverseFunctions } from "./parcellationVersion.pipe"

describe(`parcellationVersion.pipe.ts (endpoint at ${SAPI.bsEndpoint})`, () => {
  describe("getTraverseFunctions", () => {
    let julichBrainParcellations: SapiParcellationModel[] = []
    beforeAll(async () => {
      const res = await fetch(`${SAPI.bsEndpoint}/atlases/${encodeURIComponent(IDS.ATLAES.HUMAN)}/parcellations`)
      const arr: SapiParcellationModel[] = await res.json()
      julichBrainParcellations = arr.filter(it => /Julich-Brain Cytoarchitectonic Maps/.test(it.name))
    })
    it("> should be at least 3 parcellations", () => {
      expect(julichBrainParcellations.length).toBeGreaterThanOrEqual(3)
    })

    const scenarios = [{
      name: "default",
      inputFlag: undefined,
      expect25: false
    },{
      name: "skipDeprecated set to true",
      inputFlag: true,
      expect25: false
    },{
      name: "skipDeprecated set to false",
      inputFlag: false,
      expect25: true
    }]

    for (const { name, inputFlag, expect25} of scenarios) {
      describe(name, () => {
        it(`expect to find 25: ${expect25}`, () => {
          const { findNewer, findOldest } = typeof inputFlag === "undefined"
          ? getTraverseFunctions(julichBrainParcellations)
          : getTraverseFunctions(julichBrainParcellations, inputFlag)
          let cursor: SapiParcellationModel = findOldest()
          let foundFlag: boolean = false
          while (cursor) {
            if (cursor.name === "Julich-Brain Cytoarchitectonic Maps 2.5") {
              if (expect25) foundFlag = true
              break
            }
            cursor = findNewer(cursor)
          }
          expect(foundFlag).toEqual(expect25)
        })
      })
    }
  })
})