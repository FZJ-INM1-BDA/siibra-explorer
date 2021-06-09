import {Directive, HostListener, Input} from "@angular/core";
import {AnnotationService} from "src/atlasComponents/userAnnotations/annotationService.service";

@Directive({
  selector: '[import-annotations]'
})
export class ImportAnnotation {

  @Input('import-annotations') input: any

  constructor(private ans: AnnotationService) {}

  @HostListener('change', ['$event.target'])
  onClick(target: any) {
    if (target.files.length) {
      this.importFile(target.files[0])
    }
  }

  importFile(file) {
    const sands = this.input.sands || null

    const fileReader = new FileReader()
    fileReader.readAsText(file, "UTF-8")
    fileReader.onload = () => {
      const fileData = JSON.parse(fileReader.result.toString())

      if (sands) {
        if (!fileData.coordinates || !fileData.coordinates.value || fileData.coordinates.value.length !== 3
                    || !fileData.coordinateSpace || !fileData.coordinateSpace.fullName || !fileData.coordinateSpace.versionIdentifier) {
          return
        }
        const position1 = this.ans.mmToVoxel(fileData.coordinates.value)
        this.ans.saveAnnotation({position1,
          template: {
            name: fileData.coordinateSpace.fullName,
            id: fileData.coordinateSpace.versionIdentifier
          },
          type: 'point'})
      } else {
        const {id, name, description, type,
          atlas, template, positions, annotations} = fileData

        if (!id || !(fileData.position1 || positions) || !type) {
          return
        }

        if (fileData.type !== 'polygon') {
          const position1 = this.ans.mmToVoxel(fileData.position1.split(',').map(Number))
          const position2 = fileData.position2 && this.ans.mmToVoxel(fileData.position2.split(',').map(Number))

          this.ans.saveAnnotation({position1, position2,
            name, description, type, atlas, template
          })
        } else if (annotations) {
          annotations.forEach(a => {
            this.ans.saveAnnotation({
              id: a.id,
              name, description,
              position1: a.position1,
              position2: a.position2,
              type: 'polygon'})
          })
          this.ans.groupedAnnotations.push(fileData)
          this.ans.refreshFinalAnnotationList()
        }

      }
    }
    fileReader.onerror = (error) => {
      console.warn(error)
    }
  }
}
