import { InjectionToken } from '@angular/core'
import { Observable, pipe } from 'rxjs'
import { filter, scan, take } from 'rxjs/operators'
import { NehubaViewerUnit } from './nehubaViewer/nehubaViewer.component'
import { userInterface } from 'src/state'

const flexContCmnCls = ['w-100', 'h-100', 'd-flex', 'justify-content-center', 'align-items-stretch']

const makeRow = (...els: HTMLElement[]) => {
  const container = document.createElement('div')
  container.classList.add(...flexContCmnCls, 'flex-row')
  for (const el of els) {
    container.appendChild(el)
  }
  return container
}

const makeCol = (...els: HTMLElement[]) => {
  const container = document.createElement('div')
  container.classList.add(...flexContCmnCls, 'flex-column')
  for (const el of els) {
    container.appendChild(el)
  }
  return container
}

const washPanels = (panels: [HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  for (const panel of panels) {
    if (panel) { panel.className = `position-relative` }
  }
  return panels
}

const top = true
const left = true
const right = true
const bottom = true

const mapModeIdxClass = new Map<
  userInterface.PanelMode, Map<number,{
    top?: boolean
    bottom?: boolean
    left?: boolean
    right?: boolean
  }>
>()

mapModeIdxClass.set("FOUR_PANEL", new Map([
  [0, { top, left }],
  [1, { top, right }],
  [2, { bottom, left }],
  [3, { right, bottom }],
]))

mapModeIdxClass.set("SINGLE_PANEL", new Map([
  [0, { top, left, right, bottom }],
  [1, {}],
  [2, {}],
  [3, {}],
]))

mapModeIdxClass.set("PIP_PANEL", new Map([
  [0, { top, left, right, bottom }],
  [1, {}],
  [2, {}],
  [3, {}],
]))

mapModeIdxClass.set("H_ONE_THREE", new Map([
  [0, { top, left, bottom }],
  [1, { top, right }],
  [2, { right }],
  [3, { bottom, right }],
]))

mapModeIdxClass.set("V_ONE_THREE", new Map([
  [0, { top, left, right }],
  [1, { bottom, left }],
  [2, { bottom }],
  [3, { bottom, right }],
]))

type PanelTouchSide = 'left' | 'right' | 'top' | 'bottom'
/**
 * gives a clue of the approximate location of the panel, allowing position of checkboxes/scale bar to be placed in unobtrustive places
 */
export const panelTouchSide = (panel: HTMLElement, { top: touchTop, left: touchLeft, right: touchRight, bottom: touchBottom }: Partial<Record<PanelTouchSide, boolean>>): HTMLElement => {
  if (touchTop) { panel.classList.add(`touch-top`) }
  if (touchLeft) { panel.classList.add(`touch-left`) }
  if (touchRight) { panel.classList.add(`touch-right`) }
  if (touchBottom) { panel.classList.add(`touch-bottom`) }
  return panel
}

export const addTouchSideClasses = (panel: HTMLElement, actualOrderIndex: number, panelMode: userInterface.PanelMode): HTMLElement => {

  if (actualOrderIndex < 0) { return panel }

  const mapIdxClass = mapModeIdxClass.get(panelMode)
  if (!mapIdxClass) { return panel }

  const classArg = mapIdxClass.get(actualOrderIndex)
  if (!classArg) { return panel }

  return panelTouchSide(panel, classArg)
}

export const getHorizontalOneThree = (panels: [HTMLElement, HTMLElement, HTMLElement, HTMLElement]): HTMLElement => {
  washPanels(panels)

  panels.forEach((panel, idx) => addTouchSideClasses(panel, idx, "H_ONE_THREE"))

  const majorContainer = makeCol(panels[0])
  const minorContainer = makeCol(panels[1], panels[2], panels[3])

  majorContainer.style.flexBasis = '67%'
  minorContainer.style.flexBasis = '33%'

  return makeRow(majorContainer, minorContainer)
}

export const getVerticalOneThree = (panels: [HTMLElement, HTMLElement, HTMLElement, HTMLElement]): HTMLDivElement => {
  washPanels(panels)

  panels.forEach((panel, idx) => addTouchSideClasses(panel, idx, "V_ONE_THREE"))

  const majorContainer = makeRow(panels[0])
  const minorContainer = makeRow(panels[1], panels[2], panels[3])

  majorContainer.style.flexBasis = '67%'
  minorContainer.style.flexBasis = '33%'

  return makeCol(majorContainer, minorContainer)
}

export const getFourPanel = (panels: [HTMLElement, HTMLElement, HTMLElement, HTMLElement]): HTMLDivElement => {
  washPanels(panels)

  panels.forEach((panel, idx) => addTouchSideClasses(panel, idx, "FOUR_PANEL"))

  const majorContainer = makeRow(panels[0], panels[1])
  const minorContainer = makeRow(panels[2], panels[3])

  majorContainer.style.flexBasis = '50%'
  minorContainer.style.flexBasis = '50%'

  return makeCol(majorContainer, minorContainer)
}

export const getSinglePanel = (panels: [HTMLElement, HTMLElement, HTMLElement, HTMLElement]): HTMLDivElement => {
  washPanels(panels)

  return getFullViewPanel(panels)
}

export const getPipPanel = (panels: [HTMLElement, HTMLElement, HTMLElement, HTMLElement]): HTMLDivElement => {
  washPanels(panels)
  
  return getFullViewPanel(panels)
}

const getFullViewPanel = (panels: [HTMLElement, HTMLElement, HTMLElement, HTMLElement]): HTMLDivElement => {

  panels.forEach((panel, idx) => addTouchSideClasses(panel, idx, "SINGLE_PANEL"))

  const majorContainer = makeRow(panels[0])
  majorContainer.style.flexBasis = '100%'

  const minorContainer = makeRow(panels[1], panels[2], panels[3])
  minorContainer.style.flexBasis = '0%'
  minorContainer.className = ''

  return makeRow(majorContainer, minorContainer)
}

export const isIdentityQuat = (ori: number[]): boolean => Math.abs(ori[0]) < 1e-6
  && Math.abs(ori[1]) < 1e-6
  && Math.abs(ori[2]) < 1e-6
  && Math.abs(ori[3] - 1) < 1e-6

export const takeOnePipe = () => {

  return pipe(
    scan((acc: Event[], event: Event) => {
      const target = (event as Event).target as HTMLElement
      /**
       * 0 | 1
       * 2 | 3
       *
       * 4 ???
       */
      const panels = window['viewer']['display']['panels']
      const panelEls = Array.from(panels).map(({ element }) => element)

      const identifySrcElement = (element: HTMLElement) => {
        const idx = panelEls.indexOf(element)
        return idx
      }

      const key = identifySrcElement(target)
      const _ = {}
      _[key] = event
      return Object.assign({}, acc, _)
    }, []),
    filter(v => {
      const isdefined = (obj) => typeof obj !== 'undefined' && obj !== null
      return (isdefined(v[0]) && isdefined(v[1]) && isdefined(v[2]))
    }),
    take(1),
  )
}

export const NEHUBA_INSTANCE_INJTKN = new InjectionToken<Observable<NehubaViewerUnit>>('NEHUBA_INSTANCE_INJTKN')

export function serializeSegment(ngId: string, label: number | string): string{
  return `${ngId}#${label}`
}

export function deserializeSegment(id: string): {ngId: string, label: number} {
  const split = id.split('#')
  if (split.length !== 2) {
    throw new Error(`deserializeSegment error at ${id}. expecting splitting # to result in length 2, got ${split.length}`)
  }
  if (isNaN(Number(split[1]))) {
    throw new Error(`deserializeSegment error at ${id}. expecting second element to be numberable. It was not.`)
  }
  return {
    ngId: split[0],
    label: Number(split[1])
  }
}

/**
 * @description Given the affine of an input volume, calculates the position and orientation for a "good" visualization
 * @param mat4 glmatrix mat4
 * @param mat3 glmatrix mat3
 * @param quat glmatrix quat
 * @param affine 4x4 affine, with [...translation, 1] defined at affine[3]. i.e. affine[3] === [translate_x, translate_y, translate_z, 1] 
 * @param dimensions (optional) dimension of the highest lod in nm
 */
export function getPositionOrientation(mat4: any, vec3: any, quat: any, affine: number[][], dimensions?: number[]){
  affine = mat4.fromValues(...affine.flatMap(v => v))
  const scaling = mat4.getScaling(vec3.create(), affine)
  vec3.inverse(scaling, scaling)
  const normalizedm = mat4.scale(mat4.create(), affine, scaling)
  const orientation = mat4.getRotation(quat.create(), normalizedm)
  quat.normalize(orientation, orientation)

  // It is far more common to see coronal slices.
  // So we set orientation to see coronal slices best
  quat.rotateX(orientation, orientation, Math.PI/2)
  quat.rotateZ(orientation, orientation, Math.PI)

  let position: number[]
  if (dimensions) {
    const start = vec3.transformMat4(vec3.create(), vec3.fromValues(0, 0, 0), affine)
    const end = vec3.transformMat4(vec3.create(), vec3.fromValues(...dimensions), affine)
    position = vec3.add(vec3.create(), start, end)
    vec3.scale(position, position, 0.5)
  }
  return {
    orientation,
    position,
  }
}
