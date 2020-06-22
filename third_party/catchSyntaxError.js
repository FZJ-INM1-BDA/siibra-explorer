(function(){
  window.onerror = function(e) {
    if (/^SyntaxError/.test(e) || /^Syntax\serror/.test(e)) {
      console.log('Caught SyntaxError')

      const warning = 'Your browser cannot display the interactive viewer. Please use either Chrome >= 56 and/or Firefox >= 51'
      console.log(warning)
      
      const warningEl = document.createElement('h4')
      warningEl.innerHTML = warning
      const el = document.getElementById('iav-inner')
      while(el.childNodes.length > 0){
        el.removeChild(el.childNodes[0])
      }
      el.appendChild(warningEl)
    }
  }
})()
