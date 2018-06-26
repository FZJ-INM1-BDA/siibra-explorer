(()=>{
  setTimeout(()=>{
    const el = document.getElementById('testplugin-id')
    const newel = document.createElement('div')
    newel.innerHTML = `hello new owrld`
    el.appendChild(newel)
    
  },100)
})()