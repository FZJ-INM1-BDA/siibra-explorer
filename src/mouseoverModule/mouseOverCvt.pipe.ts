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
          fontIcon: 'fa-brain',
          cls: 'fas fa-brain',
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
        fontIcon: 'fa-database',
        cls: 'fas fa-database'
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
        fontIcon,
        cls: `fas ${fontIcon}`,
      },
      text: name || `Unnamed ${annotationType}`
    }]
  }
  default: {
    return [{
      icon: {
        fontSet: 'fas',
        fontIcon: 'fa-file',
        cls: 'fas fa-file'
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
    cls: string
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