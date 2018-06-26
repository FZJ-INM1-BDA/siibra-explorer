(()=>{
  const PLUGIN_NAME = `fzj.hb.JuGEx`
  const DOM_PARSER = new DOMParser()
  const MIN_CHAR = 3
  const URL_BASE = 'http://medpc055.ime.kfa-juelich.de:8003'

  class HoverRegionSelectorComponent extends HTMLElement{
    constructor(){
      super()

      this.template = 
      `
        <div class = "input-group">
          <input value = "${this.selectedRegion ? this.selectedRegion.name : ''}" class = "form-control" placeholder = "" readonly = "readonly" type = "text" region />
          <span class = "input-group-btn">
            <div class = "btn btn-default" editRegion>
              <span class = "glyphicon glyphicon-edit"></span>
            </div>
          </span>
        </div>
      `

      this.elTemplate = DOM_PARSER.parseFromString(this.template,'text/html') // or use innerHTML... whichever suits you

      this.elTemplate2 = document.createElement('div')
      this.elTemplate2.innerHTML = this.template

      this.renderedFlag = false
      this.listening = true
      this.selectedRegion = null
      this.shutdownHooks = []

      this.rootChild = document.createElement('div')
      this.appendChild(this.rootChild)
      this.firstrender = true

      this.init()
      window.pluginControl[PLUGIN_NAME].onShutdown((this.onShutdown).bind(this))
    }

    /* class method */
    /* connectedCallback can get called multiple times during the lifetime of a widget.
    most prominently, when the user chooses to dock the widget, or minimise the widget. */
    connectedCallback(){
      this.render()
      this.attachEventListeners()
    }

    /* class method */
    /* ditto, see above */
    disconnectedCallback(){
      this.unattachEventListeners()
    }

    /* in this example, the init funciton attaches any permanent listeners, such as, in this
    case, mouseovernehuba event stream */
    init(){
      this.mouseOverNehuba = window.viewerHandle.mouseOverNehuba.filter(()=>this.listening).subscribe(ev=>{
        this.selectedRegion = ev.foundRegion
        this.render()
        this.attachEventListeners()
      })
    }

    /* cleaning up when the user permanently closes the widget */
    onShutdown(){
      this.mouseOverNehuba.unsubscribe()
    }

    render(){
      if(!this.firstrender){
        this.unattachEventListeners()
        this.firstrender = false
      }
      while(this.rootChild.lastChild){
        this.rootChild.removeChild(this.rootChild.lastChild)
      }

      this.template = 
      `
        <div class = "input-group">
          <input value = "${this.selectedRegion ? this.selectedRegion.name : ''}" class = "form-control" placeholder = "" readonly = "readonly" type = "text" region />
          <span class = "input-group-btn">
            <div class = "btn btn-default" editRegion>
              <span class = "glyphicon glyphicon-edit"></span>
            </div>
          </span>
        </div>
      `
      this.elTemplate2.innerHTML = this.template
      this.rootChild.appendChild(this.elTemplate2)
    }

    clearAndRelisten(ev){
      this.listening = true
      this.selectedRegion = null
      this.render()
      this.attachEventListeners()
    }

    attachEventListeners(){
      this.rootChild.querySelector('div[editRegion]').addEventListener('click',(this.clearAndRelisten).bind(this))
    }

    unattachEventListeners(){
      this.rootChild.querySelector('div[editRegion]').addEventListener('click',(this.clearAndRelisten).bind(this))
    }
  }

  class DismissablePill extends HTMLElement{
    constructor(){
      super()
      this.name = ``
      this.template = 
      `
      <span class = "label label-default">
        <span pillName>${this.name}</span>
        <span class = "glyphicon glyphicon-remove" pillRemove></span>
      </span>
      `
    }

    render(){
      this.template = 
      `
      <span class = "label label-default">
        <span pillName>${this.name}</span>
        <span class = "glyphicon glyphicon-remove" pillRemove></span>
      </span>
      `
      this.elTemplate = document.createElement('span')
      // this.elTemplate = DOM_PARSER.parseFromString(this.template,'text/html')
      this.elTemplate.innerHTML = this.template

      while(this.lastChild){
        this.removeChild(this.lastChild)
      }
      this.appendChild(this.elTemplate)
    }

    connectedCallback(){
      this.render()
      this.attachEventListeners()
    }

    disconnectedCallback(){
      this.unattachEventListeners()
    }

    attachEventListeners(){
      this.querySelector('span[pillRemove]').addEventListener('click',(this.dismissPill).bind(this))
    }

    unattachEventListeners(){
      this.querySelector('span[pillRemove]').removeEventListener('click',(this.dismissPill).bind(this))
    }

    dismissPill(){
      this.onRemove(this.name)
      this.remove()
    }
    
    /* needs to be overwritten by parent, if parent needs to listen to the on remove event */
    onRemove(){

    }
  }

  class WebjugexGeneComponent extends HTMLElement{
    constructor(){
      super()
      this.arrDict = []
      this.autocompletesuggestion = []
      this.selectedGenes = []
      this.template = 
      `
        <div class = "input-group">
          <input geneInputBox type = "text" class = "form-control" placeholder = "Enter gene of interest ..." />
          <input geneImportInput class = "hidden" type = "file" />
          <span class = "input-group-btn">
            <div geneAdd class = "btn btn-default" title = "Add a gene">Add</div>
            <div geneImport class = "btn btn-default" title = "Import a CSV file">Import</div>
            <div geneExport class = "btn btn-default" title = "Export selected genes into a CSV file">Export</div>
          </span>
        </div>
      `

      window.pluginControl[PLUGIN_NAME].onShutdown((this.unloadExternalResources).bind(this))
      this.firstrender = true
    }

    connectedCallback(){
      if(this.firstrender){

        this.elTemplate = document.createElement('div')
        this.elTemplate.innerHTML = this.template
        this.rootChild = document.createElement('div')
        this.appendChild(this.rootChild)
        this.rootChild.appendChild(this.elTemplate)
        this.init()
        this.firstrender = false
      }
      // this.render()
      // this.attachEventListeners()
      /* see below */
    }

    disconnectedCallback(){
      // this.unattachEventListeners()
      /* see below */
    }

    // render(){
    //   while(this.lastChild){
    //     this.removeChild(lastChild)
    //   }
    //   this.appendChild(this.elTemplate)
    // }

    /* in special circumstances, where the view does not change too much, but there are numerous
    eventlisteners, it maybe more efficient to only attach event listener once,  */
    init(){
      
      this.elGeneInputBox = this.rootChild.querySelector('input[geneInputBox]')
      this.elGeneImportInput = this.rootChild.querySelector('input[geneImportInput]')
      this.elGeneAdd = this.rootChild.querySelector('div[geneAdd]')
      this.elGeneImport = this.rootChild.querySelector('div[geneImport]')
      this.elGeneExport = this.rootChild.querySelector('div[geneExport]')
      
      const importGeneList = (file) => {
        const csvReader = new FileReader()
        csvReader.onload = (ev)=>{
          const csvRaw = ev.target.result
          this.selectedGenes.splice(0,this.selectedGenes.length)
          csvRaw.split(/\r|\r\n|\n|\t|\,|\;/).forEach(gene=>{
              if(gene.length > 0)
              this.addGene(gene)
          })
        }
        csvReader.readAsText(file,'utf-8')
      }

      this.elGeneImportInput.addEventListener('change',(ev)=>{
        importGeneList(ev.target.files[0])
      })

      this.elGeneImport.addEventListener('click',()=>{
        this.elGeneImportInput.click()
      })
      this.elGeneExport.addEventListener('click',()=>{
        const exportGeneList = 'data:text/csv;charset=utf-8,'+this.selectedGenes.join(',')
        const exportGeneListURI = encodeURI(exportGeneList)
        const dlExportGeneList = document.createElement('a')
        dlExportGeneList.setAttribute('href',exportGeneListURI)
        document.body.appendChild(dlExportGeneList)
        const date = new Date()
        dlExportGeneList.setAttribute('download',`exported_genelist_${''+date.getFullYear()+(date.getMonth()+1)+date.getDate()+'_'+date.getHours()+date.getMinutes()}.csv`)
        dlExportGeneList.click()
        document.body.removeChild(dlExportGeneList)
      })
      this.elGeneAdd.addEventListener('click',()=>{
        if(this.autocompleteSuggestions.length > 0 && this.elGeneInputBox.value.length >= MIN_CHAR)
        this.addGene(this.autocompleteSuggestions[0])
      })

      this.elGeneInputBox.addEventListener('dragenter',(ev)=>{
        this.elGeneInputBox.setAttribute('placeholder','Drop file here to be uploaded')
      })

      this.elGeneInputBox.addEventListener('dragleave',(ev)=>{
        this.elGeneInputBox.setAttribute('placeholder','Enter gene of interest ... ')
      })

      this.elGeneInputBox.addEventListener('drop',(ev)=>{
        ev.preventDefault()
        ev.stopPropagation()
        ev.stopImmediatePropagation()
        this.elGeneInputBox.setAttribute('placeholder','Enter gene of interest ... ')
        //ev.dataTransfer.files[0]
      })

      this.elGeneInputBox.addEventListener('dragover',(ev)=>{
        ev.preventDefault()
        ev.stopPropagation()
        ev.stopImmediatePropagation()
      })

      this.elGeneInputBox.addEventListener('keydown',(ev)=>{
        ev.stopPropagation()
        ev.stopImmediatePropagation()
        if(ev.key=='Enter') this.elGeneAdd.click()
      })

      Promise.all([
        this.loadExternalResources(),
        fetch(URL_BASE).then(txt=>txt.json())
      ])
        .then(arr=>{
          this.arrDict = arr[1]

          console.log('attaching autocomplete')

          this.autocompleteInput = new autoComplete({
            selector : this.elGeneInputBox,
            delay : 0,
            minChars : MIN_CHAR,
            cache : false,
            source : (term,suggest)=>{
              const searchTerm = new RegExp('^'+term,'gi')
              this.autocompleteSuggestions = this.arrDict.filter(dict=>searchTerm.test(dict))
              suggest(this.autocompleteSuggestions)
            },
            onSelect : (e,term,item)=>{
              this.addGene(term)
            }
          })
        })
        .catch(err=>{
          console.error('loading external resources failed ... ',err)
          // console.log('failed to fetch full list of genes... using limited list of genes instead ...',e)
          // this.arrDict = ["ADRA2A", "AVPR1B", "CHRM2", "CNR1", "CREB1", "CRH", "CRHR1", "CRHR2", "GAD2", "HTR1A", "HTR1B", "HTR1D", "HTR2A", "HTR3A", "HTR5A", "MAOA", "PDE1A", "SLC6A2", "SLC6A4", "SST", "TAC1", "TPH1", "GPR50", "CUX2", "TPH2"]
        })
    }

    loadExternalResources(){
      return new Promise((rs,rj)=>Promise.all([
        new Promise((resolve,reject)=>{
          this.autoCompleteCss = document.createElement('link')
          this.autoCompleteCss.type = 'text/css'
          this.autoCompleteCss.rel = 'stylesheet'
          this.autoCompleteCss.onload = () => resolve()
          this.autoCompleteCss.onerror = (e) => reject(e)
          this.autoCompleteCss.href = '/res/css/js-autocomplete.min.css'
          document.head.appendChild(this.autoCompleteCss)
        }),
        new Promise((resolve,reject)=>{
          this.autoCompleteJs = document.createElement('script')
          this.autoCompleteJs.onload = () => resolve()
          this.autoCompleteJs.onerror = (e) => reject(e)
          this.autoCompleteJs.src = '/res/js/js-autocomplete.min.js'
          document.head.appendChild(this.autoCompleteJs)
        })
      ])
      .then(()=>rs())
      .catch(e=>rj(e))
    )}

    unloadExternalResources(){
      document.head.removeChild(this.autoCompleteJs)
      document.head.removeChild(this.autoCompleteCss)
    }

    addGene(gene){
      const pill = document.createElement('dismissable-pill-card')
      pill.onRemove = (name) => 
        this.selectedGenes.splice(this.selectedGenes.indexOf(name),1)

      pill.name = gene
      this.rootChild.appendChild(pill)
      this.selectedGenes.push(gene)
      this.elGeneInputBox.value = ''
      this.elGeneInputBox.blur()
      this.elGeneInputBox.focus()
    }
  }

  class WebjugexSearchComponent extends HTMLElement{
    constructor(){
      super()
      this.template = 
      `
      
      <div class = "row">
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
          <hover-region-selector-card area1></hover-region-selector-card>
        </div>
        <div class = "col-md-12">
          <hover-region-selector-card area2></hover-region-selector-card>
        </div>
        <div class = "col-md-12">
        <div class = "input-group">
          <span class = "input-group-addon">
            Threshold
          </span>
          <input value = "0.20" class = "form-control" type = "range" min = "0" max = "1" step = "0.01" threshold />
          <span class = "input-group-addon" thresholdValue>
          0.20
          </span>
        </div>
        <div class="input-group">
          <input type="checkbox" probemode /> Single Probe Mode
        </div>
      </div>
      <div class = "row">
        <div class = "col-md-12">
          <fzj-xg-webjugex-gene-card>
          </fzj-xg-webjugex-gene-card>
        </div>
      </div>
      <div class = "row">
        <div class = "col-md-12">
          <div class = "btn btn-default btn-block" analysisSubmit>
            Start differential analysis
          </div>
        </div>
      </div>
      `
      this.mouseEventSubscription = this.rootChild = this.threshold = this.elArea1 = this.elArea2 = null
      this.selectedGenes = []
      this.firstrender = true

    }

    connectedCallback(){
      if(this.firstrender){
        this.init()
        this.firstrender = false
      }
    }

    init(){
      // this.elTemplate = DOM_PARSER.parseFromString(this.template,'text/html')
      this.elTemplate = document.createElement('div')
      this.elTemplate.innerHTML = this.template
      this.appendChild(this.elTemplate)

      this.elArea1 = this.querySelector('hover-region-selector-card[area1]')
      this.elArea2 = this.querySelector('hover-region-selector-card[area2]')
      this.elArea1.listening = true
      this.elArea2.listening = false
      this.probemodeval = false

      this.elGenesInput = this.querySelector('fzj-xg-webjugex-gene-card')

      this.elAnalysisSubmit = this.querySelector('div[analysisSubmit]')
      this.elAnalysisSubmit.style.marginBottom = '20px'
      this.elAnalysisSubmit.addEventListener('click',()=>this.analysisGo())

      this.elThreshold = this.querySelector('input[threshold]')
      const elThresholdValue = this.querySelector('span[thresholdValue]')
      this.elThreshold.addEventListener('input',(ev)=> elThresholdValue.innerHTML = parseFloat(this.elThreshold.value).toFixed(2) )

      this.onViewerClick()

      window.pluginControl[PLUGIN_NAME].onShutdown(()=>{
        this.mouseEventSubscription.unsubscribe()
      })
    }

    onViewerClick(){
      this.mouseEventSubscription = window.viewerHandle.mouseEvent.filter(ev=>ev.eventName=='click').subscribe(ev=>{
          if(this.elArea1.listening && this.elArea2.listening){
              this.elArea1.listening = false
          }
          else if(this.elArea2.listening){
              this.elArea2.listening = false
          }
          else if(this.elArea1.listening){
              if(this.elArea2.selectedRegion == null){
                  this.elArea1.listening = false
                  this.elArea2.listening = true
              }
              else if(this.elArea2.selectedRegion != null){
                  this.elArea1.listening = false
              }
          }
        })
    }

    analysisGo(){
      /* test for submit conditions */
      if(this.elArea1.selectedRegion == null || this.elArea2.selectedRegion == null || this.elGenesInput.selectedGenes.length < 1){
        const resultCard = document.createElement('fzj-xg-webjugex-result-failure-card')
        container.appendChild(resultCard)
        let e = 'Error: We need '
        if(this.elArea1.selectedRegion == null || this.elArea2.selectedRegion == null) e += 'both areas to be defined and '
        if(this.elGenesInput.selectedGenes.length < 1) e += 'atleast one gene'
        else e = e.substr(0, 40)
        e += '.'
        resultCard.panelBody.innerHTML = e
        return
      }
      console.log(this.elArea1.selectedRegion,this.elArea2.selectedRegion,this.elArea1.selectedRegion.PMapURL,this.elArea2.selectedRegion.PMapURL,this.elThreshold.value,this.elGenesInput.selectedGenes)
      const region1 = Object.assign({},this.elArea1.selectedRegion,{url:this.elArea1.selectedRegion.PMapURL})
      const region2 = Object.assign({},this.elArea2.selectedRegion,{url:this.elArea2.selectedRegion.PMapURL})
      this.sendAnalysis({
        area1 : region1,
        area2 : region2,
        threshold : this.elThreshold.value,
        selectedGenes : this.elGenesInput.selectedGenes,
        mode : this.querySelector('input[probemode]').checked
      })
    }

    sendAnalysis(analysisInfo){
      /* to be overwritten by parent class */
    }
  }
  
  /* custom class for analysis-card */
  class WebJuGExAnalysisComponent extends HTMLElement{
    constructor(){
      super()
      this.template = ``
      this.analysisObj = {}
      this.status = 'pending'
    }

    connectedCallback(){
      this.render()
      this.panelHeader = this.querySelector('[panelHeader]')
    }

    render(){

      this.template =
      `
        <div class = "row">
          <div class="progress">
            <div class="progress-bar progress-bar-striped active" style="width:100%"></div>
          </div>
        </div>
      `
      this.innerHTML = this.template
    }
  }

  
  const searchCard = document.querySelector('fzj-xg-webjugex-search-card')
  const container = document.getElementById('fzj.xg.webjugex.container')
  const parseContentToCsv = (content)=>{
      const CSVContent = 'data:text/csv;charset=utf-8,'+content
      const CSVURI = encodeURI(CSVContent)
      const domDownload = document.createElement('a')
      domDownload.setAttribute('href',CSVURI)
      return domDownload
  }
  const createRow = ()=>{
      const domDownload = document.createElement('div')
      domDownload.style.display = 'flex'
      domDownload.style.flexDirection = 'row'
      const col1 = document.createElement('div')
      const col2 = document.createElement('div')
      col2.style.flex = col1.style.flex = '0 0 50%'
      domDownload.appendChild(col1)
      domDownload.appendChild(col2)
      return [domDownload,col1,col2]
  }
  /* custom class for analysis-card */


  class WebJuGExResultSuccessComponent extends HTMLElement{
      constructor(){
          super()
          this.template = ``
          this.resultObj = {}
          this.pvalString = ''
          this.areaString = ''
          this.status = 'pending'
          this.firstrender = true
      }

      connectedCallback(){
        
        if(this.firstrender){
          this.childRoot = document.createElement('div')
          this.appendChild(this.childRoot)
          this.render()

          this.panelHeader = this.childRoot.querySelector('[panelHeader]')
          this.panelBody = this.childRoot.querySelector('[panelBody]')
          this.panelHeader.addEventListener('click',()=>{
            this.uiTogglePanelBody()
          })
          this.firstrender = false
        }
      }

      uiTogglePanelBody(){
          if(/hidden/.test(this.panelBody.className)){
              this.panelBody.classList.remove('hidden')
          }else{
              this.panelBody.classList.add('hidden')
          }
      }

      render(){
          this.template =
          `
          <div class = "row">
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

  class WebJuGExResultFailureComponent extends HTMLElement{
      constructor(){
          super()
          this.template = ``
          this.resultObj = {}
          this.pvalString = ''
          this.areaString = ''
          this.status = 'pending'
          this.firstrender = true
      }

      connectedCallback(){
          // const shadowRoot = this.attachShadow({mode:'open'})
          if(this.firstrender){

            this.childRoot = document.createElement('div')
            this.appendChild(this.childRoot)
            this.render()
  
            this.panelHeader = this.childRoot.querySelector('[panelHeader]')
            this.panelBody = this.childRoot.querySelector('[panelBody]')
            this.panelHeader.addEventListener('click',()=>{
                                                  this.uiTogglePanelBody()
                                              })
            this.firstrender = false
          }
      }

      uiTogglePanelBody(){
          if(/hidden/.test(this.panelBody.className)){
              this.panelBody.classList.remove('hidden')
          }else{
              this.panelBody.classList.add('hidden')
          }
      }

      render(){
          this.template =
          `
          <div class = "row">
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

  searchCard.sendAnalysis = (analysisInfo) => {

    console.log(analysisInfo)

      const analysisCard = document.createElement('fzj-xg-webjugex-analysis-card')
      analysisCard.analysisObj = analysisInfo
      container.appendChild(analysisCard)
      const headers = new Headers()
      headers.append('Content-Type','application/json')
      const request = new Request(`${URL_BASE}/jugex`,{
        method : 'POST',
        headers : headers,
        mode : 'cors',
        body : JSON.stringify(analysisInfo)
      })
      fetch(request)
        .then(resp => {
          if (resp.ok){
            return Promise.resolve(resp)
          }
          else {
            return new Promise((resolve,reject)=>{
              resp.text()
                .then(text=>reject(text))
            })
          }
        })
      .then(resp=>resp.text())
      .then(text=>{
        container.removeChild(analysisCard)
        const resultCard = document.createElement('fzj-xg-webjugex-result-success-card')
        container.appendChild(resultCard)
        const date = new Date()
        const dateDownload = ''+date.getFullYear()+(date.getMonth()+1)+date.getDate()+'_'+date.getHours()+':'+date.getMinutes()
        resultCard.panelHeader.innerHTML += '('+dateDownload+')'
        resultCard.resultObj = JSON.parse(text)
        extension = createRow()
        extension[0].style.order = -1
        if(resultCard.resultObj.length == 3){
            extension[1].innerHTML = 'Probe ids'
        }
        else if(resultCard.resultObj.length == 2){
            extension[1].innerHTML = 'Gene Symbol'
        }
        extension[1].style.fontWeight = 900
        extension[2].innerHTML = 'Pval'
        extension[2].style.fontWeight = 900
        resultCard.panelBody.style.maxHeight = '400px'
        resultCard.panelBody.style.overflowY = 'scroll'
        resultCard.panelBody.appendChild(extension[0])
        let count = 0
        for(let key in resultCard.resultObj[1]){
            count = count+1
        }
        for(let key in resultCard.resultObj[1]){
            resultCard.pvalString += [key, resultCard.resultObj[1][key]].join(',') + '\n'
        }
        if (count < 2){
            for (let key in resultCard.resultObj[1]){
                extension = createRow()
                extension[0].style.order = Number(resultCard.resultObj[1][key]) ? Math.round(Number(resultCard.resultObj[1][key])*1000) : 1000
                extension[1].innerHTML = key
                extension[2].innerHTML = resultCard.resultObj[1][key]
                resultCard.panelBody.appendChild(extension[0])
            }
        }
        else{
            let v = 0
            for(let key in resultCard.resultObj[1]){
                extension = createRow()
                extension[0].style.order = Number(resultCard.resultObj[1][key]) ? Math.round(Number(resultCard.resultObj[1][key])*1000) : 1000
                if(v == 0  || v == count-1){
                    extension[1].innerHTML = key
                    extension[2].innerHTML = resultCard.resultObj[1][key]
                }
                else if (v == 1 || v == 2){
                    extension[1].innerHTML = '...'
                    extension[2].innerHTML = '...'
                }
                v = v+1
                resultCard.panelBody.appendChild(extension[0])
            }
        }
        resultCard.areaString = 'ROI, x, y, z, '
        if(resultCard.resultObj.length == 3){
            resultCard.areaString +=  resultCard.resultObj[2]+'\n'
        }
        else{
            for(let key in resultCard.resultObj[1]){
                resultCard.areaString += key+','
            }
            resultCard.areaString = resultCard.areaString.slice(0, -1)
            resultCard.areaString += '\n'
        }
        for(let key in resultCard.resultObj[0]){
            for(let i in resultCard.resultObj[0][key]){
                resultCard.areaString += key+','+resultCard.resultObj[0][key][i]['xyz'].join(',')+','+resultCard.resultObj[0][key][i]['winsorzed_mean']+'\n'
            }
        }

        const domDownloadPVal = parseContentToCsv(resultCard.pvalString)
        domDownloadPVal.innerHTML = 'Download Pvals of genes ('+dateDownload+')'
        domDownloadPVal.setAttribute('download','PVal.csv')
        resultCard.panelBody.append(domDownloadPVal)
        linebreak = document.createElement("br")
        resultCard.panelBody.append(linebreak)
        const domDownloadArea = parseContentToCsv(resultCard.areaString)
        domDownloadArea.innerHTML = 'Download sample coordinates ('+dateDownload+')'
        domDownloadArea.setAttribute('download',`SampleCoordinates.csv`)
        domDownloadArea.style.order = -3
        resultCard.panelBody.append(domDownloadArea)
      })
      .catch(e=>{
        console.log('Here 2')
        container.removeChild(analysisCard)
        const resultCard = document.createElement('fzj-xg-webjugex-result-failure-card')
        container.appendChild(resultCard)
        console.log('error',e)
        resultCard.panelBody.innerHTML = e
      })
  }

  customElements.define('hover-region-selector-card', HoverRegionSelectorComponent)
  customElements.define('fzj-xg-webjugex-analysis-card',WebJuGExAnalysisComponent)
  
  customElements.define('fzj-xg-webjugex-result-success-card',WebJuGExResultSuccessComponent)
  customElements.define('fzj-xg-webjugex-result-failure-card',WebJuGExResultFailureComponent)
  
  customElements.define('dismissable-pill-card',DismissablePill)
  
  customElements.define('fzj-xg-webjugex-gene-card',WebjugexGeneComponent)
  customElements.define('fzj-xg-webjugex-search-card',WebjugexSearchComponent)
})()
