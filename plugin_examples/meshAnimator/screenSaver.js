(()=>{
    const attachViewerSubscription = ()=>{
          /* attach subscription to nehubaViewer or references to viewer here */
          templateLoaded = true
    }

    const unattachViewerSubscription = ()=>{
          /* unsubscribe to nehubaViewer and free reference to viewer here */
          templateLoaded = false
    }

    let lastActive = Date.now()
    let permaOn = false
    let speed = 0.1
    let timer = 5
    let templateLoaded = false

    let requestedAnimationFrame

    const animationFrame = ()=>{
        if( permaOn || (Date.now() - lastActive) > (1000*60*timer) ){
            /* animation here */
            if(templateLoaded)window.viewer.perspectiveNavigationState.pose.rotateRelative([0,1,0,1],Math.PI/60*speed)
        }
        
        requestedAnimationFrame = requestAnimationFrame(animationFrame)
    }
    requestedAnimationFrame = requestAnimationFrame(animationFrame)

    const domTimerSlider = document.getElementById('fzj.xg.screenSaver.timer')
    const domTimerOutput = document.getElementById('fzj.xg.screenSaver.timer.output')
    const domSpeedSlider = document.getElementById('fzj.xg.screenSaver.speed')
    const domSpeedOutput = document.getElementById('fzj.xg.screenSaver.speed.output')
    const domAlwaysRotate = document.getElementById('fzj.xg.screenSaver.alwaysRotate')

    domTimerSlider.addEventListener('input',(ev)=>{
        timer = domTimerSlider.value
        domTimerOutput.innerHTML = timer
    })

    domSpeedSlider.addEventListener('input',(ev)=>{
        speed = domSpeedSlider.value
        domSpeedOutput.innerHTML = speed
    })

    domAlwaysRotate.addEventListener('click',()=>{
        permaOn = !permaOn
        domAlwaysRotate.className = domAlwaysRotate.className.replace(/btn\-default|btn\-primary/gi,permaOn?'btn-primary':'btn-default')
        domTimerSlider.disabled = permaOn
    })

    const keyboardListener = ()=>{
        lastActive = Date.now()
    }
    document.addEventListener('keydown',keyboardListener)

    const uiMouseEvent = window.nehubaUI.mouseEvent
        .subscribe(evPk=>{
            lastActive = Date.now()
        })

    const viewControl = window.nehubaUI.viewControl
          .filter(evPk=>evPk.target=='loadTemplate')
          .subscribe(evPk=>{
                if(evPk.code==100) unattachViewerSubscription()
                if(evPk.code==200) attachViewerSubscription()
          })
    const shutdownHandler = window.pluginControl
          .filter(evPk=>evPk.target=='fzj.xg.screenSaver'&&evPk.body.shutdown)
          .subscribe(evPk=>{
                /* shutdown sequence */
                viewControl.unsubscribe()
                shutdownHandler.unsubscribe()

                uiMouseEvent.unsubscribe()
                cancelAnimationFrame( requestedAnimationFrame )
                document.removeEventListener('keydown',keyboardListener)
          })

    try{
          attachViewerSubscription()
    }catch(e){
          console.log('viewer has not yet instantiated. This is normal.',e)
    }
})()