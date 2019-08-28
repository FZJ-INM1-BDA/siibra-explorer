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

export const getHorizontalOneThree = (panels:[HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  for (let panel of panels){
    panel.className = ''
  }
  const majorContainer = makeCol(panels[0])
  const minorContainer = makeCol(panels[1], panels[2], panels[3])

  majorContainer.style.flexBasis = '67%'
  minorContainer.style.flexBasis = '33%'
  
  return makeRow(majorContainer, minorContainer)
}

export const getVerticalOneThree = (panels:[HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  for (let panel of panels){
    panel.className = ''
  }
  const majorContainer = makeRow(panels[0])
  const minorContainer = makeRow(panels[1], panels[2], panels[3])

  majorContainer.style.flexBasis = '67%'
  minorContainer.style.flexBasis = '33%'
  
  return makeCol(majorContainer, minorContainer)
}


export const getFourPanel = (panels:[HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  for (let panel of panels){
    panel.className = ''
  }
  const majorContainer = makeRow(panels[0], panels[1])
  const minorContainer = makeRow(panels[2], panels[3])

  majorContainer.style.flexBasis = '50%'
  minorContainer.style.flexBasis = '50%'
  
  return makeCol(majorContainer, minorContainer)
}

export const getSinglePanel = (panels:[HTMLElement, HTMLElement, HTMLElement, HTMLElement]) => {
  for (let panel of panels){
    panel.className = ''
  }
  const majorContainer = makeRow(panels[0])
  const minorContainer = makeRow(panels[1], panels[2], panels[3])

  majorContainer.style.flexBasis = '100%'
  minorContainer.style.flexBasis = '0%'

  minorContainer.className = ''
  minorContainer.style.height = '0px'
  return makeCol(majorContainer, minorContainer)
}