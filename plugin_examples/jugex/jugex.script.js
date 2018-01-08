(()=>{
      const preview = document.getElementById('fzj.xg.jugex.preview')
      const domArea1 = document.getElementById('fzj.xg.jugex.area1')
      const domArea2 = document.getElementById('fzj.xg.jugex.area2')
      const editArea1 = document.getElementById('fzj.xg.jugex.editarea1')
      const editArea2 = document.getElementById('fzj.xg.jugex.editarea2')
      const domGenes = document.getElementById('fzj.xg.jugex.genes')
      const addGene = document.getElementById('fzj.xg.jugex.addgenes')
      const geneList = document.getElementById('fzj.xg.jugex.genelist')
      const domSubmit = document.getElementById('fzj.xg.jugex.submit')
      const domWarning = document.getElementById('fzj.xg.jugex.warning')
      const domWarningText = document.getElementById('fzj.xg.jugex.warning.text')
      const domWarningClose = document.getElementById('fzj.xg.jugex.warning.close')
      domWarningClose.addEventListener('click',()=>{
            domWarning.className += ' hidden'
      })

      const domExportGeneList = document.getElementById('fzj.xg.jugex.genelist.export')
      domExportGeneList.addEventListener('click',()=>{
            const exportGeneList = 'data:text/csv;charset=utf-8,'+geneNames.join(',')
            const exportGeneListURI = encodeURI(exportGeneList)
            const dlExportGeneList = document.createElement('a')
            dlExportGeneList.setAttribute('href',exportGeneListURI)
            document.body.appendChild(dlExportGeneList)
            const date = new Date()
            dlExportGeneList.setAttribute('download',`exported_genelist_${''+date.getFullYear()+(date.getMonth()+1)+date.getDate()+'_'+date.getHours()+date.getMinutes()}.csv`)
            dlExportGeneList.click()
            document.body.removeChild(dlExportGeneList)
      })

      const importGeneList = (file) => {
            const csvReader = new FileReader()
            csvReader.onload = (ev)=>{
                  const csvRaw = ev.target.result
                  geneList.innerHTML = ''
                  geneNames.splice(0,geneNames.length)
                  csvRaw.split(',').forEach(gene=>{
                        fnAddGene(gene)
                  })
            }
            csvReader.readAsText(file,'utf-8')
      }

      const domImportGeneList = document.getElementById('fzj.xg.jugex.genelist.import')
      const domImportGeneListInput = document.getElementById('fzj.xg.jugex.genelist.import.input')
      domImportGeneListInput.addEventListener('change',(ev)=>{
            importGeneList(ev.target.files[0])
      })
      domImportGeneList.addEventListener('click',()=>{
            domImportGeneListInput.click()
      })

      const MINCHAR = 3

      const URLBASE = 'http://172.104.156.15:8003/'

      const geneNames = []

      let autocompleteSuggestions = []

      const fnAddGene = (gene) =>{
            const addGenePill = (name)=>{
                  const container = document.createElement('span')
                  container.className = 'label label-default'
                  const text = document.createElement('span')
                  text.innerHTML = name
                  const remove = document.createElement('span')
                  remove.className = 'glyphicon glyphicon-remove'
                  remove.addEventListener('click',()=>{
                        geneNames.splice(geneNames.indexOf(name),1)
                        geneList.removeChild(container)
                  })
                  container.appendChild(text)
                  container.appendChild(remove)
                  geneList.appendChild(container)

                  container.style.marginRight = '5px'
                  container.style.display = 'inline-block'
                  text.style.marginRight = '5px'
            }

            domGenes.value = ''
            domGenes.blur()
            domGenes.focus()
            if ( geneNames.find(name=>name.toUpperCase()==gene.toUpperCase()) ) {
                  return false
            }
            else {
                  geneNames.push(gene.toUpperCase())
                  addGenePill(gene.toUpperCase())
                  return true
            }
      }

      addGene.addEventListener('click',()=>{
            if(autocompleteSuggestions.length>0&&domGenes.value.length>=MINCHAR)
                  fnAddGene(autocompleteSuggestions[0])
      })

      domGenes.addEventListener('keydown',(ev)=>{
            if (ev.key=='Enter') addGene.click()
      })

      const domGenesGroup = document.getElementById('fzj.xg.jugex.genes.group')

      const resetDomGenes = ()=>{
            domGenes.style.backgroundColor = 'rgba(128,128,128,0.0)'
            domGenes.setAttribute('placeholder','Genes of interest ...')
      }

      domGenes.addEventListener('dragover',(ev)=>{
            domGenes.style.backgroundColor = 'rgba(128,128,128,0.2)'
            domGenes.setAttribute('placeholder','Drop CSV file here ...')
            ev.stopPropagation()
            ev.preventDefault()
      },false)

      domGenes.addEventListener('dragleave',(ev)=>{
            resetDomGenes()
      },false)

      domGenes.addEventListener('drop',function(ev){
            ev.stopPropagation();
            ev.preventDefault();
            resetDomGenes()
            importGeneList( ev.dataTransfer.files[0] )
      },false)

      const autocompleteCss = document.createElement('link')
      autocompleteCss.type = 'text/css'
      autocompleteCss.rel = 'stylesheet'
      autocompleteCss.href = 'http://172.104.156.15/css/js-autocomplete.min'

      const fetchAutocompleteDictionary = new Promise((resolve,reject)=>{
            fetch(URLBASE)
                .then(txt=>txt.json())
                .then(json=>resolve(json))
                .catch(e=>{
                    Console.log('fetch autocomplete list failed!Populating autocomplete with original short list',e)
                    resolve(["ADRA2A", "AVPR1B", "CHRM2", "CNR1", "CREB1", "CRH", "CRHR1", "CRHR2", "GAD2", "HTR1A", "HTR1B", "HTR1D", "HTR2A", "HTR3A", "HTR5A", "MAOA", "PDE1A", "SLC6A2", "SLC6A4", "SST", "TAC1", "TPH1", "GPR50", "CUX2", "TPH2"])
                })
      })

      let autocompleteEl
      const autocompleteJs = document.createElement('script')
      autocompleteJs.onload = ()=>{
            fetchAutocompleteDictionary.then(arrDict=>{
                  autocompleteEl = new autoComplete({
                        selector : domGenes,
                        delay : 0,
                        minChars : MINCHAR,
                        cache : false,
                        source : (term,suggest)=>{
                              const searchTerm = new RegExp('^'+term,'gi')
                              autocompleteSuggestions = arrDict.filter(dict=>searchTerm.test(dict))
                              suggest(autocompleteSuggestions)
                        },
                        onSelect : (e,term,item)=>{
                              fnAddGene(term)
                        }
                  })
            })
      }
      autocompleteJs.src = 'http://172.104.156.15/js/js-autocomplete.min'

      document.head.appendChild(autocompleteJs)
      document.head.appendChild(autocompleteCss)

      const pendingRequestPanel = ()=>{
            const panel = document.createElement('div')
            panel.className = "panel panel-warning"

            const panelHeader = document.createElement('div')
            panelHeader.className = "btn btn-block panel-heading"

            const panelBody = document.createElement('div')
            panelBody.className = "panel-body"
            panelBody.style.maxHeight = '400px'
            panelBody.style.overflowY = 'scroll'
            panelBody.style.display = 'flex'
            panelBody.style.flexDirection = 'column'
            panel.appendChild(panelHeader)
            panel.appendChild(panelBody)

            panelHeader.addEventListener('click',(ev)=>{
                  if(/hidden/gi.test(panelBody.className)){
                        panelBody.className = panelBody.className.replace(/\s?hidden/gi,'')
                  }else{
                        panelBody.className += ' hidden' 
                  }
            })

            return ({
                  panel : panel,
                  panelHeader : panelHeader,
                  panelBody : panelBody
            })
      }

      domSubmit.addEventListener('click',(ev)=>{
            const validation = () =>{
                  if( geneNames.length < 2 || domArea1.value == '' || domArea2.value == ''){
                        let errorMsg = '<ul>'
                        if (geneNames.length < 2 ) errorMsg += '<li>JuGeX requires at least two (2) genes to be selected! </li>'
                        if (domArea1.value == '') errorMsg += '<li>JuGeX requires area1 to be defined! </li>'
                        if (domArea2.value == '') errorMsg += '<li>JuGeX requires area2 to be defined! </li>'
                        domWarning.className = domWarning.className.replace(/hidden/,'')
                        domWarningText.innerHTML = errorMsg + '</ul>'
                        return false
                  } 
                  return true
            }
            if (!validation()) return

            domWarning.className += ' hidden'

            const requestBodyV2 = {
                  area1 : {
                        name : region1.name,
                        url : region1.PMapURL
                  },
                  area2 : {
                        name : region2.name,
                        url : region2.PMapURL
                  },
                  genelist : geneNames
            }

            const headers = new Headers()
            headers.append('Content-Type','application/json')

            const request = new Request(URLBASE+'jugex',{
                  method : 'POST',
                  headers : headers,
                  mode : 'cors',
                  body : JSON.stringify(requestBodyV2)
            })

            const panelObj = pendingRequestPanel()
            panelObj.panelHeader.innerHTML = 'Pending request'
            panelObj.panelBody.className += ' hidden'

            document.getElementById('fzj.xg.jugex.result').appendChild(panelObj.panel)
            const queryString = `Regions queried: ${requestBodyV2.area1.name} ${requestBodyV2.area2.name}. Genes queried: ${JSON.stringify(requestBodyV2.genelist).replace(/\"|\[|\]/gi,'')}`
            const domQueryString = document.createElement('div')
            domQueryString.style.order = -3
            domQueryString.innerHTML = queryString
            panelObj.panelBody.appendChild(domQueryString)
            
            fetch(request)
                  .then(resp=>resp.text())
                  .then(text=>{
                        
                        const domhr = document.createElement('hr')
                        domhr.style.order = -2
                        domhr.style.width = '100%'
                        panelObj.panelBody.appendChild(domhr)

                        const result = JSON.parse(text)
                        const createRow = ()=>{
                              const container = document.createElement('div')
                              container.style.display = 'flex'
                              container.style.flexDirection = 'row'
                              const col1 = document.createElement('div')
                              const col2 = document.createElement('div')
                              col2.style.flex = col1.style.flex = '0 0 50%'
                              container.appendChild(col1)
                              container.appendChild(col2)
                              return [container,col1,col2]
                        }
                        (()=>{
                              [container,col1,col2] = createRow()
                              container.style.order = -1
                              col1.innerHTML = 'gene'
                              col1.style.fontWeight = 900
                              col2.innerHTML = 'pval'
                              col2.style.fontWeight = 900
                              panelObj.panelBody.appendChild(container)
                        })()
            
                        for (let key in result[1]){
                              [container,col1,col2] = createRow()
                              container.style.order = Number(result[1][key]) ? Math.round(Number(result[1][key])*1000) : 1000
                              col1.innerHTML = key
                              col2.innerHTML = result[1][key]
                              panelObj.panelBody.appendChild(container)
                        }
                        
                        panelObj.panel.className = panelObj.panel.className.replace(/panel\-warning/gi,'')
                        panelObj.panel.className += ' panel-success'
                        panelObj.panelHeader.innerHTML = 'Request Completed.'
            
                        const domhr2 = document.createElement('hr')
                        domhr2.style.order = -1001
                        domhr2.style.width = '100%'
                        panelObj.panelBody.appendChild(domhr2)

                        /* appending download links */
                        const parseContentToCsv = (content)=>{
                              const CSVContent = 'data:text/csv;charset=utf-8,'+content
                              const CSVURI = encodeURI(CSVContent)
                              const domDownload = document.createElement('a')
                              domDownload.setAttribute('href',CSVURI)
                              return domDownload
                        }

                        const date = new Date()
                        const metadata = `Date: ${['',''+date.getFullYear()+(date.getMonth()+1)+date.getDate()+'_'+date.getHours()+date.getMinutes()].toString()}\nRegions: ${['',requestBodyV2.area1.name,requestBodyV2.area2.name].toString()}\nGenelist: ${['',...requestBodyV2.genelist].toString()}\n\n`
                        let pvalString = metadata
                        for(let key in result[1]){
                              pvalString += [key, result[1][key]].join(',') + '\n'
                        }
                        const domDownloadPVal = parseContentToCsv(pvalString)
                        domDownloadPVal.innerHTML = 'Download PVal CSV'
                        domDownloadPVal.setAttribute('download','PVal.csv')
                        domDownloadPVal.style.order = -3
                        panelObj.panelBody.appendChild(domDownloadPVal)

                        for(let key in result[0]){
                              let areaString = metadata
                              areaString += result[0][key].join('\n')
                              const domDownloadArea = parseContentToCsv(areaString)
                              domDownloadArea.innerHTML = `Download ${key} CSV`
                              domDownloadArea.setAttribute('download',`${key}.csv`)
                              domDownloadArea.style.order = -3
                              panelObj.panelBody.appendChild(domDownloadArea)
                        }

                        /* TODO remove the try catch block window.pluginControl should always be defined */
                        try{
                              window['pluginControl'].next({
                                    target : 'JuGeX',
                                    id : Date.now().toString(),
                                    code : 100,
                                    body : {
                                          blink : true,
                                          popoverMessage : 'Request completed! '
                                    }
                              })
                        }catch(e){
                              console.log('error, window.pluginControl not implemented',e)
                        }
                  })
                  .catch(e=>{
                        console.log('error',e)
                        panelObj.panel.className = panelObj.panel.className.replace(/panel\-warning/gi,'')
                        panelObj.panel.className += ' panel-danger'
                        panelObj.panelHeader.innerHTML = 'Error. Check console.'
                  })

      })

      let region1, region2

      const handleViewerSubscription = (ev) =>{

            const findRegion = new Promise((resolve,reject)=>{
                  const searchThroughChildren = (regions) =>{
                        const matchedRegion = regions.find(region=>region.labelIndex && region.labelIndex==ev.segment)
                        if(matchedRegion) {
                              resolve(matchedRegion)
                        }else{
                              regions.forEach(region=>{
                                    searchThroughChildren(region.children)
                              })
                        }
                  }
                  searchThroughChildren(window.nehubaUI.metadata.parcellation.regions)
                  reject('did not find anything')
            })

            findRegion
                  .then(region=>{
                        preview.innerHTML = ev.segment? `${region.name} label:${ev.segment}` :'&nbsp;'
                        if (document.activeElement === domArea1) {
                              domArea1.setAttribute('value', ev.segment ? `${region.name} label:${ev.segment}` : '')
                              region1 = region
                        }
                        if (document.activeElement === domArea2) {
                              domArea2.setAttribute('value', ev.segment ? `${region.name} label:${ev.segment}` : '')
                              region2 = region
                        }
                  })
                  .catch(e=>{
                        /* did not find the region in meta data */
                        preview.innerHTML = ev.segment? `label:${ev.segment}` :'&nbsp;'
                        if (document.activeElement === domArea1) domArea1.setAttribute('value', ev.segment ? `label:${ev.segment}` : '')
                        if (document.activeElement === domArea2) domArea2.setAttribute('value', ev.segment ? `label:${ev.segment}` : '')
                  })
      }
      
      const attachViewerSubscription = () =>{
            try{
                  return window.nehubaViewer.mouseOver.segment
                        .filter(ev=>ev.layer.name=='atlas')
                        .subscribe(ev=>{
                              handleViewerSubscription(ev)
                        })
            }catch(e){
                  /* viewer does not exist when plugin instantiated */
                  console.log('error!',e)
                  return null
            }
      }

      const clearEditArea = () =>{
            domArea1.setAttribute('placeholder','')
            domArea2.setAttribute('placeholder','')
      }

      editArea1.addEventListener('click',()=>{
            clearEditArea()
            domArea1.focus()
            domArea1.setAttribute('value','')
            domArea1.setAttribute('placeholder','Select a region ...')
      })

      editArea2.addEventListener('click',()=>{
            clearEditArea()
            domArea2.focus()
            domArea2.setAttribute('value','')
            domArea2.setAttribute('placeholder','Select a region ...')
      })

      let viewerSubscription
      
      /* TODO fix this... window.mouseEvent is not longer defined */
      let mouseEventSubscription
      try{
            mouseEventSubscription = window.mouseEvent
                  .filter(ev=>ev.mode=='click')
                  .subscribe(ev=>{
                        if( domArea1.getAttribute('value') == '' ){
                              domArea1.focus()
                        }else if( domArea2.getAttribute('value') == '' ){
                              domArea2.focus()
                        }
                  })
      }catch(e){
            console.log('old api, no longer works',e)
            console.log('reroute to new api to subscribe to new event')
            mouseEventSubscription = window.nehubaUI.mouseEvent
                  .filter(ev=>ev.mode=='click')
                  .subscribe(ev=>{
                        if( domArea1.getAttribute('value') == '' ){
                              domArea1.focus()
                        }else if( domArea2.getAttribute('value') == '' ){
                              domArea2.focus()
                        }
                  })
      }
      
      /* updated api */
      try{
            mouseEventSubscription = window.nehubaUI.mouseEvent
                  .filter(ev=>ev.mode=='click')
                  .subscribe(ev=>{
                        if( domArea1.getAttribute('value') == '' ){
                              domArea1.focus()
                        }else if( domArea2.getAttribute('value') == '' ){
                              domArea2.focus()
                        }
                  })
      }catch(e){
            console.log('error!!!!',e)
      }

      /* attach nehubaUI hooks. These should not fail */
      try{
            window.nehubaUI.viewControl
                  .filter(evPk=>evPk.target=='loadTemplate')
                  .subscribe(evPk=>{
                        if (evPk.code==100 && viewerSubscription) viewerSubscription.unsubscribe()
                        if (evPk.code==200)viewerSubscription = attachViewerSubscription()
                  })
            const shutdownHandler = window.pluginControl
                  .filter(evPk=>evPk.target=='fzj.xg.jugex'&&evPk.body.shutdown)
                  .subscribe(evPk=>{
                        console.log('jugex shutdown sequence started')
                        viewerSubscription.unsubscribe()
                        shutdownHandler.unsubscribe()
                        mouseEventSubscription.unsubscribe()
                        if(autocompleteEl) autocompleteEl.destroy()
                        document.head.removeChild(autocompleteCss)
                        document.head.removeChild(autocompleteJs)
                  })
      }catch(e){
            console.log('attaching nehubaUI hooks failed. probably should diagnose the issue.',e)
      }

      /* attach viewer subscription on init */
      try{
            viewerSubscription = window.nehubaViewer.mouseOver.segment
                  .filter(ev=>ev.layer.name=='atlas')
                  .subscribe(ev=>{
                        handleViewerSubscription(ev)
                  })
      }catch(e){
            console.log('viewer not yet initialised')
      }
})()
