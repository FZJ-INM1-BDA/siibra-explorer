const url = 'http://localhost:8080/'

describe('protractor works', () => {
  it('getting title works', () => {
    browser.get(url)
    browser.getTitle().then(function(title){
      expect(title).toBe('Interactive Atlas Viewer')
      browser.executeScript('window.interactiveViewer').then(result => expect(result).toBeDefined())
      browser.executeScript('window.viewer').then(result => expect(result).toBeNull())
    })
  })
})

describe('URL works', () => {

  it('templateSelected existing template works', () => {

    const searchParam = '?templateSelected=MNI+Colin+27'
    browser.get(url + searchParam)
    browser.executeScript('window.interactiveViewer').then(result => expect(result).toBeDefined())
    browser.executeScript('window.viewer').then(result => expect(result).toBeDefined())
    browser.executeAsyncScript('window.interactiveViewer.metadata.selectedTemplateBSubject.subscribe(obj => arguments[arguments.length - 1](obj))')
      .then(obj => expect(obj.name).toBe('MNI Colin 27'))
  })
})