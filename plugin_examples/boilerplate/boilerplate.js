(()=>{
      const attachViewerSubscription = ()=>{
            /* attach subscription to nehubaViewer or references to viewer here */
      }

      const unattachViewerSubscription = ()=>{
            /* unsubscribe to nehubaViewer and free reference to viewer here */
      }

      const viewControl = window.nehubaUI.viewControl
            .filter(evPk=>evPk.target=='loadTemplate')
            .subscribe(evPk=>{
                  if(evPk.code==100) unattachViewerSubscription()
                  if(evPk.code==200) attachViewerSubscription()
            })
      const shutdownHandler = window.pluginControl
            .filter(evPk=>evPk.target=='AFFILIATION.AUTHOR.PACKAGENAME'&&evPk.body.shutdown)
            .subscribe(evPk=>{
                  /* shutdown sequence */
                  viewControl.unsubscribe()
                  shutdownHandler.unsubscribe()
            })

      try{
            attachViewerSubscription()
      }catch(e){
            console.log('viewer has not yet instantiated. This is normal.',e)
      }
})()