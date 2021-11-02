import { Pipe, PipeTransform } from "@angular/core";
import { TOnHoverObj } from "./util";

function render<T extends keyof TOnHoverObj>(key: T, value: TOnHoverObj[T]){
  if (!value) return []
  switch (key) {
  case 'segments': {
    return (value as TOnHoverObj['segments']).map(seg => {
      return {
        icon: {
          fontSet: 'fas',
          fontIcon: 'fa-brain'
        },
        text: typeof seg.segment === 'string'
          ? seg.segment
          : seg.segment.name
      }
    })
  }
  case 'landmark': {
    return [{
      icon: {
        fontSet: 'fas',
        fontIcon: 'fa-map-marker-alt',
      },
      text: (value as TOnHoverObj['landmark']).landmarkName
    }]
  }
  case 'userLandmark': {
    return [{
      icon: {
        fontSet: 'fas',
        fontIcon: 'fa-map-marker-alt',
      },
      text: value as TOnHoverObj['userLandmark']
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