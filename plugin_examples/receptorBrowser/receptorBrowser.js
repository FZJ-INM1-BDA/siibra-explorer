/*
autoradiographs
    Glutamine
        AMPA
        KAINATE
        NMDA
        mGluR2(?)
    GABA
    Acetycholine
    noradrenaline
    serotonin
    dopamine
profiles
fingerprint
*/
(()=>{

    const subMenuBuilder = (audioOrProfile)=>{
        
        const prefix = audioOrProfile == 'audioradiographs' ? 'bm' : 'pr'
        return ({
            glutamine : {
                AMPA : `${prefix}_AMPA.jpg`,
                Kainate : `${prefix}_Kainate.jpg`,
                NMDA : `${prefix}_NMDA.jpg`,
                mGluR2 : `${prefix}_mGluR2_3.jpg`
            },
        })
    }

    const menuPath = {
        audioratiographs : subMenuBuilder('autoradiographs'),
        profiles : subMenuBuilder('profiles'),
        fingerprint : '_fingerprint.jpg'
    }

    const dictionary = {
        PFm : {
            name : 'PFm',
            path : "http://172.104.156.15/img/PFm"
        }
    }

    let nehubaViewerMouseOver,searchingForNewRegion = false,selectedRegion,selectedMode,selectedNT

    const domStatusWell = document.getElementById('fzj.xg.receptorBrowser.statusWell')
    const domBtnDetectNT = document.getElementById('fzj.xg.receptorBrowser.detectNeuroTransmitterBtn')
    const domNavigation = document.getElementById('fzj.xg.receptorBrowser.navigation')

    const domMenu = document.getElementById('fzj.xg.receptorBrowser.menu')
    const menuStack = [menuPath]

    const updateNavigation = ()=>{
        domNavigation.innerHTML = menuStack.reduce((acc,curr,currIdx,array)=>{
            return currIdx == 0 ? selectedRegion : acc + ' > ' + Object.keys(array[currIdx-1]).find(key=>array[currIdx-1][key]==curr)
        },selectedRegion?selectedRegion:'No region selected!')
    }

    domBtnDetectNT.addEventListener('click',()=>{
        domStatusWell.value = ''
        searchingForNewRegion = /btn\-default/.test(domBtnDetectNT.className)
        domBtnDetectNT.className = domBtnDetectNT.className.replace(/btn\-default|btn\-primary/,searchingForNewRegion?'btn-primary':'btn-default')
        menuStack.splice(1,menuStack.length-1)
        selectedRegion = null
        updateNavigation()
        showMenuDom(false)
    })

    const showNewView = (input)=>{

        /* remove everything in the menu dom first */
        while(domMenu.firstChild){
            domMenu.removeChild(domMenu.firstChild)
        }

        updateNavigation()

        /* expecting a json object and returning an HTML element */
        const returnDom = document.createElement('div')

        if(menuStack.length>1){
            const backBtn = document.createElement('div')
            backBtn.className = 'btn btn-block btn-default'
            backBtn.addEventListener('click',()=>{
                menuStack.splice(menuStack.length-1)
                showNewView(menuStack[menuStack.length-1])
            })
            backBtn.innerHTML = '<i class = "glyphicon glyphicon-chevron-left"></i> Back'
            domMenu.appendChild(backBtn)
        }else{
            const backBtn = document.createElement('div')
            backBtn.className = 'btn btn-block btn-default disabled'
            backBtn.innerHTML = '<i class = "glyphicon glyphicon-chevron-left"></i> Back'
            domMenu.appendChild(backBtn)
        }

        if(input.constructor.name == 'String'){
            /* render image & return */
            const el = document.createElement('img')
            el.setAttribute('src',`${dictionary[selectedRegion].path}/${selectedRegion}_${input}`)
            el.setAttribute('width','100%')
            domMenu.appendChild(el)
        }

        if(input.constructor.name == 'Object'){
            /* render a submenu and return */
            const btnGroup = document.createElement('div')
            btnGroup.className = 'btn-group-vertical btn-block'
            Object.keys(input).forEach(key=>{
                const el = document.createElement('div')
                el.className = 'btn btn-block btn-default'
                el.addEventListener('click',()=>{
                    menuStack.push(input[key])
                    showNewView(input[key])
                })
                el.innerHTML = key
                btnGroup.appendChild(el)
            })
            domMenu.appendChild(btnGroup)
        }
    }

    const findRegion = (segId)=>{
        return new Promise((resolve,reject)=>{
            const searchThroughChildren = (regions) =>{
                const matchedRegion = regions.find(region=>region.labelIndex && region.labelIndex==segId)
                if(matchedRegion) {
                    resolve(matchedRegion)
                }else{
                    regions.forEach(region=>{
                        searchThroughChildren(region.children)
                    })
                }
            }
            searchThroughChildren(window.nehubaUI.metadata.selectedParcellation.regions)
            reject('did not find anything')
        })
    }

    const matchRegionNameToDictionary = (name)=>{
        const dictKey = Object.keys(dictionary).find(key=>(new RegExp(key,'gi')).test(name))
        selectedRegion = dictKey ? dictKey : null
        return dictKey ? true : false
    }
    
    const uiMouseEvent = window.nehubaUI.mouseEvent
        .filter(evPk=>evPk.target=='click')
        .subscribe(()=>{
            searchingForNewRegion = false
            domBtnDetectNT.className = domBtnDetectNT.className.replace(/btn\-default|btn\-primary/,'btn-default')
        })

    const showMenuDom = (bool)=>{
        domMenu.className = domMenu.className.replace(/\s?hidden/,'')
        if(!bool)domMenu.className += ' hidden'
    }

    const attachViewerSubscription = ()=>{
        /* attach subscription to nehubaViewer or references to viewer here */
        nehubaViewerMouseOver = window['nehubaViewer'].mouseOver.segment
            .subscribe(ev=>{
                if(searchingForNewRegion){
                    selectedRegion = null
                    if(!ev.segment||ev.segment==0){
                        domStatusWell.value = ''
                        showMenuDom(false)
                    }else{
                        findRegion(ev.segment)
                            .then(region=>{
                                domStatusWell.value = `${region.name} ${matchRegionNameToDictionary(region.name) ? 'Neurotransmitter data found!' : '' }`
                                if (matchRegionNameToDictionary(region.name) != ''){
                                    showMenuDom(true)
                                    showNewView(menuPath)
                                }else{
                                    showMenuDom(false)
                                }
                            })
                            .catch(e=>{
                                domStatusWell.value = ''
                                showMenuDom(false)
                            })
                    }
                    updateNavigation()
                }
            })
    }

    const unattachViewerSubscription = ()=>{
        console.log('shutting down receptorBrowser')
        /* unsubscribe to nehubaViewer and free reference to viewer here */
        nehubaViewerMouseOver.unsubscribe()
    }

    // const viewControl = window.nehubaUI.viewControl
    //     .filter(evPk=>evPk.target=='loadTemplate')
    //     .subscribe(evPk=>{
    //         if(evPk.code==100) unattachViewerSubscription()
    //         if(evPk.code==200) attachViewerSubscription()
    //     })
    const shutdownHandler = window.pluginControl['fzj.xg.ex_info'].onShutdown(()=>{

        /* shutdown sequence */
        viewControl.unsubscribe()
        shutdownHandler.unsubscribe()
        uiMouseEvent.unsubscribe()
    })

    try{
        attachViewerSubscription()
    }catch(e){
        console.log('viewer has not yet instantiated. This is normal.',e)
    }
})()