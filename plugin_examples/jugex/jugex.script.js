(()=>{
      
      const domArea1 = document.getElementById('jugex.area1')
      const domArea2 = document.getElementById('jugex.area2')
      const domGenes = document.getElementById('jugex.genes')
      const domSubmit = document.getElementById('jugex.submit')
      const URL = 'http://134.94.8.220:5000/_jugex'
      // const headers = new Headers({
      //       'Content-Type' : 'multipart/form-data'
      // })
      

      const pendingRequestPanel = ()=>{
            const panel = document.createElement('div')
            panel.className = "panel panel-warning"

            const panelHeader = document.createElement('div')
            panelHeader.className = "btn btn-block panel-heading"

            const panelBody = document.createElement('div')
            panelBody.className = "panel-body"
            panelBody.style.maxHeight = '400px'
            panelBody.style.overflowY = 'scroll'
            panel.appendChild(panelHeader)
            panel.appendChild(panelBody)

            panelHeader.addEventListener('click',(ev)=>{
                  if(/panel\-success/gi.test(panel.className)){
                        if(/hidden/gi.test(panelBody.className)){
                              panelBody.className = panelBody.className.replace(/hidden/gi,'')
                        }else{
                              panelBody.className += ' hidden' 
                        }
                  }
            })

            return ({
                  panel : panel,
                  panelHeader : panelHeader,
                  panelBody : panelBody
            })
      }

      domSubmit.addEventListener('click',(ev)=>{

            // const form = new FormData()
            // form.append('area1',domArea1.getAttribute('value'))
            // form.append('area2',domArea2.getAttribute('value'))
            // form.append('genes',domGenes.getAttribute('value'))
      
            const request = new Request(URL,{
                  method : 'GET',
                  // headers : headers,
                  // body : form
            })

            const panelObj = pendingRequestPanel()
            panelObj.panelHeader.innerHTML = 'Pending request'
            panelObj.panelBody.className += ' hidden'

            document.getElementById('jugex.result').appendChild(panelObj.panel)

            fetch(request)
                  .then(resp=>resp.json())
                  .then(json=>{

                        const table = document.createElement('table')
                        table.className = "table table-bordered"
                        const thead = document.createElement('thead')
                        const col1 = document.createElement('th')
                        col1.innerHTML = 'gene'
                        const col2 = document.createElement('th')
                        col2.innerHTML = 'pval'
            
                        thead.appendChild(col1)
                        thead.appendChild(col2)
                        table.appendChild(thead)

                        const result = JSON.parse(json.result)
                        result.genes.forEach(gene=>{
                              const tr = document.createElement('tr')
                              const c1 = document.createElement('td')
                              c1.innerHTML = gene.name
                              const c2 = document.createElement('td')
                              c2.innerHTML = gene.pval

                              tr.appendChild(c1)
                              tr.appendChild(c2)
                              table.appendChild(tr)
                        })

                        panelObj.panelBody.appendChild(table)
                        
                        panelObj.panel.className = panelObj.panel.className.replace(/panel\-warning/gi,'')
                        panelObj.panel.className += ' panel-success'
                        panelObj.panelHeader.innerHTML = 'Request Completed.'

                        window['JuGeX'].next({
                              target : 'lab',
                              id : Date.now().toString(),
                              code : 100,
                              body : {
                                    blink : true,
                                    popoverMessage : 'Request completed! '
                              }
                        })
                  })
                  .catch(e=>{
                        console.log('error',e)
                        panelObj.panel.className = panelObj.panel.className.replace(/panel\-warning/gi,'')
                        panelObj.panel.className += ' panel-danger'
                        panelObj.panelHeader.innerHTML = 'Error. Check console.'
                  })

      })
      
      try{
            window.nehubaViewer.mouseOver.segment
                  .filter(ev=>ev.layer.name=='atlas')
                  .subscribe(ev=>{
                        if ( document.activeElement === domArea1 ){
                              domArea1.setAttribute('value',ev.segment?ev.segment:'')
                        } else if ( document.activeElement === domArea2 ){
                              domArea2.setAttribute('value',ev.segment?ev.segment:'')
                        }
            })
      }catch(e){
            console.log('error!',e)
      }
      
      try{
            window.mouseEvent
                  .filter(ev=>ev.mode=='click')
                  .subscribe(ev=>{
                        console.log('clicked')
                        if( domArea1.getAttribute('value') == '' ){
                              domArea1.focus()
                        }else if( domArea2.getAttribute('value') == '' ){
                              domArea2.focus()
                        }
                  })
      }catch(e){
            console.log('error!!!!',e)
      }
      domArea1.focus()
})()