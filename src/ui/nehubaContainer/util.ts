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

/**
 * gives a clue of the approximate location of the panel, allowing position of checkboxes/scale bar to be placed in unobtrustive places
 */
const panelTouchSide = (panel: HTMLElement, { top, left, right, bottom }: any) => {
  if (top) panel.classList.add(`touch-top`)
  if (left) panel.classList.add(`touch-left`)
  if (right) panel.classList.add(`touch-right`)
  if (bottom) panel.classList.add(`touch-bottom`)
  return panel
}

const top = true
const left = true
const right = true
const bottom = true

export const getHorizontalOneThree = (panels:[HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  washPanels(panels)

  panelTouchSide(panels[0], { top, left, bottom })
  panelTouchSide(panels[1], { top, right })
  panelTouchSide(panels[2], { right })
  panelTouchSide(panels[3], { right, bottom })
  
  const majorContainer = makeCol(panels[0])
  const minorContainer = makeCol(panels[1], panels[2], panels[3])

  majorContainer.style.flexBasis = '67%'
  minorContainer.style.flexBasis = '33%'
  
  return makeRow(majorContainer, minorContainer)
}

export const getVerticalOneThree = (panels:[HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  washPanels(panels)
  
  panelTouchSide(panels[0], { top, left, right })
  panelTouchSide(panels[1], { bottom, left })
  panelTouchSide(panels[2], { bottom })
  panelTouchSide(panels[3], { right, bottom })

  const majorContainer = makeRow(panels[0])
  const minorContainer = makeRow(panels[1], panels[2], panels[3])

  majorContainer.style.flexBasis = '67%'
  minorContainer.style.flexBasis = '33%'
  
  return makeCol(majorContainer, minorContainer)
}


export const getFourPanel = (panels:[HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  washPanels(panels)
  
  panelTouchSide(panels[0], { top, left })
  panelTouchSide(panels[1], { top, right })
  panelTouchSide(panels[2], { bottom, left })
  panelTouchSide(panels[3], { right, bottom })

  const majorContainer = makeRow(panels[0], panels[1])
  const minorContainer = makeRow(panels[2], panels[3])

  majorContainer.style.flexBasis = '50%'
  minorContainer.style.flexBasis = '50%'
  
  return makeCol(majorContainer, minorContainer)
}

export const getSinglePanel = (panels:[HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  washPanels(panels)
  
  panelTouchSide(panels[0], { top, left, bottom, right })

  const majorContainer = makeRow(panels[0])
  const minorContainer = makeRow(panels[1], panels[2], panels[3])

  majorContainer.style.flexBasis = '100%'
  minorContainer.style.flexBasis = '0%'

  minorContainer.className = ''
  minorContainer.style.height = '0px'
  return makeCol(majorContainer, minorContainer)
}