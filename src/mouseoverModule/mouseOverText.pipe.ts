import { Pipe, PipeTransform, SecurityContext } from "@angular/core"
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"
import { TransformOnhoverSegmentPipe } from "./transformOnhoverSegment.pipe"

@Pipe({
  name: 'mouseOverTextPipe',
})

export class MouseOverTextPipe implements PipeTransform {

  private transformOnHoverSegmentPipe: TransformOnhoverSegmentPipe
  constructor(private sanitizer: DomSanitizer) {
    this.transformOnHoverSegmentPipe = new TransformOnhoverSegmentPipe(this.sanitizer)
  }

  private renderText = ({ label, obj }): SafeHtml[] => {
    switch (label) {
    case 'annotation':
      return [this.sanitizer.sanitize(SecurityContext.HTML, obj.name)]
    case 'landmark': {
      const { dataset = [] } = obj
      return [
        this.sanitizer.sanitize(SecurityContext.HTML, obj.landmarkName),
        ...(dataset.map(ds => this.sanitizer.bypassSecurityTrustHtml(`
<span class="text-muted">
  ${this.sanitizer.sanitize(SecurityContext.HTML, ds.name)}
</span>
`)))
      ]
    }
    case 'segments':
      return obj.map(({ segment }) => this.transformOnHoverSegmentPipe.transform(segment))
    case 'userLandmark':
      return [this.sanitizer.sanitize(SecurityContext.HTML, obj.name)]
    default:
      // ts-lint:disable-next-line
      console.warn(`mouseOver.directive.ts#mouseOverTextPipe: Cannot be displayed: label: ${label}`)
      return [this.sanitizer.bypassSecurityTrustHtml(`Cannot be displayed: label: ${label}`)]
    }
  }

  public transform(inc: {annotation: any, segments: any, landmark: any, userLandmark: any})
    : Array<{label: string, text: SafeHtml[], icon?: any}> {
    const keys = Object.keys(inc)
    return keys
      // if is segments, filter out if lengtth === 0
      .filter(key => Array.isArray(inc[key]) ? inc[key].length > 0 : true )
      // for other properties, check if value is defined
      .filter(key => !!inc[key])
      .map(key => {
        return {
          label: key,
          text: this.renderText({ label: key, obj: inc[key]}),
          icon: inc[key].icon
        }
      })
  }
}
