import {Pipe, PipeTransform} from "@angular/core";

@Pipe({ name: 'groupAnnotationPolygons'})
export class GroupAnnotationPolygons implements PipeTransform {

  transform(annotations: any[]) {

    // let transformed = [...annotations]

    // for (let i = 0; i<annotations.length; i++) {
    //   if (annotations[i].type === 'polygon') {
    //     const annotationId = annotations[i].id.split('_')
    //     if (!transformed.find(t => t.id === annotationId[0])) {
    //       const polygonAnnotations = annotations.filter(a => a.id.split('_')[0] === annotationId[0])
    //
    //       transformed = transformed.filter(a => a.id.split('_')[0] !== annotationId[0])
    //
    //       transformed.push({
    //         id: annotationId[0],
    //         type: 'polygonParent',
    //         annotations: polygonAnnotations,
    //         templateName: annotations[i].templateName
    //       })
    //     }
    //   }
    // }
    // return transformed

    return annotations.filter(a => a.type !== 'polygon' || +a.id.split('_')[1] === 0)
  }
}
