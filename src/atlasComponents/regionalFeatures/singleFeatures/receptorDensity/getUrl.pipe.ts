import { Pipe, PipeTransform } from "@angular/core";
import { IHasId } from "src/util/interfaces";

interface IReceptorDatum extends IHasId{
  ['@context']: {
    [key: string]: string
  }
  filename: string
  mimetype: string
  url: string | {
    url: string
    ['receptors.tsv']: string
  }
}

interface IHRef{
  url: string
  filename: string
}

@Pipe({
  name: 'getUrls',
  pure: true
})

export class GetUrlsPipe implements PipeTransform{
  public transform(input: IReceptorDatum): IHRef[]{
    const output: IHRef[] = []
    let _url = typeof input.url === 'string'
      ? input.url
      : input.url.url

    for (const key in (input['@context'] || {})) {
      _url = _url.replace(`${key}:`, input['@context'][key])
    }

    const match = /\/([\w-.]+)$/.exec(_url)
    output.push({
      url: _url,
      filename: match ? match[1] : 'download'
    })
    return output
  }
}

