const vtkHeader = `# vtk DataFile Version 2.0
Created by worker thread at https://github.com/HumanBrainProject/interactive-viewer
ASCII
DATASET POLYDATA`

globalThis.constants = {
  vtkHeader,
}

const { plotly } = require('./worker-plotly')

const input = {
  traces: [{
    "type":"scatter3d",
    "mode":"markers",
    "name":"points",
    "x":[-0.9557710289955139,null,-0.9557710289955139,-0.972806990146637,null],
    "y":[4.165919780731201,null,4.165919780731201,4.160162925720215,null],
    "z":[1.925400972366333,null,1.925400972366333,1.9260079860687256,null],"opacity":1,
    "marker":{"size":1,"color":["#00dd00",null,"#ff0000","#ff0000",null],
    "reversescale":false}
  }]  
}
const expectedOutput = {
  customFragmentColor: "if (label > -0.01 && label < 0.01) { emitRGB(vec3(1, 0, 0)); } else {emitRGB(vec3(1.0, 0.1, 0.12));}",
  vtkString: "# vtk DataFile Version 2.0\nCreated by worker thread at https://github.com/HumanBrainProject/interactive-viewer\nASCII\nDATASET POLYDATA\nPOINTS 8 float\n-954011.5298146864 4161239.595879443 1930395.281492923\n -957211.0971719137 4170707.908889603 1930395.281492923\n -954330.9608191141 4161131.6525727995 1920406.663239743\n -957530.5281763414 4170599.9655829594 1920406.663239743\n -971047.4909658094 4155482.7408684567 1931002.2951953155\n -974247.0583230368 4164951.0538786165 1931002.2951953155\n -971366.9219702372 4155374.797561813 1921013.6769421357\n -974566.4893274645 4164843.110571973 1921013.6769421357\n POLYGONS 12 48\n3 0 1 3\n3 0 2 3\n3 4 5 7\n3 4 6 7\n3 2 6 7\n3 2 3 7\n3 3 1 7\n3 1 5 7\n3 2 0 6\n3 0 4 6\n3 1 0 4\n3 1 4 5\nPOINT_DATA 8\nSCALARS label unsigned_char 1\nLOOKUP_TABLE none\n0\n0\n0\n0\n0\n0\n0\n0"
}

describe('> worker-plotly.js', () => {
  it('> expect input === output', () => {

    expect(
      plotly.convert(input)
    ).toEqual(expectedOutput)
  })
})
