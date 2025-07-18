import { Component, Optional, TemplateRef, ViewChild } from "@angular/core";
import { ARIA_LABELS, CONST } from "common/constants";
import { ModularUserAnnotationToolService } from "../tools/service";
import { IAnnotationGeometry, TExportFormats } from "../tools/type";
import { ComponentStore } from "src/viewerModule/componentStore";
import { debounceTime, map, shareReplay, startWith } from "rxjs/operators";
import { combineLatest, concat, Observable, of, Subscription } from "rxjs";
import { TZipFileConfig } from "src/zipFilesOutput/type";
import { TFileInputEvent } from "src/getFileInput/type";
import { FileInputDirective } from "src/getFileInput/getFileInput.directive";
import { MatSnackBar } from 'src/sharedModules/angularMaterial.exports'
import { unzip } from "src/zipFilesOutput/zipFilesOutput.directive";
import { DialogService } from "src/services/dialogService.service";
import { MatDialog } from "src/sharedModules/angularMaterial.exports";
import { userAnnotationRouteKey } from "../constants";

const README = `{id}.sands.json file contains the data of annotations. {id}.desc.json contains the metadata of annotations.`

@Component({
  selector: 'annotation-list',
  templateUrl: './annotationList.template.html',
  styleUrls: ['./annotationList.style.css'],
  providers: [
    ComponentStore,
  ],
  exportAs: 'annotationListCmp'
})
export class AnnotationList {

  public userAnnRoute = {}

  public ARIA_LABELS = ARIA_LABELS

  @ViewChild(FileInputDirective)
  fileInput: FileInputDirective

  private subs: Subscription[] = []
  private managedAnnotations: IAnnotationGeometry[] = []
  public managedAnnotations$ = this.annotSvc.spaceFilteredManagedAnnotations$
  public annotationInOtherSpaces$ = this.annotSvc.otherSpaceManagedAnnotations$

  public descText$ = combineLatest([
    this.managedAnnotations$,
    this.annotationInOtherSpaces$
  ]).pipe(
    map(([ annot, otherAnnot ]) => {
      if (annot.length === 0 && otherAnnot.length === 0) {
        return `Custom URL will not contain any annotations.`
      }
      let message = `Custom URL will also contain `
      if (annot.length > 0) {
        message += `${annot.length} annotation(s) in this reference space `
      }
      if (otherAnnot.length > 0) {
        message += `${otherAnnot.length} annotation(s) in other reference spaces.`
      }
      return message
    })
  )

  public manAnnExists$ = this.managedAnnotations$.pipe(
    map(arr => !!arr && arr.length > 0),
    startWith(false)
  )

  public filesExport$: Observable<TZipFileConfig[]> = concat(
    of([] as IAnnotationGeometry[]),
    this.managedAnnotations$
  ).pipe(
    debounceTime(0),
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
      const annotationDesc = manAnns.map(ann => {
        return {
          filename: `${ann.id}.desc.json`,
          filecontent: JSON.stringify(ann.toMetadata(), null, 2)
        }
      })
      return [ readme, ...annotationSands, ...annotationDesc ]
    }),
    shareReplay(1),
  )
  constructor(
    private annotSvc: ModularUserAnnotationToolService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    cStore: ComponentStore<{ useFormat: TExportFormats }>,
    @Optional() private dialogSvc: DialogService,
  ) {
    cStore.setState({
      useFormat: 'sands'
    })

    this.subs.push(
      this.managedAnnotations$.subscribe(anns => this.managedAnnotations = anns),
      combineLatest([
        this.managedAnnotations$.pipe(
          startWith([] as IAnnotationGeometry[])
        ),
        this.annotationInOtherSpaces$.pipe(
          startWith([] as IAnnotationGeometry[])
        )
      ]).subscribe(([ann, annOther]) => {
        this.userAnnRoute = {
          [userAnnotationRouteKey]: [
            ...ann.map(a => a.toJSON()),
            ...annOther.map(a => a.toJSON()),
          ]
        }
      })
    )
  }

  public hiddenAnnotations$ = this.annotSvc.hiddenAnnotations$
  toggleManagedAnnotationVisibility(id: string) {
    this.annotSvc.toggleAnnotationVisibilityById(id)
  }

  private parseAndAddAnnotation(input: string) {
    const json = JSON.parse(input)
    const annotation = this.annotSvc.parseAnnotationObject(json)
    if (annotation) this.annotSvc.importAnnotation(annotation)
  }

  async handleImportEvent(ev: TFileInputEvent<'text' | 'file'>){

    const { abort } = this.dialogSvc.blockUserInteraction({
      title: CONST.LOADING_TXT,
      markdown: CONST.LOADING_ANNOTATION_MSG,
    })
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
    } finally {
      abort()
    }
  }

  async deleteAllAnnotation(){
    if (this.dialogSvc) {
      try {
        await this.dialogSvc.getUserConfirm({
          markdown: CONST.DELETE_ALL_ANNOTATION_CONFIRMATION_MSG
        })

        for (const ann of this.managedAnnotations) {
          ann.remove()
        }
      } catch (e) {
        // aborted
      }
    } else {
      if (window.confirm(CONST.DELETE_ALL_ANNOTATION_CONFIRMATION_MSG)) {

        for (const ann of this.managedAnnotations) {
          ann.remove()
        }
      }
    }
  }

  public openDialog(template: TemplateRef<any>) {
    this.dialog.open(template)
  }
}
