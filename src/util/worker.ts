const validTypes = ['CHECK_MESHES']
const validOutType = ['CHECKED_MESH']

const checkMeshes = (action) => {
  
  /* filtering now done on the angular level */
  const baseUrl = action.baseUrl
  fetch(`${baseUrl}/info`)
    .then(res => res.json())
    .then(json => json.mesh
      ? json.mesh
      : new Error(`mesh does not exist on fetched info file: ${JSON.stringify(json)}`))
    .then(meshPath => action.indices.forEach(index => {
      fetch(`${baseUrl}/${meshPath}/${index}:0`)
        .then(() => {
          postMessage({
            type: 'CHECKED_MESH',
            parcellationId: action.parcellationId,
            checkedIndex: index,
            baseUrl
          })
        })
        .catch(error => {
          /* no cors error is also caught here, but also printed to the console */
        })
    }))
    .catch(error => {
      console.error('parsing info json error', error)
    })
}

onmessage = (message) => {
  
  if(validTypes.findIndex(type => type === message.data.type)>=0){
    switch(message.data.type){
      case 'CHECK_MESHES':
        checkMeshes(message.data)
        return;
      default:
        console.warn('unhandled worker action')
    }
  }
}
