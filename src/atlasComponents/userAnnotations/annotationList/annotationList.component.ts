import { Component, inject, Optional, ViewChild } from "@angular/core";
import { ARIA_LABELS, CONST } from "common/constants";
import { ModularUserAnnotationToolService } from "../tools/service";
import { IAnnotationGeometry, TExportFormats } from "../tools/type";
import { ComponentStore } from "src/viewerModule/componentStore";
import { debounceTime, map, shareReplay, startWith } from "rxjs/operators";
import { combineLatest, concat, Observable, of, Subscription } from "rxjs";
import { TZipFileConfig } from "src/zipFilesOutput/type";
import { FileInputDirective } from "src/getFileInput/getFileInput.directive";
import { DialogService } from "src/services/dialogService.service";
import { userAnnotationRouteKey } from "../constants";
import { DragDropCallback, REGISTER_USER_DRAG_DROP } from "src/util/injectionTokens"

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
      return [ readme, ...annotationSands ]
    }),
    shareReplay(1),
  )
  
  #dndCbs: (DragDropCallback)[] = []
  constructor(
    private annotSvc: ModularUserAnnotationToolService,
    cStore: ComponentStore<{ useFormat: TExportFormats }>,
    @Optional() private dialogSvc: DialogService,
  ) {
    cStore.setState({
      useFormat: 'sands'
    })

    const dndCbs = inject(REGISTER_USER_DRAG_DROP) as DragDropCallback[]
    this.#dndCbs = dndCbs    

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

  /**
   * @deprecated this handler should be removed, as drag drop onto the atlas canvas
   * already does what this import does.
   */
  async handleImportEvent(ev: any){
    for (const f of this.#dndCbs){
      f(ev)
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
}
