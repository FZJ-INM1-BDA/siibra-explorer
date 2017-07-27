export const changeTemplateHooks = function(flag:boolean){
      if ( flag ){
            /* black background */
            let collection = document.getElementsByClassName('gllayoutcell') 
            for (let i = 0; i<collection.length; i++){
                  collection[i].className = 'gllayoutcell darktheme'
            }
            let scalebar = document.getElementsByClassName('scale-bar-container') 
            for (let i = 0; i<scalebar.length; i++){
                  scalebar[i].className = 'scale-bar-container darktheme'
            }
      } else {
            /* white background */
            let collection = document.getElementsByClassName('gllayoutcell') 
            for (let i = 0; i<collection.length; i++){
                  collection[i].className = 'gllayoutcell'
            }
            let scalebar = document.getElementsByClassName('scale-bar-container') 
            for (let i = 0; i<scalebar.length; i++){
                  scalebar[i].className = 'scale-bar-container'
            }
      }
}