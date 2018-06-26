(() => {
    // // const landmarkService = interactiveViewer.experimental.landmarkService
    const code = () => {

        const register = (tag,classname)=>{

            try{
                customElements.define(tag, classname)
            }catch(e){
                console.warn(tag + ' already registered',e)
            }
        }

        
        const basePath = 'http://medpc055.ime.kfa-juelich.de:5080/plugins/webjugex/'

        const backendBasePath = 'http://medpc055.ime.kfa-juelich.de:8005/'

        /* components like this are reusable. */
        class HoverRegionSelectorComponent extends HTMLElement {

            constructor() {
                super()

                this.template =
                    `
                    <div class = "input-group">
                    <input class = "form-control" placeholder = "" readonly = "readonly" type = "text" region>
                    <span class = "input-group-btn">
                    <div class = "btn btn-default" editRegion>
                    <span class = "glyphicon glyphicon-edit"></span>
                    </div>
                    </span>
                    </div>
                    `
                this.listening = true
                this.selectedRegion = null
                this.shutdownHooks = []
            }

            connectNehubaHooks() {
                const mouseOverNehuba = window.interactiveViewer.viewerHandle.mouseOverNehuba
                    .subscribe(ev => {
                        if(!this.listening)
                            return
                            
                        this.selectedRegion = ev ? ev : null
                        this.render()
                    })

                this.shutdownHooks.push(() => mouseOverNehuba.unsubscribe())
            }

            disconnectedCallback() {
                // disconnected call back gets called multiple times, each time user chooses to 
                this.shutdownHooks.forEach(fn => fn())
            }

            connectedCallback() {
                // const shadowRoot = this.attachShadow({mode:'open'})
                while(this.lastChild){
                    this.removeChild(this.lastChild)
                }

                this.rootChild = document.createElement('div')
                this.appendChild(this.rootChild)
                this.connectNehubaHooks()
                this.render()
            }

            render() {
                this.rootChild.innerHTML = this.template
                console.log(this.selectedRegion)
                this.rootChild.querySelector('input[region]').value = this.selectedRegion ? this.selectedRegion.name : ''
                this.rootChild.querySelector('div[editRegion]').addEventListener('click', () => {
                    this.rootChild.querySelector('input[region]').value = ''
                    this.selectedRegion = null
                    this.listening = true
                })
            }
        }

        register('hover-region-selector-card',HoverRegionSelectorComponent)

        /* reusable pill components */
        class DismissablePill extends HTMLElement {
            constructor() {
                super()
                this.name = ''
                this.template = ``
            }

            render() {
                this.template =
                    `
                <span class = "label label-default">
                <span pillName>${this.name}</span>
                <span class = "glyphicon glyphicon-remove" pillRemove></span>
                </span>
                `
            }

            connectedCallback() {
                // const shadowRoot = this.attachShadow({mode:'open'})

                while(this.lastChild){
                    this.removeChild(this.lastChild)
                }

                this.render()
                this.innerHTML = this.template
                const removePill = this.querySelector('span[pillRemove]')
                removePill.addEventListener('click', () => {
                    this.onRemove(this.name)
                    this.remove()
                })
            }

            onRemove(name) { }
        }
        register('dismissable-pill-card', DismissablePill)

        class WebJuGExGeneComponent extends HTMLElement {
            constructor() {
                super()
                this.selectedGenes = []
                this.arrDict = []
                this.autocompleteSuggestions = []
                this.template =
                    `
                <div class = "input-group">
                <input geneInputBox type = "text" class = "form-control" placeholder = "Enter gene of interest ... ">
                <input geneImportInput class="hidden" type="file">
                <span class = "input-group-btn">
                <div geneAdd class = "btn btn-default" title = "Add a gene">Add</div>
                <div geneImport class = "btn btn-default" title = "Import a CSV file">Import</div>
                <div geneExport class = "btn btn-default" title = "Export selected genes into a csv file">Export</div>
                </span>
                </div>
                `
            }

            connectedCallback() {
                // const shadowRoot = this.attachShadow({mode:'open'})
                this.rootChild = document.createElement('div')
                this.rootChild.innerHTML = this.template
                this.appendChild(this.rootChild)

                this.config()
                this.init()
            }

            config() {
                this.MINCHAR = 1
            }

            init() {
                this.elGeneInputBox = this.rootChild.querySelector('input[geneInputBox]')
                this.elGeneImportInput = this.rootChild.querySelector('input[geneImportInput]')
                this.elGeneAdd = this.rootChild.querySelector('div[geneAdd]')
                this.elGeneImport = this.rootChild.querySelector('div[geneImport]')
                this.elGeneExport = this.rootChild.querySelector('div[geneExport]')

                const importGeneList = (file) => {
                    const csvReader = new FileReader()
                    csvReader.onload = (ev) => {
                        const csvRaw = ev.target.result
                        this.selectedGenes.splice(0, this.selectedGenes.length)
                        csvRaw.split(/\r|\r\n|\n|\t|\,|\;/).forEach(gene => {
                            if (gene.length > 0)
                                this.addGene(gene)
                        })
                    }
                    csvReader.readAsText(file, 'utf-8')
                }
                this.elGeneImportInput.addEventListener('change', (ev) => {
                    importGeneList(ev.target.files[0])
                })
                this.elGeneImport.addEventListener('click', () => {
                    this.elGeneImportInput.click()
                })
                this.elGeneExport.addEventListener('click', () => {
                    const exportGeneList = 'data:text/csv;charset=utf-8,' + this.selectedGenes.join(',')
                    const exportGeneListURI = encodeURI(exportGeneList)
                    const dlExportGeneList = document.createElement('a')
                    dlExportGeneList.setAttribute('href', exportGeneListURI)
                    document.body.appendChild(dlExportGeneList)
                    const date = new Date()
                    dlExportGeneList.setAttribute('download', `exported_genelist_${'' + date.getFullYear() + (date.getMonth() + 1) + date.getDate() + '_' + date.getHours() + date.getMinutes()}.csv`)
                    dlExportGeneList.click()
                    document.body.removeChild(dlExportGeneList)
                })
                this.elGeneAdd.addEventListener('click', () => {
                    if (this.autocompleteSuggestions.length > 0 && this.elGeneInputBox.value.length >= this.MINCHAR)
                        this.addGene(this.autocompleteSuggestions[0])
                })

                this.elGeneInputBox.addEventListener('dragenter', (ev) => {
                    this.elGeneInputBox.setAttribute('placeholder', 'Drop file here to be uploaded')
                })

                this.elGeneInputBox.addEventListener('dragleave', (ev) => {
                    this.elGeneInputBox.setAttribute('placeholder', 'Enter gene of interest ... ')
                })

                this.elGeneInputBox.addEventListener('drop', (ev) => {
                    ev.preventDefault()
                    ev.stopPropagation()
                    ev.stopImmediatePropagation()
                    this.elGeneInputBox.setAttribute('placeholder', 'Enter gene of interest ... ')
                    //ev.dataTransfer.files[0]
                })

                this.elGeneInputBox.addEventListener('dragover', (ev) => {
                    ev.preventDefault()
                    ev.stopPropagation()
                    ev.stopImmediatePropagation()
                })

                this.elGeneInputBox.addEventListener('keydown', (ev) => {
                    ev.stopPropagation()
                    ev.stopImmediatePropagation()
                    if (ev.key == 'Enter') this.elGeneAdd.click()
                })

                this.loadExternalResources()
                fetch(backendBasePath).then(txt => txt.json())
                    .then(json => {
                        this.arrDict = json
                    })
                    .catch(err => {
                        console.log('failed to fetch full list of genes... using limited list of genes instead ...', e)
                        this.arrDict = ["ADRA2A", "AVPR1B", "CHRM2", "CNR1", "CREB1", "CRH", "CRHR1", "CRHR2", "GAD2", "HTR1A", "HTR1B", "HTR1D", "HTR2A", "HTR3A", "HTR5A", "MAOA", "PDE1A", "SLC6A2", "SLC6A4", "SST", "TAC1", "TPH1", "GPR50", "CUX2", "TPH2"]
                    })
            }

            loadExternalResources() {
                this.autoCompleteCss = document.createElement('link')
                this.autoCompleteCss.type = 'text/css'
                this.autoCompleteCss.rel = 'stylesheet'
                this.autoCompleteCss.href = basePath + 'js-autocomplete.min.css'

                this.autoCompleteJs = document.createElement('script')
                this.autoCompleteJs.onload = () => {
                    /* append autocomplete here */
                    this.autocompleteInput = new autoComplete({
                        selector: this.elGeneInputBox,
                        delay: 0,
                        minChars: this.MINCHAR,
                        cache: false,
                        source: (term, suggest) => {
                            const searchTerm = new RegExp('^' + term, 'gi')
                            this.autocompleteSuggestions = this.arrDict.filter(dict => searchTerm.test(dict))
                            suggest(this.autocompleteSuggestions)
                        },
                        onSelect: (e, term, item) => {
                            this.addGene(term)
                        }
                    })
                }
                this.autoCompleteJs.src = basePath + 'js-autocomplete.min.js'

                document.head.appendChild(this.autoCompleteJs)
                document.head.appendChild(this.autoCompleteCss)
            }

            addGene(gene) {
                const pill = document.createElement('dismissable-pill-card')
                pill.onRemove = (name) =>
                    this.selectedGenes.splice(this.selectedGenes.indexOf(name), 1)
                pill.name = gene
                this.rootChild.appendChild(pill)
                this.selectedGenes.push(gene)
                this.elGeneInputBox.value = ''
                this.elGeneInputBox.blur()
                this.elGeneInputBox.focus()
            }
        }

        register('fzj-xg-webjugex-gene-card', WebJuGExGeneComponent)

        class WebJuGExSearchComponent extends HTMLElement {
            constructor() {
                super()
                this.template = `
                <div>
                    <div class = "col-md-12">
                    <small>
                        Find a set of differentially expressed genes between two user defined volumes of interest based on JuBrain maps.
                        The tool downloads expression values of user specified sets of genes from Allen Brain API.
                        Then, it uses zscores to find which genes are expressed differentially between the user specified regions of interests.
                        After the analysis is finished, the genes and their calculated p values are displayed. There is also an option of downloading the gene names and their p values
                        and the roi coordinates used in the analysis.
                        Please select two regions of interest, and at least one gene :
                    </small>
                </div>
                <div class = "col-md-12">
                    <hover-region-selector-card area1>
                    </hover-region-selector-card>
                </div>
                <div class = "col-md-12">
                    <hover-region-selector-card area2>
                    </hover-region-selector-card>
                </div>
                <div class = "col-md-12">
                    <div class = "input-group">
                        <span class = "input-group-addon">
                            Threshold
                        </span>
                        <input value = "0.20" class = "form-control" type = "range" min = "0" max = "1" step = "0.01" threshold \>
                        <span class = "input-group-addon" thresholdValue>
                            0.20
                        </span>
                    </div>
                </div>
                <div class = "col-md-12">
                    <div class="input-group">
                        <input id = "fzj-hb-jugex-singleprobe" name = "fzj-hb-jugex-singleprobe" type="checkbox" probemode> 
                        <label for = "fzj-hb-jugex-singleprobe">Single Probe Mode</label>
                    </div>
                </div>
                <div class = "col-md-12">
                    <div class = "input-group">
                        <input name = "fzj-hb-jugex-hemisphere" type = "radio" id = "fzj-hb-jugex-hemisphere-lh" value = "left-hemisphere" checked/>
                        <label for = "fzj-hb-jugex-hemisphere-lh">Left Hemisphere</label>
                    </div>
                    <div class = "input-group">
                        <input name = "fzj-hb-jugex-hemisphere" type = "radio" id = "fzj-hb-jugex-hemisphere-rh" value = "right-hemisphere"/>
                        <label for = "fzj-hb-jugex-hemisphere-rh">Right Hemisphere</label>
                    </div>
                </div>
                <div>
                    <div class = "col-md-12">
                        <fzj-xg-webjugex-gene-card>
                        </fzj-xg-webjugex-gene-card>
                    </div>
                </div>
                <div>
                    <div class = "col-md-12">
                        <div class = "btn btn-default btn-block" analysisSubmit>
                            Start differential analysis
                        </div>
                    </div>
                </div>
                    `
                this.mouseEventSubscription = this.rootChild = this.threshold = this.elArea1 = this.elArea2 = null
                this.selectedGenes = []

                this.datasets = []

                this.datasetSub = window.interactiveViewer.metadata.datasetsBSubject.subscribe(datasets=>{
                    this.datasets = datasets
                })

                
        // const createsth = ()=>{
        //     const div1 = document.createElement('div')
        //     const child1 = document.createElement('div')
        //     const child2 = document.createElement('div')

        //     child1.innerHTML = 'helo'
        //     child2.innerHTML = 'world'
        //     div1.appendChild(child1)
        //     div1.appendChild(child2)

        //     return [div1,child1,child2]
        // }
        // const container = document.getElementById('fzj.xg.webjugex.container')

        // const div2 = createsth()
        // container.appendChild(div2[0])

            }

            connectedCallback() {
                
                while(this.lastChild){
                    this.removeChild(this.lastChild)
                }

                // const shadowRoot = this.attachShadow({mode:'open'})
                this.rootChild = document.createElement('div')
                this.rootChild.innerHTML = this.template
                this.appendChild(this.rootChild)

                /* init */
                this.init()

                /* attach click listeners */
                this.onViewerClick()

            }

            init() {
                this.elArea1 = this.rootChild.querySelector('hover-region-selector-card[area1]')
                this.elArea2 = this.rootChild.querySelector('hover-region-selector-card[area2]')
                this.elArea1.listening = true
                this.elArea2.listening = false
                this.probemodeval = false

                this.elGenesInput = this.rootChild.querySelector('fzj-xg-webjugex-gene-card')

                this.elAnalysisSubmit = this.rootChild.querySelector('div[analysisSubmit]')
                this.elAnalysisSubmit.style.marginBottom = '20px'
                this.elAnalysisSubmit.addEventListener('click', () => {
                    this.analysisGo()
                })

                this.elThreshold = this.rootChild.querySelector('input[threshold]')
                const elThresholdValue = this.rootChild.querySelector('span[thresholdValue]')
                this.elThreshold.addEventListener('input', (ev) => {
                    elThresholdValue.innerHTML = parseFloat(this.elThreshold.value).toFixed(2)
                })
            }

            onViewerClick() {
                this.mouseEventSubscription = window.interactiveViewer.viewerHandle.mouseEvent
                    .subscribe(ev => {
                        if(ev.eventName !== 'click') return
                        if (this.elArea1.listening && this.elArea2.listening) {
                            this.elArea1.listening = false
                        }
                        else if (this.elArea2.listening) {
                            this.elArea2.listening = false
                        }
                        else if (this.elArea1.listening) {
                            if (this.elArea2.selectedRegion == null) {
                                this.elArea1.listening = false
                                this.elArea2.listening = true
                            }
                            else if (this.elArea2.selectedRegion != null) {
                                this.elArea1.listening = false
                            }
                        }
                    })

            }

            analysisGo() {
                /* test for submit conditions */
                const hemisphere = this.rootChild.querySelector('input[name="fzj-hb-jugex-hemisphere"]:checked').value

                if (this.elArea1.selectedRegion == null || this.elArea2.selectedRegion == null || this.elGenesInput.selectedGenes.length < 1) {
                    const resultCard = document.createElement('fzj-xg-webjugex-result-failure-card')
                    
                    const container = document.getElementById('fzj.xg.webjugex.container')

                    container.appendChild(resultCard)
                    let e = 'Error: We need '
                    if (this.elArea1.selectedRegion == null || this.elArea2.selectedRegion == null) e += 'both areas to be defined and '
                    if (this.elGenesInput.selectedGenes.length < 1) e += 'atleast one gene'
                    else e = e.substr(0, 40)
                    e += '.'
                    resultCard.panelBody.innerHTML = e
                    return
                }

                
                console.log(this.elArea1.selectedRegion.name,
                    this.elArea2.selectedRegion.name,
                    this.elArea1.selectedRegion.PMapURL,
                    this.elArea2.selectedRegion.PMapURL,
                    this.elThreshold.value,
                    this.elGenesInput.selectedGenes,
                    hemisphere)

                const getPmap = (name) => {
                    if(name == 'AStr (Amygdala)') throw Error('AStr (Amygdala) has not yet been implemented in MNI152')
                    
                    

                    const dataset = this.datasets.find(dataset => dataset.type === 'Cytoarchitectonic Probabilistic Map' && dataset.regionName[0].regionName === name)
                    const url = dataset.files[0].url
                    console.log('getpmap', url)
                    const host = 'https://neuroglancer-dev.humanbrainproject.org'
                    // const host = 'http://offline-neuroglancer:80'
                    const mni152url = `${host}/precomputed/JuBrain/v2.2c/PMaps/MNI152/${url.substring(url.lastIndexOf('/') + 1).replace('.nii',hemisphere == 'left-hemisphere' ? '_l.nii' : '_r.nii')}`
                    console.log('MNI152 PMap',mni152url)
                    if (dataset) { return mni152url } else { throw new Error('could not find PMap') }
                }

                const newArea1 = {
                    name: this.elArea1.selectedRegion.name,
                    PMapURL: getPmap(this.elArea1.selectedRegion.name)
                }
                const newArea2 = {
                    name: this.elArea2.selectedRegion.name,
                    PMapURL: getPmap(this.elArea2.selectedRegion.name)
                }
                console.log('fixed loop reference',
                    newArea1.name,
                    newArea2.name,
                    newArea1.PMapURL,
                    newArea2.PMapURL,
                    this.elThreshold.value,
                    this.elGenesInput.selectedGenes)

                this.sendAnalysis({
                    area1: newArea1,
                    area2: newArea2,
                    threshold: this.elThreshold.value,
                    selectedGenes: this.elGenesInput.selectedGenes,
                    mode: this.rootChild.querySelector('input[probemode]').checked
                })
            }

            sendAnalysis(analysisInfo) {

                const analysisCard = document.createElement('fzj-xg-webjugex-analysis-card')
                analysisCard.analysisObj = analysisInfo
                
                const container = document.getElementById('fzj.xg.webjugex.container')

                container.appendChild(analysisCard)
                const headers = new Headers()
                headers.append('Content-Type', 'application/json')
                const request = new Request(backendBasePath + 'jugex', {
                    method: 'POST',
                    headers: headers,
                    mode: 'cors',
                    body: JSON.stringify(analysisInfo)
                })
                fetch(request)
                    .then(resp => {
                        if (resp.ok) {
                            return Promise.resolve(resp)
                        }
                        else {
                            return new Promise((resolve, reject) => {
                                resp.text()
                                    .then(text => reject(text))
                            })
                        }
                    })
                    .then(resp => resp.text())
                    .then(text => {

                        const createRow = () => {
                            const domDownload = document.createElement('div')
                            domDownload.style.display = 'flex'
                            domDownload.style.flexDirection = 'row'
                            const col1 = document.createElement('div')
                            const col2 = document.createElement('div')
                            col2.style.flex = col1.style.flex = '0 0 50%'
                            domDownload.appendChild(col1)
                            domDownload.appendChild(col2)
                            return [domDownload, col1, col2]
                        }

                        debugger
                        
                        container.removeChild(analysisCard)
                        const resultCard = document.createElement('fzj-xg-webjugex-result-success-card')
                        container.appendChild(resultCard)
                        const date = new Date()
                        const dateDownload = '' + date.getFullYear() + (date.getMonth() + 1) + date.getDate() + '_' + date.getHours() + ':' + date.getMinutes()
                        resultCard.panelHeader.innerHTML += '(' + dateDownload + ')'
                        resultCard.resultObj = JSON.parse(text)
                        const extension = createRow()
                        extension[0].style.order = -1
                        if (resultCard.resultObj.length == 3) {
                            extension[1].innerHTML = 'Probe ids'
                        }
                        else if (resultCard.resultObj.length == 2) {
                            extension[1].innerHTML = 'Gene Symbol'
                        }
                        extension[1].style.fontWeight = 900
                        extension[2].innerHTML = 'Pval'
                        extension[2].style.fontWeight = 900
                        resultCard.panelBody.style.maxHeight = '400px'
                        resultCard.panelBody.style.overflowY = 'scroll'
                        resultCard.panelBody.appendChild(extension[0])
                        let count = 0
                        for (let key in resultCard.resultObj[1]) {
                            count = count + 1
                        }
                        for (let key in resultCard.resultObj[1]) {
                            resultCard.pvalString += [key, resultCard.resultObj[1][key]].join(',') + '\n'
                        }
                        if (count < 2) {
                            for (let key in resultCard.resultObj[1]) {
                                const extension1 = createRow()
                                extension1[0].style.order = Number(resultCard.resultObj[1][key]) ? Math.round(Number(resultCard.resultObj[1][key]) * 1000) : 1000
                                extension1[1].innerHTML = key
                                extension1[2].innerHTML = resultCard.resultObj[1][key]
                                resultCard.panelBody.appendChild(extension[0])
                            }
                        }
                        else {
                            let v = 0
                            for (let key in resultCard.resultObj[1]) {
                                const extension2 = createRow()
                                extension2[0].style.order = Number(resultCard.resultObj[1][key]) ? Math.round(Number(resultCard.resultObj[1][key]) * 1000) : 1000
                                if (v == 0 || v == count - 1) {
                                    extension2[1].innerHTML = key
                                    extension2[2].innerHTML = resultCard.resultObj[1][key]
                                }
                                else if (v == 1 || v == 2) {
                                    extension2[1].innerHTML = '...'
                                    extension2[2].innerHTML = '...'
                                }
                                v = v + 1
                                resultCard.panelBody.appendChild(extension2[0])
                            }
                        }
                        resultCard.areaString = 'ROI, x, y, z, '
                        if (resultCard.resultObj.length == 3) {
                            resultCard.areaString += resultCard.resultObj[2] + '\n'
                        }
                        else {
                            for (let key in resultCard.resultObj[1]) {
                                resultCard.areaString += key + ','
                            }
                            resultCard.areaString = resultCard.areaString.slice(0, -1)
                            resultCard.areaString += '\n'
                        }
    
                        /* injected to add landmarks */
                        const newLandmarks = []
    
                        for (let key in resultCard.resultObj[0]) {
                            for (let i in resultCard.resultObj[0][key]) {
                                resultCard.areaString += key + ',' + resultCard.resultObj[0][key][i]['xyz'].join(',') + ',' + resultCard.resultObj[0][key][i]['winsorzed_mean'] + '\n'
                                
                                const pos = resultCard.resultObj[0][key][i]['xyz']
                                const newLandmark = {
                                    pos : pos,
                                    id : pos.join('_'),
                                    properties : pos.join('_'),
                                    hover:false
                                }
                                newLandmarks.push(newLandmark)
                                // landmarkService.addLandmark(newLandmark)
                            }
                        }
    
                        // newLandmarks.forEach((lm,idx)=>landmarkService.TEMP_parseLandmarkToVtk(lm,idx))
    
                        /* end */
    
                        const domDownloadPVal = parseContentToCsv(resultCard.pvalString)
                        domDownloadPVal.innerHTML = 'Download Pvals of genes (' + dateDownload + ')'
                        domDownloadPVal.setAttribute('download', 'PVal.csv')
                        resultCard.panelBody.append(domDownloadPVal)
                        const linebreak = document.createElement("br")
                        resultCard.panelBody.append(linebreak)
                        const domDownloadArea = parseContentToCsv(resultCard.areaString)
                        domDownloadArea.innerHTML = 'Download sample coordinates (' + dateDownload + ')'
                        domDownloadArea.setAttribute('download', `SampleCoordinates.csv`)
                        domDownloadArea.style.order = -3
                        resultCard.panelBody.append(domDownloadArea)
                    })
                    .catch(e => {
                        console.log('Here 2')
                        container.removeChild(analysisCard)
                        const resultCard = document.createElement('fzj-xg-webjugex-result-failure-card')
                        container.appendChild(resultCard)
                        console.log('error', e)
                        resultCard.panelBody.innerHTML = e
                    })
    
            };
        }

        register('fzj-xg-webjugex-search-card', WebJuGExSearchComponent)

        /* custom class for analysis-card */
        class WebJuGExAnalysisComponent extends HTMLElement {
            constructor() {
                super()
                this.template = ``
                this.analysisObj = {}
                this.status = 'pending'
            }

            connectedCallback() {
                
                while(this.lastChild){
                    this.removeChild(this.lastChild)
                }

                // const shadowRoot = this.attachShadow({mode:'open'})
                this.childRoot = document.createElement('div')
                this.appendChild(this.childRoot)
                this.render()
                this.panelHeader = this.childRoot.querySelector('[panelHeader]')
            }

            render() {

                this.template =
                    `
                <div>
                <div class="progress">
                <div class="progress-bar progress-bar-striped active" style="width:100%"></div>
                </div>
                </div>
                `
                this.childRoot.innerHTML = this.template
            }
        }
        
        register('fzj-xg-webjugex-analysis-card', WebJuGExAnalysisComponent)

        const parseContentToCsv = (content) => {
            const CSVContent = 'data:text/csv;charset=utf-8,' + content
            const CSVURI = encodeURI(CSVContent)
            const domDownload = document.createElement('a')
            domDownload.setAttribute('href', CSVURI)
            return domDownload
        }
        /* custom class for analysis-card */


        class WebJuGExResultSuccessComponent extends HTMLElement {
            constructor() {
                super()
                this.template = ``
                this.resultObj = {}
                this.pvalString = ''
                this.areaString = ''
                this.status = 'pending'
            }

            connectedCallback() {
                
                while(this.lastChild){
                    this.removeChild(this.lastChild)
                }

                // const shadowRoot = this.attachShadow({mode:'open'})
                this.childRoot = document.createElement('div')
                this.appendChild(this.childRoot)
                this.render()

                this.panelHeader = this.childRoot.querySelector('[panelHeader]')
                this.panelBody = this.childRoot.querySelector('[panelBody]')
                this.panelHeader.addEventListener('click', () => {
                    this.uiTogglePanelBody()
                })
            }

            uiTogglePanelBody() {
                if (/hidden/.test(this.panelBody.className)) {
                    this.panelBody.classList.remove('hidden')
                } else {
                    this.panelBody.classList.add('hidden')
                }
            }

            render() {
                this.template =
                    `
                <div>
                <div class = "panel panel-success">
                <div class = "btn btn-default btn-block panel-heading" panelHeader>
                <span class="glyphicon glyphicon-ok"></span> Request completed! <u> Details below.</u>
                </div>
                <div class = "panel-body hidden" panelBody>
                </div>
                <div class = "panel-footer hidden" panelFooter>
                </div>
                </div>
                </div>
                `
                this.childRoot.innerHTML = this.template
            }
        }

        class WebJuGExResultFailureComponent extends HTMLElement {
            constructor() {
                super()
                this.template = ``
                this.resultObj = {}
                this.pvalString = ''
                this.areaString = ''
                this.status = 'pending'
            }

            connectedCallback() {
                
                while(this.lastChild){
                    this.removeChild(this.lastChild)
                }

                // const shadowRoot = this.attachShadow({mode:'open'})
                this.childRoot = document.createElement('div')
                this.appendChild(this.childRoot)
                this.render()

                this.panelHeader = this.childRoot.querySelector('[panelHeader]')
                this.panelBody = this.childRoot.querySelector('[panelBody]')
                this.panelHeader.addEventListener('click', () => {
                    this.uiTogglePanelBody()
                })
            }

            uiTogglePanelBody() {
                if (/hidden/.test(this.panelBody.className)) {
                    this.panelBody.classList.remove('hidden')
                } else {
                    this.panelBody.classList.add('hidden')
                }
            }

            render() {
                this.template =
                    `
                <div>
                <div class = "panel panel-danger">
                <div class = "btn btn-default btn-block panel-heading" panelHeader>
                <span class="glyphicon glyphicon-remove"></span> Error. Check below.
                </div>
                <div class = "panel-body hidden" panelBody>
                </div>
                <div class = "panel-footer hidden" panelFooter>
                </div>
                </div>
                </div>
                `
                this.childRoot.innerHTML = this.template
            }
        }

        register('fzj-xg-webjugex-result-success-card', WebJuGExResultSuccessComponent)
        register('fzj-xg-webjugex-result-failure-card', WebJuGExResultFailureComponent)

        interactiveViewer.pluginControl['fzj.hb.jugex'].onShutdown(() => {
            console.log('shutting down fzj jugex')
            // landmarkService.TEMP_clearVtkLayers()
            interactiveViewer.pluginControl.unloadExternalLibraries(['webcomponentsLite'])
        })

    }
    interactiveViewer.pluginControl.loadExternalLibraries(['webcomponentsLite'])
        .then(() => code())
        .catch(console.warn)
})()


