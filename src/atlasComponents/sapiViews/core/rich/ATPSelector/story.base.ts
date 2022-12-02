import { getAtlases, getParcellations, getSpaces } from "src/atlasComponents/sapi/stories.base"
import { SapiAtlasModel, SapiParcellationModel, SapiSpaceModel } from "src/atlasComponents/sapi/type"

export const wrapperDecoratorFn = (story: string) => `
  <style>
  .wrapper {
    width: 100%;
    height: 100%;
    background-color: white;

    display: flex;
    flex-direction: column-reverse;
    border: 1px solid rgba(128, 128, 128, 0.5);
  }
  :host-context([darktheme="true"]) .wrapper
  {
    background-color: #2f2f2f;
  }
  </style>
  <div class="wrapper">${story}</div>
`

export type ReturnAtlas = {
  atlas: SapiAtlasModel
  spaces: SapiSpaceModel[]
  parcs: SapiParcellationModel[]
}

export const loadAtlasEtcData = async () => {
  const combinedAtlases: ReturnAtlas[] = []
  const atlases = await getAtlases()
  for (const atlas of atlases) {
    const parcs = await getParcellations(atlas["@id"])
    const spaces = await getSpaces(atlas["@id"])
    combinedAtlases.push({
      atlas,
      parcs,
      spaces
    })
  }
  return { combinedAtlases, atlases }
}
