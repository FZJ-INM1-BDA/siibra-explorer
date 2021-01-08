import { Pipe, PipeTransform } from "@angular/core"

@Pipe({
  name: 'mouseOverIconPipe',
})

export class MouseOverIconPipe implements PipeTransform {

  public transform(type: string): {fontSet: string, fontIcon: string} {

    switch (type) {
    case 'landmark':
      return {
        fontSet: 'fas',
        fontIcon: 'fa-map-marker-alt',
      }
    case 'segments':
      return {
        fontSet: 'fas',
        fontIcon: 'fa-brain',
      }
    case 'userLandmark':
      return {
        fontSet: 'fas',
        fontIcon: 'fa-map-marker-alt',
      }
    default:
      return {
        fontSet: 'fas',
        fontIcon: 'fa-file',
      }
    }
  }
}
