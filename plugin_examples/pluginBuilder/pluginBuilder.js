(()=>{
    const panelWs = document.getElementById('fzj.xg.pluginBuilder.panelWs')
    const connectWs = document.getElementById('fzj.xg.pluginBuilder.connectWs')
    const inputWsUrl = document.getElementById('fzj.xg.pluginBuilder.WsUrl')

    const templateHtml = document.getElementById('fzj.xg.pluginBuilder.panelHtml')

    let ws
    connectWs.addEventListener('click',()=>{
        console.log('Connecting to WS ...')
        ws = new WebSocket('ws://'+inputWsUrl.value)
        ws.onerror = (e)=>{
            addWarning('WS connection failed ...  Check console for more details.')
            console.log(e)
        }
        ws.onclose = (ev)=>{
            addWarning('WS connection closed ... Check console for more details.')
            console.log(ev)
        }
        ws.onopen = (ev) =>{
            console.log('WS connection successful.')
            /* hide the connection panels */
            panelWs.className += ' hidden'

            /* handle messages */
            ws.onmessage = handleWsMsg
        }
    })

    const handleWsMsg = (msg)=>{
        try{
            const json = JSON.parse(msg.data)
            if(json.event == 'on connection'){
                handleOnConnection = handleOnConnection(json)
                return
            }
            switch(json.filename){
                case 'template.html':{
                    templateData = json.data
                }break;
                case 'script.js':{
                    scriptData = json.data
                }break;
                default:
                    throw 'Unknown filename ... This plugin currently only parses template.html and script.js.' 
            }
            handleChange()
        }catch(e){
            addWarning('WS message parsing failed ... Check console for more details.')
            console.log('WS message: ',msg)
            console.log(e)
        }
    }

    let handleOnConnection = (obj1) => (obj2) =>{
        const arr = [obj1,obj2]
        try{
            templateData = arr.find(obj=>obj.filename=='template.html').data
            scriptData = arr.find(obj=>obj.filename=='script.js').data
            handleChange() 
        }catch(e){
            console.log('either template.html or script.js not found',e)
        }
    }

    let templateData
    let scriptData

    const handleChange = ()=>{
        templateHtml.innerHTML = templateData
        try{
            eval(scriptData)
            scriptData = scriptData
        }catch(e){
            addWarning('Imported js parsing error ... Check console for more details.')
            console.log('Error parsing js file ... ',e,'Js File: ',scriptData)
        }   
    }

    /* add warning */
    const addWarning = (text)=>{

    }

    /* clear the existing warnings */
    const clearWarning = ()=>{

    }

    const shutdownHandler = window.pluginControl
          .filter(evPk=>evPk.target=='fzj.xg.pluginBuilder'&&evPk.body.shutdown)
          .subscribe(evPk=>{
                /* shutdown sequence */
                if(ws)ws.close()
                shutdownHandler.unsubscribe()
          })
})()