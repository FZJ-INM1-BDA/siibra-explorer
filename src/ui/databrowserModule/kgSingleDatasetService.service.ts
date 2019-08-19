import { Injectable } from "@angular/core";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service"

@Injectable({ providedIn: 'root' })
export class KgSingleDatasetService {

  constructor(private constantService: AtlasViewerConstantsServices) {
  }

  public getInfoFromKg({ kgId, kgSchema = 'minds/core/dataset/v1.0.0' }: Partial<KgQueryInterface>) {
    const _url = new URL(`${this.constantService.backendUrl}datasets/kgInfo`)
    const searchParam = _url.searchParams
    searchParam.set('kgSchema', kgSchema)
    searchParam.set('kgId', kgId)
    return fetch(_url.toString())
      .then(res => {
        if (res.status >= 400) throw new Error(res.status.toString())
        return res.json()
      })
  }

  public downloadZipFromKg({ kgSchema = 'minds/core/dataset/v1.0.0', kgId } : Partial<KgQueryInterface>, filename = 'download'){
    const _url = new URL(`${this.constantService.backendUrl}datasets/downloadKgFiles`)
    const searchParam = _url.searchParams
    searchParam.set('kgSchema', kgSchema)
    searchParam.set('kgId', kgId)
    return fetch(_url.toString())
      .then(res => {
        if (res.status >= 400) throw new Error(res.status.toString())
        return res.blob()
      })
      .then(data => this.simpleDownload(data, filename))
  }

  public simpleDownload(data, filename) {
    const blob = new Blob([data], { type: 'application/zip'})
    const url= window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.download = filename + '.zip';
    anchor.href = url;
    anchor.click();
  }
}

interface KgQueryInterface{
  kgSchema: string
  kgId: string
}