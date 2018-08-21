(() => {
  let ref
  const appendNewScript = url => new Promise((resolve,reject) => {
    const el = document.createElement('script')
    el.setAttribute('src', url)
    el.onload = resolve
    el.onerror = reject
    document.head.appendChild(el)
  })
  appendNewScript('https://www.gstatic.com/firebasejs/5.4.0/firebase-app.js')
    .then(() => appendNewScript('https://www.gstatic.com/firebasejs/5.4.0/firebase-database.js'))
    .then(() => {
      const config = {
        apiKey: "AIzaSyBq4fJdgbys419up-pHaXecXv5PWNCeWKc",
        authDomain: "websocket-40105.firebaseapp.com",
        databaseURL: "https://websocket-40105.firebaseio.com",
        projectId: "websocket-40105",
        storageBucket: "websocket-40105.appspot.com",
        messagingSenderId: "643659482319"
      }
      firebase.initializeApp(config)

      const database = firebase.database()
      ref = database.ref('perspectiveState')
    })
    .catch(e => console.warn('promise all error', e))

  try{
    nehubaViewer.navigationState.perspectiveOrientation
      .throttleTime(16)
      .subscribe(quat => {
        if(ref){
          ref.set(Array.from(quat))
        }
      })
  }catch(e){

  }

  // let num = 1
  // const animate = () => {
  //   viewer.perspectiveNavigationState.pose.orientation.restoreState([0,0,0,num])
  //   requestAnimationFrame(animate)
  // }
  // requestAnimationFrame(animate)
  
})()