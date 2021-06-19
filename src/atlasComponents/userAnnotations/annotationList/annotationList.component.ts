import {Component, ViewChild} from "@angular/core";
import {ARIA_LABELS} from "common/constants";
import { ModularUserAnnotationToolService } from "../tools/service";
import { IAnnotationGeometry, TExportFormats } from "../tools/type";
import { ComponentStore } from "src/viewerModule/componentStore";
import { map, startWith, tap } from "rxjs/operators";
import { Observable } from "rxjs";
import { TZipFileConfig } from "src/zipFilesOutput/type";
import { TFileInputEvent } from "src/getFileInput/type";
import { FileInputDirective } from "src/getFileInput/getFileInput.directive";
import { MatSnackBar } from "@angular/material/snack-bar";
import { unzip } from "src/zipFilesOutput/zipFilesOutput.directive";

const README = 'EXAMPLE OF READ ME TEXT'

@Component({
  selector: 'annotation-list',
  templateUrl: './annotationList.template.html',
  styleUrls: ['./annotationList.style.css'],
  providers: [
    ComponentStore,
  ]
})
export class AnnotationList {

  public ARIA_LABELS = ARIA_LABELS


  @ViewChild(FileInputDirective)
  fileInput: FileInputDirective

  public managedAnnotations$ = this.annotSvc.managedAnnotations$

  public manAnnExists$ = this.managedAnnotations$.pipe(
    map(arr => !!arr && arr.length > 0),
    startWith(false)
  )

  public filesExport$: Observable<TZipFileConfig[]> = this.managedAnnotations$.pipe(
    startWith([] as IAnnotationGeometry[]),
    map(manAnns => {
      const readme = {
        filename: 'README.md',
        filecontent: README,
      }
      const annotationSands = manAnns.map(ann => {
        return {
          filename: `${ann.id}.sands.json`,
          filecontent: JSON.stringify(ann.toSands(), null, 2),
        }
      })
      return [ readme, ...annotationSands ]
    })
  )
  constructor(
    private annotSvc: ModularUserAnnotationToolService,
    private snackbar: MatSnackBar,
    cStore: ComponentStore<{ useFormat: TExportFormats }>,
  ) {
    cStore.setState({
      useFormat: 'sands'
    })
  }

  public hiddenAnnotations$ = this.annotSvc.hiddenAnnotations$
  toggleManagedAnnotationVisibility(id: string) {
    this.annotSvc.toggleAnnotationVisibilityById(id)
  }

  private parseAndAddAnnotation(input: string) {
    const json = JSON.parse(input)
    const annotation = this.annotSvc.parseAnnotationObject(json)
    this.annotSvc.importAnnotation(annotation)
  }

  async handleImportEvent(ev: TFileInputEvent<'text' | 'file'>){
    try {
      const clearFileInputAndInform = () => {
        if (this.fileInput) {
          this.fileInput.clear()
        }
        this.snackbar.open('Annotation imported successfully!', 'Dismiss', {
          duration: 3000
        })
      }

      if (ev.type === 'text') {
        const input = (ev as TFileInputEvent<'text'>).payload.input
        /**
         * parse as json, and go through the parsers
         */
        this.parseAndAddAnnotation(input)
        clearFileInputAndInform()
        return
      }
      if (ev.type === 'file') {
        const files = (ev as TFileInputEvent<'file'>).payload.files
        if (files.length === 0) throw new Error(`Need at least one file.`)
        if (files.length > 1) throw new Error(`Parsing multiple files are not yet supported`)
        const file = files[0]
        const isJson = /\.json$/.test(file.name)
        const isZip = /\.zip$/.test(file.name)
        if (isZip) {
          const files = await unzip(file)
          const sands = files.filter(f => /\.json$/.test(f.filename))
          for (const sand of sands) {
            this.parseAndAddAnnotation(sand.filecontent)
          }
          clearFileInputAndInform()
        }
        if (isJson) {
          const reader = new FileReader()
          reader.onload = evt => {
            const out = evt.target.result
            this.parseAndAddAnnotation(out as string)
            clearFileInputAndInform()
          }
          reader.onerror = e => { throw e }
          reader.readAsText(file, 'utf-8')
        }
        /**
         * check if zip or json
         */
        return
      }
    } catch (e) {
      this.snackbar.open(`Error importing: ${e.toString()}`, 'Dismiss', {
        duration: 3000
      })
    }
  }
}
