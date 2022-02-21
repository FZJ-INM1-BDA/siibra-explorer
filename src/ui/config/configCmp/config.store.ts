import {Inject, Injectable, Optional} from "@angular/core";
import {NEHUBA_INSTANCE_INJTKN} from "src/viewerModule/nehuba/util";
import {Observable} from "rxjs";
import {NehubaViewerUnit} from "src/viewerModule/nehuba";
import {ComponentStore} from "@ngrx/component-store";
import {filter, take} from "rxjs/operators";

export interface ConfigState {
    sliceBackground: any[]
    axisLineVisible: boolean
    togglePerspectiveViewSubstrate: boolean
}

@Injectable({
  providedIn: 'root',
})
export class ConfigStore extends ComponentStore<ConfigState> {


  private get viewer(){
    return (window as any).viewer
  }

  private get nehubaViewer(){
    return (window as any).nehubaViewer
  }

  constructor(
        @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) nv$: Observable<NehubaViewerUnit>
  ) {
    super({
      sliceBackground: [],
      axisLineVisible: false,
      togglePerspectiveViewSubstrate: false
    })
    nv$.pipe(
      filter(nv => nv && nv.config),
      take(1)
    ).subscribe(nv => {
      this.setSliceBackground(
        nv.config.layout.useNehubaPerspective.drawSubstrates.color
          .map((v, i) => i===3? v : Math.floor(v*255))
      )

      this.select(state => state.sliceBackground).pipe(take(1)).subscribe(background => {
        this.setBackgroundVisibility( background.length && background[3] > 0)
      })

      this.setAxisLineVisible((window as any).viewer.showAxisLines.value? true : false)
    })
  }

    readonly sliceBackground$: Observable<any[]> = this.select(state => state.sliceBackground)
    readonly sliceBackgroundRgb$: Observable<string> = this.select(state => {
      const color = state.sliceBackground
      return color.length? '#' + [color[0], color[1], color[2]].map(x => x.toString(16).length === 1 ? '0' + x.toString(16) : x.toString(16)).join('') : ''
    })
    readonly axisLineVisible$: Observable<boolean> = this.select(state => state.axisLineVisible)
    readonly togglePerspectiveViewSubstrate$: Observable<boolean> = this.select(state => state.togglePerspectiveViewSubstrate)


    readonly setAxisLineVisible = this.updater((state, value: boolean) => {
      this.viewer.showAxisLines.restoreState(value)
      return {
        ...state,
        axisLineVisible: value
      }
    })
  
    readonly setSliceBackground = this.updater((state, value: any) => {
      if (typeof value === 'string') value = this.hexToRgb(value)
      value = value.length === 4 ? value : [...value, 0.2]

      this.nehubaViewer.config.layout.useNehubaPerspective.drawSubstrates.color = value.map((v, i) => i===3? v : v/255.0)
      this.nehubaViewer.redraw()

      return {
        ...state,
        sliceBackground: value
      }
    })

    readonly setBackgroundVisibility = this.updater((state, value: boolean) => {

      this.nehubaViewer.config.layout.useNehubaPerspective.drawSubstrates.color[3] = value ? 0.2 : 0
      this.nehubaViewer.redraw()

      return {
        ...state,
        togglePerspectiveViewSubstrate: value
      }
    })

    public hexToRgb(hex) : any[] {
      return hex.match(/\w\w/g).map(x => parseInt(x, 16))
    }

}
