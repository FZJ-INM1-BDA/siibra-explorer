import { FOUR_PANEL, SINGLE_PANEL, H_ONE_THREE, V_ONE_THREE } from "src/services/state/ngViewerState.store";

const flexContCmnCls = ['w-100', 'h-100', 'd-flex', 'justify-content-center', 'align-items-stretch']

const makeRow = (...els:HTMLElement[]) => {
  const container = document.createElement('div')
  container.classList.add(...flexContCmnCls, 'flex-row')
  for (const el of els){
    container.appendChild(el)
  }
  return container
}

const makeCol = (...els:HTMLElement[]) => {
  const container = document.createElement('div')
  container.classList.add(...flexContCmnCls, 'flex-column')
  for (const el of els){
    container.appendChild(el)
  }
  return container
}

const washPanels = (panels: [HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  for (const panel of panels) {
    if (panel) panel.className = `position-relative`
  }
  return panels
}

const top = true
const left = true
const right = true
const bottom = true

const mapModeIdxClass = new Map()

mapModeIdxClass.set(FOUR_PANEL, new Map([
  [0, { top, left }],
  [1, { top, right }],
  [2, { bottom, left }],
  [3, { right, bottom }]
]))

mapModeIdxClass.set(SINGLE_PANEL, new Map([
  [0, { top, left, right, bottom }],
  [1, {}],
  [2, {}],
  [3, {}]
]))

mapModeIdxClass.set(H_ONE_THREE, new Map([
  [0, { top, left, bottom }],
  [1, { top, right }],
  [2, { right }],
  [3, { bottom, right }]
]))

mapModeIdxClass.set(V_ONE_THREE, new Map([
  [0, { top, left, right }],
  [1, { bottom, left }],
  [2, { bottom }],
  [3, { bottom, right }]
]))

export const removeTouchSideClasses = (panel: HTMLElement) => {
  panel.classList.remove(
    `touch-top`,
    `touch-left`,
    `touch-right`,
    `touch-bottom`)
  return panel
}

/**
 * gives a clue of the approximate location of the panel, allowing position of checkboxes/scale bar to be placed in unobtrustive places
 */
export const panelTouchSide = (panel: HTMLElement, { top, left, right, bottom }: any) => {
  if (top) panel.classList.add(`touch-top`)
  if (left) panel.classList.add(`touch-left`)
  if (right) panel.classList.add(`touch-right`)
  if (bottom) panel.classList.add(`touch-bottom`)
  return panel
}

export const addTouchSideClasses = (panel: HTMLElement, actualOrderIndex: number, panelMode: string) => {
  
  if (actualOrderIndex < 0) return panel

  const mapIdxClass = mapModeIdxClass.get(panelMode)
  if (!mapIdxClass) return panel

  const classArg = mapIdxClass.get(actualOrderIndex)
  if (!classArg) return panel

  return panelTouchSide(panel, classArg)
}

export const getHorizontalOneThree = (panels:[HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  washPanels(panels)

  panels.forEach((panel, idx) => addTouchSideClasses(panel, idx, H_ONE_THREE))
  
  const majorContainer = makeCol(panels[0])
  const minorContainer = makeCol(panels[1], panels[2], panels[3])

  majorContainer.style.flexBasis = '67%'
  minorContainer.style.flexBasis = '33%'
  
  return makeRow(majorContainer, minorContainer)
}

export const getVerticalOneThree = (panels:[HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  washPanels(panels)
  
  panels.forEach((panel, idx) => addTouchSideClasses(panel, idx, V_ONE_THREE))

  const majorContainer = makeRow(panels[0])
  const minorContainer = makeRow(panels[1], panels[2], panels[3])

  majorContainer.style.flexBasis = '67%'
  minorContainer.style.flexBasis = '33%'
  
  return makeCol(majorContainer, minorContainer)
}


export const getFourPanel = (panels:[HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  washPanels(panels)
  
  panels.forEach((panel, idx) => addTouchSideClasses(panel, idx, FOUR_PANEL))

  const majorContainer = makeRow(panels[0], panels[1])
  const minorContainer = makeRow(panels[2], panels[3])

  majorContainer.style.flexBasis = '50%'
  minorContainer.style.flexBasis = '50%'
  
  return makeCol(majorContainer, minorContainer)
}

export const getSinglePanel = (panels:[HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  washPanels(panels)
  
  panels.forEach((panel, idx) => addTouchSideClasses(panel, idx, SINGLE_PANEL))

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
  