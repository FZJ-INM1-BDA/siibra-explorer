import { Pipe, PipeTransform } from "@angular/core";
import { TOnHoverObj } from "./util";

function render<T extends keyof TOnHoverObj>(key: T, value: TOnHoverObj[T]){
  if (!value) return []
  switch (key) {
  case 'regions': {
    return (value as TOnHoverObj['regions']).map(seg => {
      return {
        icon: {
          fontSet: 'fas',
          fontIcon: 'fa-brain'
        },
        text: seg?.name || "Unknown"
      }
    })
  }
  case 'voi': {
    const { name } = value as TOnHoverObj['voi']
    return [{
      icon: {
        fontSet: 'fas',
        fontIcon: 'fa-database'
      },
      text: name
    }]
  }
  case 'annotation': {
    const { annotationType, name } = (value as TOnHoverObj['annotation'])
    let fontIcon: string
    if (annotationType === 'Point') fontIcon = 'fa-circle'
    if (annotationType === 'Line') fontIcon = 'fa-slash'
    if (annotationType === 'Polygon') fontIcon = 'fa-draw-polygon'
    if (!annotationType) fontIcon = 'fa-file'
    return [{
      icon: {
        fontSet: 'fas',
        fontIcon
      },
      text: name || `Unnamed ${annotationType}`
    }]
  }
  default: {
    return [{
      icon: {
        fontSet: 'fas',
        fontIcon: 'fa-file',
      },
      text: `Unknown hovered object`
    }]
  }
  }
}

type TCvtOutput = {
  icon: {
    fontSet: string
    fontIcon: string
  }
  text: string
}

@Pipe({
  name: 'mouseoverCvt',
  pure: true
})

export class MouseOverConvertPipe implements PipeTransform{

  public transform(dict: TOnHoverObj){
    const output: TCvtOutput[] = []
    for (const key in dict) {
      output.push(
        ...render(key as keyof TOnHoverObj, dict[key])
      )
    }
    return output
  }
}