import {Directive, HostListener, Input} from "@angular/core";
import * as JSZip from "jszip";

@Directive({
  selector: '[export-annotations]'
})
export class ExportAnnotation {

  @Input('export-annotations') input: any

  @HostListener('click')
  onClick() {
    console.log(this.input)
    this.exportAnnotations({...this.input})
  }

  getSandsObj(position, template) {
    return {
      coordinates: {
        value: position.split(',').map(p => +p),
        unit: 'mm'
      },
      coordinateSpace: {
        fullName: template.name,
        versionIdentifier: template.id
      }
    }
  }

  exportAnnotations(annotations, sands = false) {

    const zip = new JSZip()
    const zipFileName = `annotation - ${annotations[0].atlas.name}.zip`

    if (sands) {
      annotations.forEach(a => {
        zip.folder(a.name)
        if (a.positions) {
          a.positions.forEach(p => {
            zip.folder(a.name).file(`${p.position}.json`, JSON.stringify(this.getSandsObj(p.position, a.template)))
          })
        } else {
          zip.folder(a.name).file(`${a.position1}.json`, JSON.stringify(this.getSandsObj(a.position1, a.template)))
          if (a.position2) zip.folder(a.name).file(`${a.position1}.json`, JSON.stringify(this.getSandsObj(a.position2, a.template)))
        }
      })
    } else {
      annotations.forEach(a => {
        const fileName = a.name.replace(/[\\/:*?"<>|]/g, "").trim()
        zip.file(`${fileName}.json`, JSON.stringify(a))
      })
    }


    zip.file("README.txt",
      `The annotation has been extracted from the atlas: "${annotations.map(a => a.atlas.name).filter((v, i, a) => a.indexOf(v) === i).join()}" 
        and template(s): "${annotations.map(a => a.template.name).filter((v, i, a) => a.indexOf(v) === i).join()}"`)
    zip.generateAsync({
      type: "base64"
    }).then(content => {
      const link = document.createElement('a')
      link.href = 'data:application/zip;base64,' + content
      link.download = zipFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
  }

}
