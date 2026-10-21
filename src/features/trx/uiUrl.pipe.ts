import { Pipe, PipeTransform } from "@angular/core";

const PREFIX = "dp-"

const UI_BASEURL = "https://data-proxy.ebrains.eu"

@Pipe({
  name: 'toUiPipe',
  pure: true,
  standalone: true,
})

export class DPTRXToUIPipe implements PipeTransform {
  public transform(value: string) {
    if (value.startsWith(PREFIX)) {
      value = value.slice(PREFIX.length)
    }
    const [bucketname, ...rest] = value.split("/")
    const path = rest.join("/")
    return `${UI_BASEURL}/${bucketname}?prefix=${encodeURIComponent(path)}`
  }
}