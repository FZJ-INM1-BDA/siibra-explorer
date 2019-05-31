const url = 'http://localhost:8081/'

const noErrorLog = require('./noErrorLog')
const { getSelectedTemplate, getSelectedParcellation } = require('./ivApi')
const { getSearchParam, wait } = require('./util')

describe('protractor works', () => {
  it('protractor works', () => {
    expect(true).toEqual(true)
  })
})

describe('Home screen', () => {
  beforeEach(() => {
    browser.waitForAngularEnabled(false)
    browser.get(url)
  })

  it('get title works', () => {
    browser.getTitle()
      .then(title => {
        expect(title).toEqual('Interactive Atlas Viewer')
      })
      .catch(error => {
        console.error('error', error)
      })

    browser.executeScript('window.interactiveViewer')
      .then(result => expect(result).toBeDefined())
    browser.executeScript('window.viewer')
      .then(result => expect(result).toBeNull())

    noErrorLog(browser)
  })
})

describe('Query param: ', () => {

  it('correctly defined templateSelected and selectedParcellation works', async () => {

    const searchParam = '?templateSelected=MNI+Colin+27&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas'
    browser.get(url + searchParam)
    browser.executeScript('window.interactiveViewer').then(result => expect(result).toBeDefined())
    browser.executeScript('window.viewer').then(result => expect(result).toBeDefined())
    
    await wait(browser)

    getSelectedTemplate(browser)
      .then(template => {
        expect(template.name).toBe('MNI Colin 27')
      })

    getSelectedParcellation(browser)
      .then(parcellation => {
        expect(parcellation.name).toBe('JuBrain Cytoarchitectonic Atlas')
      })

    noErrorLog(browser)
  })

  it('correctly defined templateSelected but incorrectly defined selectedParcellation work', async () => {
    const searchParam = '?templateSelected=MNI+Colin+27&parcellationSelected=NoName'
    browser.get(url + searchParam)

    await wait(browser)

    getSelectedTemplate(browser)
      .then(template => {
        expect(template.name).toBe('MNI Colin 27')
      })
      .catch(fail)

    Promise.all([
      getSelectedTemplate(browser),
      getSelectedParcellation(browser)  
    ])
      .then(([template, parcellation]) => {
        expect(parcellation.name).toBe(template.parcellations[0].name)
      })
      .catch(fail)
      
    noErrorLog(browser)
  })

  it('incorrectly defined templateSelected should clear searchparam', async () => {
    const searchParam = '?templateSelected=NoName2&parcellationSelected=NoName'
    browser.get(url + searchParam)

    await wait(browser)

    getSearchParam(browser)
      .then(searchParam => {
        const templateSelected = searchParam.get('templateSelected')
        expect(templateSelected).toBeNull()
      })
      .catch(fail)
  })
})