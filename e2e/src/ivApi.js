exports.getSelectedTemplate = (browser) => new Promise((resolve, reject) => {
  browser.executeAsyncScript('let sub = window.interactiveViewer.metadata.selectedTemplateBSubject.subscribe(obj => arguments[arguments.length - 1](obj));sub.unsubscribe()')
    .then(resolve)
    .catch(reject)
})

exports.getSelectedParcellation = (browser) => new Promise((resolve, reject) => {
  browser.executeAsyncScript('let sub = window.interactiveViewer.metadata.selectedParcellationBSubject.subscribe(obj => arguments[arguments.length - 1](obj));sub.unsubscribe()')
    .then(resolve)
    .catch(reject)
})