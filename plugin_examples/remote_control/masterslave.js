(()=>{
      for (let radioBtn of document.getElementById('masterslave.role').children){
            radioBtn.addEventListener('click',(ev)=>{
                  clearBtn()
                  ev.target.className += ev.target.id === 'masterslave.role.master' ? ' btn-success' : ' btn-warning'
            })
      }
      const clearBtn = ()=>{
            for (let radioBtn of document.getElementById('masterslave.role').children){
                  radioBtn.className = radioBtn.className.replace(/btn\-success|btn\-warning/gi,'')
            }
      }

      const url = document.getElementById('masterslave.websocket')
      const log = document.getElementById('masterslave.log')

      const validate = () =>{
            return url.value === '' ? 
                  false : 
                        /btn\-success/gi.test(document.getElementById('masterslave.role.master').className) | 
                        /btn\-warning/gi.test(document.getElementById('masterslave.role.slave').className)
      }

      document.getElementById('masterslave.submit').addEventListener('click',()=>{
            if ( !validate()){
log.innerHTML += `both ws url and role are required
`
                  return
            }
            const role = /btn\-success/gi.test(document.getElementById('masterslave.role.master').className) ? 'master' : 'slave'
            const ws = new WebSocket(url.value)
            ws.onerror = (e)=>{
log.innerHTML += `error connecting to websocket
`
console.log(e)
            }
            ws.onclose = (ev)=>{
                  console.log(ev)
                  console.log('ws closed')
            }
            ws.onopen = (ev)=>{
log.innerHTML += `connected to websocket as ${/btn\-success/gi.test(document.getElementById('masterslave.role.master').className) ? 'Master' : 'Slave'}
`
                  if (role == 'master'){
                        console.log('handling master event ... ')
                        try{
                              const nehubaViewer = window['nehubaViewer'].navigationState.position.inRealSpace.subscribe(ev=>{
                                    ws.send(JSON.stringify(ev))
                              }) 
                              console.log('... successful')
                        }catch(e){
                              console.log(e)
                        }
                  }else{
                        console.log('handling slave event ...')
                        try{
                              ws.onmessage = (msg) =>{
                                    const pos = JSON.parse(msg.data)
                                    window['nehubaViewer'].setPosition([pos[0],pos[1],pos[2]],true)
                              }
                              console.log('... successful.')
                        }catch(e){
                              console.log(e)
                        }
                  }
            }
      })
})()