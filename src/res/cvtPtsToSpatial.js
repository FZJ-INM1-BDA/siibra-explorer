const fs = require('fs')

const filenames = [
  'LYONNEURO_2014_BATg_MNI.pts',
  'LYONNEURO_2014_DESj_MNI.pts'
]

const descContactPts = 'This spatial point represent a contact point in an electrode. Brain activity was recorded while the subject conduct several tasks.'
const descVISU_f50f150 = 'This is a description of subject performing task VISU, with frequency range f50f150'
const descVISU_f8f24 = 'This is a description of subject performing task VISU, with frequency range f8f24'
const descLEC1_f50f150 = 'This is a description of subject performing task LEC1, with frequency range f50f150'
const descLEC1_f8f24 = 'This is a description of subject performing task LEC1, with frequency range f8f24'

filenames.map(filename => {
  fs.readFile(`./raw/${filename}`, 'utf-8', (err, data) => {
    if(err) throw err
    const filteredLines = data.split('\n').filter(line => /^[a-zA-Z]p?[0-9]/.test(line))

    const newLines = filteredLines.map(line => {
      const [name, x, y, z, ...rest] = line.split('\t')
      return {
        type : 'iEEG Recording Site',
        name : filename.replace('_MNI.pts', '').concat(`_${name.replace(/^.p/g,(s) => s.slice(0,1).concat('\''))}`),
        templateSpace : 'MNI 152 ICBM 2009c Nonlinear Asymmetric',
        geometry : {
          type : 'point',
          space : 'real',
          position : [
            Number(x),
            Number(y),
            Number(z)
          ],
        },
        properties : {
          description : descContactPts,
          publications : []
        },
        files : [{
          filename : 'VISU/VISU_f50f150',
          name : 'VISU_f50f150',
          mimetype : 'application/hibop',
          url : 'http://about:blank',
          properties : {
            description: descVISU_f50f150,
            publications : []
          }
        },{
          filename : 'VISU/VISU_f8f24',
          name : 'VISU f8f24',
          mimetype : 'application/hibop',
          url : 'http://about:blank',
          properties : {
            description: descVISU_f8f24,
            publications : []
          }
        },{
          filename : 'LEC1/LEC1_f50f150',
          name : 'LEC1_f50f150',
          mimetype : 'application/hibop',
          url : 'http://about:blank',
          properties : {
            description: descLEC1_f50f150,
            publications : []
          }
        },{
          filename : 'LEC1/LEC1_f8f24',
          name : 'LEC1_f8f24',
          mimetype : 'application/hibop',
          url : 'http://about:blank',
          properties : {
            description: descLEC1_f8f24,
            publications : []
          }
        }]
      }
    })
    
    fs.writeFile(`./raw/${filename.replace('_MNI.pts', '.json')}`, JSON.stringify(newLines), 'utf-8', (err) => {
      if(err) throw err
    })
  })
})