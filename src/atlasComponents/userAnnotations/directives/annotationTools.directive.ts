import { createComponent, Directive, EnvironmentInjector, inject, Inject, Injector, Input, Optional } from "@angular/core";
import { ModularUserAnnotationToolService, RegisteredTool } from "../tools/service";
import { ANNOTATION_EVENT_INJ_TOKEN, IAnnotationEvents, IAnnotationGeometry, TAnnotationEvent, UDPATE_ANNOTATION_TOKEN } from "../tools/type";
import { combineLatest, concat, Observable, of, Subject } from "rxjs";
import { debounceTime, filter, map, shareReplay, startWith, take, takeUntil, withLatestFrom } from "rxjs/operators";
import { ComponentStore } from "@ngrx/component-store";
import { CLICK_INTERCEPTOR_INJECTOR, ClickInterceptor } from "src/util";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { TFileInputEvent } from "src/getFileInput/type";
import { DialogService } from "src/services/dialogService.service";
import { enLabels } from "src/uiLabels";
import { MatSnackBar } from "src/sharedModules";
import { FileInputDirective } from "src/getFileInput/getFileInput.directive";
import { unzip } from "src/zipFilesOutput/zipFilesOutput.directive";
import { TZipFileConfig } from "src/zipFilesOutput/type";
import { userAnnotationRouteKey } from "../constants";

const BLOCKING_TOOLNAMES = [
  "Point",
  "Line",
  "Polygon",
]

const README = `{id}.sands.json file contains the data of annotations. {id}.desc.json contains the metadata of annotations.`


@Directive({
  selector: '[sxplr-annot-tools]',
  exportAs: 'sxplrAnnotTools',
  hostDirectives: [
    DestroyDirective
  ]
})

export class SxplrAnnotToolsDirective {
  
  #destroy$ = inject(DestroyDirective).destroyed$

  #envInj = inject(EnvironmentInjector)
  tools$ = this.svc.annotationTools$

  managedAnnotations$ = this.svc.spaceFilteredManagedAnnotations$
  annotationInOtherSpaces$ = this.svc.otherSpaceManagedAnnotations$

  hasManagedAnnotations$ = this.managedAnnotations$.pipe(
    map(ann => ann.length > 0),
    startWith(false)
  )

  stateToMerge$ = combineLatest([
    this.managedAnnotations$.pipe(
      startWith([] as IAnnotationGeometry[]),
    ),
    this.annotationInOtherSpaces$.pipe(
      startWith([] as IAnnotationGeometry[]),
    )
  ]).pipe(
    map(([ ann, annOther ]) => {
      return {
        [userAnnotationRouteKey]: [
          ...ann.map(a => a.toJSON()),
          ...annOther.map(a => a.toJSON()),
        ]
      }
    })
  )
  
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

  constructor(
    private svc: ModularUserAnnotationToolService,
    private injector: Injector,
    private dialogSvc: DialogService,
    private snackbar: MatSnackBar,
    @Inject(ANNOTATION_EVENT_INJ_TOKEN) private annotnEvSubj: Subject<TAnnotationEvent<keyof IAnnotationEvents>>,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR) clickInterceptor: ClickInterceptor,
  ){

    let selectedToolName: string = null
    this.svc.setVisible(this.#visible)
    const stopClick = () => {
      if (BLOCKING_TOOLNAMES.includes(selectedToolName)) {
        return !this.visible
      }
      return true
    }
    if (clickInterceptor) {
      const { register, deregister } = clickInterceptor
      register(stopClick)
      this.#destroy$.subscribe(() => deregister(stopClick))
    }
    this.selectedToolName$.pipe(
      takeUntil(this.#destroy$)
    ).subscribe(name => {
      selectedToolName = name
    })

    this.#destroy$.subscribe(() => {
      this.svc.setVisible(false)
    })
  }

  async selectToolByName(name: string){
    if (!name) {
      return
    }
    const tools = await this.tools$.pipe(
      take(1)
    ).toPromise()
    const foundTool = tools.find(t => t.name === name)
    if (!foundTool) {
      return
    }
    foundTool.onClick()
  }

  selectTool(tool: RegisteredTool){
    tool.onClick()
  }

  selectedToolName$ = this.annotnEvSubj.pipe(
    filter(ev => ev.type === "toolSelect"),
    map((ev) => (ev.detail as IAnnotationEvents["toolSelect"]).name)
  )

  selectedTool$ = this.selectedToolName$.pipe(
    withLatestFrom(this.tools$),
    map(([ name, tools ]) => tools.find(t => t.name === name))
  )

  #visible: boolean = false
  @Input('sxplr-annot-visible')
  set visible(flag: boolean) {
    this.svc.setVisible(flag)
    this.#visible = flag
  }
  get visible(){
    return this.#visible
  }

  async gotoRoi(annot: IAnnotationGeometry){
    const result = await this.svc.getTool(annot.annotationType)
    if (!result) {
      return
    }
    const { editCmp } = result
    const inj = Injector.create({
      providers: [
        {
          provide: UDPATE_ANNOTATION_TOKEN,
          useValue: annot
        },
        ComponentStore
      ],
      parent: this.injector
    })

    const cmp = createComponent(editCmp, { environmentInjector: this.#envInj, elementInjector: inj })
    cmp.instance.gotoRoi()
    cmp.destroy()
  }

  async handleImportEvent(ev: TFileInputEvent<'text' | 'file' | "url">, fileInput: FileInputDirective){

    const { abort } = this.dialogSvc.blockUserInteraction({
      title: enLabels.LOADING,
      markdown: enLabels.LOADING_ANNOTATION_MSG,
    })
    try {
      const clearFileInputAndInform = () => {
        fileInput.clear()
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

  private parseAndAddAnnotation(input: string) {
    const json = JSON.parse(input)
    const annotation = this.svc.parseAnnotationObject(json)
    if (!annotation) {
      return
    }
    this.svc.annotationTools$.pipe(
      take(1),
    ).subscribe(tools => {
      for (const tool of tools) {
        const { toolInstance, target } = tool
        if (!!target && annotation instanceof target) {
          toolInstance.addAnnotation(annotation)
          return
        }
      }
    })
  }

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

  async deleteAllAnnotation(){
    try {
      await this.dialogSvc.getUserConfirm({
        markdown: enLabels.DELETE_ALL_ANNOTATION_CONFIRMATION_MSG
      })
      
      const managedAnnotations = await this.managedAnnotations$.pipe(
        take(1)
      ).toPromise()
      for (const ann of managedAnnotations) {
        ann.remove()
      }
    } catch (e) {
      // aborted
    }
  }

  public getToolType(tool: RegisteredTool){
    if (tool.toolInstance.toolType === "drawing") {
      return "drawing"
    }
    return "utility"
  }
}
