
/**
* Catching Safari 10 bug:
* 
* https://bugs.webkit.org/show_bug.cgi?id=171041
* 
*/

(function(){
  try{
    eval('(()=>{\
            let e = e => {\
              console.log(e);\
              for(let e of [1,2,3]){\
                console.log(e);\
              }\
            }\
        })()')
  } catch (e) {
    console.log(e)
    const warning = 'Your browser cannot display the interactive viewer. Please use either Chrome >= 56 and/or Firefox >= 51'
    console.log(warning)
    const warningEl = document.createElement('h4')
    warningEl.innerHTML = warning
    const el = document.getElementsByTagName('atlas-viewer')
    if(el.length > 0){
      document.body.removeChild(el[0])
    }
    document.body.appendChild(warningEl)
  }
})()