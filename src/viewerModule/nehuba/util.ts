import { InjectionToken } from '@angular/core'
import { Observable, pipe } from 'rxjs'
import { filter, scan, take } from 'rxjs/operators'
import { getExportNehuba, getViewer } from 'src/util/fn'
import { NehubaViewerUnit } from './nehubaViewer/nehubaViewer.component'
import { NgConfigViewerState } from "./config.service"
import { RecursivePartial } from './config.service/type'
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

/**
 * gives a clue of the approximate location of the panel, allowing position of checkboxes/scale bar to be placed in unobtrustive places
 */
export const panelTouchSide = (panel: HTMLElement, { top: touchTop, left: touchLeft, right: touchRight, bottom: touchBottom }: any) => {
  if (touchTop) { panel.classList.add(`touch-top`) }
  if (touchLeft) { panel.classList.add(`touch-left`) }
  if (touchRight) { panel.classList.add(`touch-right`) }
  if (touchBottom) { panel.classList.add(`touch-bottom`) }
  return panel
}

export const addTouchSideClasses = (panel: HTMLElement, actualOrderIndex: number, panelMode: userInterface.PanelMode) => {

  if (actualOrderIndex < 0) { return panel }

  const mapIdxClass = mapModeIdxClass.get(panelMode)
  if (!mapIdxClass) { return panel }

  const classArg = mapIdxClass.get(actualOrderIndex)
  if (!classArg) { return panel }

  return panelTouchSide(panel, classArg)
}

export const getHorizontalOneThree = (panels: [HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  washPanels(panels)

  panels.forEach((panel, idx) => addTouchSideClasses(panel, idx, "H_ONE_THREE"))

  const majorContainer = makeCol(panels[0])
  const minorContainer = makeCol(panels[1], panels[2], panels[3])

  majorContainer.style.flexBasis = '67%'
  minorContainer.style.flexBasis = '33%'

  return makeRow(majorContainer, minorContainer)
}

export const getVerticalOneThree = (panels: [HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  washPanels(panels)

  panels.forEach((panel, idx) => addTouchSideClasses(panel, idx, "V_ONE_THREE"))

  const majorContainer = makeRow(panels[0])
  const minorContainer = makeRow(panels[1], panels[2], panels[3])

  majorContainer.style.flexBasis = '67%'
  minorContainer.style.flexBasis = '33%'

  return makeCol(majorContainer, minorContainer)
}

export const getFourPanel = (panels: [HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  washPanels(panels)

  panels.forEach((panel, idx) => addTouchSideClasses(panel, idx, "FOUR_PANEL"))

  const majorContainer = makeRow(panels[0], panels[1])
  const minorContainer = makeRow(panels[2], panels[3])

  majorContainer.style.flexBasis = '50%'
  minorContainer.style.flexBasis = '50%'

  return makeCol(majorContainer, minorContainer)
}

export const getSinglePanel = (panels: [HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  washPanels(panels)

  panels.forEach((panel, idx) => addTouchSideClasses(panel, idx, "SINGLE_PANEL"))

  const majorContainer = makeRow(panels[0])
  const minorContainer = makeRow(panels[1], panels[2], panels[3])

  majorContainer.style.flexBasis = '100%'
  minorContainer.style.flexBasis = '0%'

  minorContainer.className = ''
  minorContainer.style.height = '0px'
  return makeRow(majorContainer, minorContainer)
}

export const isIdentityQuat = ori => Math.abs(ori[0]) < 1e-6
  && Math.abs(ori[1]) < 1e-6
  && Math.abs(ori[2]) < 1e-6
  && Math.abs(ori[3] - 1) < 1e-6

export const getNavigationStateFromConfig = nehubaConfig => {
  const {
    navigation = {},
    perspectiveOrientation = [0, 0, 0, 1],
    perspectiveZoom = 1e7
  } = (nehubaConfig && nehubaConfig.dataset && nehubaConfig.dataset.initialNgState) || {}

  const {
    zoomFactor = 3e5,
    pose = {}
  } = navigation || {}

  const {
    voxelSize = [1e6, 1e6, 1e6],
    voxelCoordinates = [0, 0, 0]
  } = (pose && pose.position) || {}

  const {
    orientation = [0, 0, 0, 1]
  } = pose || {}

  return {
    orientation,
    perspectiveOrientation,
    perspectiveZoom,
    position: [0, 1, 2].map(idx => voxelSize[idx] * voxelCoordinates[idx]),
    zoom: zoomFactor
  }
}

export const calculateSliceZoomFactor = (originalZoom) => originalZoom
  ? 700 * originalZoom / Math.min(window.innerHeight, window.innerWidth)
  : 1e7

export const singleLmUnchanged = (lm: {id: string, position: [number, number, number]}, map: Map<string, [number, number, number]>) =>
  map.has(lm.id) && map.get(lm.id).every((value, idx) => value === lm.position[idx])

export const userLmUnchanged = (oldlms, newlms) => {
  const oldmap = new Map(oldlms.map(lm => [lm.id, lm.position]))
  const newmap = new Map(newlms.map(lm => [lm.id, lm.position]))

  return oldlms.every(lm => singleLmUnchanged(lm, newmap as Map<string, [number, number, number]>))
    && newlms.every(lm => singleLmUnchanged(lm, oldmap as Map<string, [number, number, number]>))
}

export const importNehubaFactory = appendSrc => {
  let pr: Promise<any>
  return () => {
    if (getExportNehuba()) return Promise.resolve()

    if (pr) return pr
    pr = appendSrc('main.bundle.js')

    return pr
  }
}


export const isFirstRow = (cell: HTMLElement) => {
  const { parentElement: row } = cell
  const { parentElement: container } = row
  return container.firstElementChild === row
}

export const isFirstCell = (cell: HTMLElement) => {
  const { parentElement: row } = cell
  return row.firstElementChild === cell
}

export const scanSliceViewRenderFn: (acc: [boolean, boolean, boolean], curr: CustomEvent) => [boolean, boolean, boolean] = (acc, curr) => {
  
  const target = curr.target as HTMLElement
  const targetIsFirstRow = isFirstRow(target)
  const targetIsFirstCell = isFirstCell(target)
  const idx = targetIsFirstRow
    ? targetIsFirstCell
      ? 0
      : 1
    : targetIsFirstCell
      ? 2
      : null

  const returnAcc = [...acc]
  const num1 = typeof curr.detail.missingChunks === 'number' ? curr.detail.missingChunks : 0
  const num2 = typeof curr.detail.missingImageChunks === 'number' ? curr.detail.missingImageChunks : 0
  if (num1 < 0 && num2 < 0) {
    returnAcc[idx] = true
  } else {
    returnAcc[idx] = Math.max(num1, num2) > 0
  }
  return returnAcc as [boolean, boolean, boolean]
}

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
      const panels = getViewer()['display']['panels']
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

export function serializeSegment(ngId: string, label: number | string){
  return `${ngId}#${label}`
}

export function deserializeSegment(id: string) {
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
