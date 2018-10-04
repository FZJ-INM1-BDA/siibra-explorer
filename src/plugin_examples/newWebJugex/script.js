(() => {

  // example of adding toasts and custom landmarks

  // const handler = interactiveViewer.uiHandle.getToastHandler()
  // handler.message = 'hohoho'
  // handler.dismissable = true
  // handler.timeout = 0
  // handler.show()

  // const handler2 = interactiveViewer.uiHandle.getToastHandler()
  // handler2.message = `hohoho2<a href = "alert('oh no')">test</a>`
  // handler2.dismissable = true
  // handler2.timeout = 0
  // setTimeout(()=>{
  //   handler2.show()
  // },5000)

  // interactiveViewer.viewerHandle.add3DLandmarks([{
  //   id : 'jugex-test1',
  //   position : [0,0,0]
  // }])

  const backendRoot = null
  const srcRoot = 'res/plugin_examples/newWebJugex'
  const manifestID = 'fzj.xg.webjugex'

  /* so that on shutdown, we could unload these libraries */
  const onshutdownCB = []
  const loadedExternalLibraries = []
  const subscriptions = []

  const newset = new Set()
  newset.add('test')
  newset.has('test')

  let datasetsLoaded, mouseoverReggion

  const handleMouseOvernehubaEvent = (event) => {
    if(event === null){
      return
    }
    /* if either first region or second region is empty fill them */
  }

  const handleMouseClickEvent = (event) => {

  }

  interactiveViewer.metadata.datasetsBSubject.subscribe(datasets => datasetsLoaded = datasets)

  onshutdownCB.push(() => subscriptions.forEach(s => s.unsubscribe()))

  const loadExternalJsLibrary = (url) => new Promise((resolve,reject) => {
    const el = document.createElement('script')
    el.setAttribute('src',url)
    el.onload = () => {
      loadedExternalLibraries.push(el)
      resolve()
    }
    el.onerror = (e) => reject(e)
    document.head.appendChild(el)
  })

  const parseCoordToFile = (json) => {
    return Object.keys(json).reduce((acc, curr) => {
      const newRows = json[curr].map(item => {
        return `${curr},${item.xyz.join(',')},${item.winsorzed_mean.join(',')}`
      })
      return acc.concat(newRows)
    }, []).join('\n')
  }

  const parsePvalToFile = (json) => {
    return Object.keys(json).map(key => `${key},${json[key]}`).join('\n')
  }

  const jugexResponseParser = (json) => {
    const pval = json[1]
    const coord = json[0]
    const stringCoordFile = parseCoordToFile(coord)
    const stringPvalFile = parsePvalToFile(pval)
    const stringTitledCoordFile = Object.keys(pval).join(',').concat('\n').concat(stringCoordFile)
    return {
      pval : stringPvalFile,
      coord : stringTitledCoordFile
    }
  }

  interactiveViewer.pluginControl.loadExternalLibraries(['vue@2.5.16'])
    .then(() => loadExternalJsLibrary(`${srcRoot}/manifest.js`))
    .then(() => loadExternalJsLibrary(`${srcRoot}/vendor.js`))
    .then(() => loadExternalJsLibrary(`${srcRoot}/app.js`))
    .then(() => {
      window.interactiveViewer.pluginControl[manifestID].setInitManifestUrl('http://localhost:10080/newWebJugex/manifest.json')

      const controller = new Vue({
        el: '#fzj\\.xg\\.newWebJugex\\.container',
        props: {
          regionNameToPMapURLMap: {
            type: Map,
            default: () => new Map()
          }
        },
        data: {
          allgenes: ["ADRA2A", "AVPR1B", "CHRM2", "CNR1", "CREB1", "CRH", "CRHR1", "CRHR2", "GAD2", "HTR1A", "HTR1B", "HTR1D", "HTR2A", "HTR3A", "HTR5A", "MAOA", "PDE1A", "SLC6A2", "SLC6A4", "SST", "TAC1", "TPH1", "GPR50", "CUX2", "TPH2"],
          chosengenes: [],
          roi1: '',
          roi2: '',
          regions: [],
          singleProbeMode:true,
          simpleMode:true,
          ignoreCustomProbe:false,
          lefthemisphere:true,
          righthemisphere:true,
          nPermutations:1000,
          warning : []
        },
        methods: {
          animationendtmp: function(event){
            if(event.animationName === 'flash'){
              this.warning = []
            }
          },
          findNewInput: function(){
            if(this.roi1 === '')
              return this.$refs.roi1.$refs.input.focus()
            if(this.roi2 === '')
              return this.$refs.roi2.$refs.input.focus()
            return this.$refs.genelist.$refs.input.focus()
          },
          removeGene: function (gene) {
            this.chosengenes = this.chosengenes.filter(g => g !== gene)
          },
          exportGene: function () {
            this.$refs.exportGeneAnchor.setAttribute('download', `${Date.now()}.csv`)
            this.$refs.exportGeneAnchor.click()
          },
          getWarning: function(w) {
            switch(w){
              case 'roi1':
                return `ROI1 must be selected.`
              case 'roi2':
                return `ROI2 must be selected.`
              case 'chosengenes':
                return `At least 1 gene needs to be selected.`
              case 'hemisphere':
                return `If simple mode is off, at least 1 hemisphere needs to be selected.`
              default:
                return `Some other fields need to be filled.`
            }
          },
          validation: function () {
            this.warning = []
            if(this.roi1 !== '' && this.roi2 !== '' && this.chosengenes.length > 0 && (this.simpleMode || (this.lefthemisphere || this.righthemisphere))){
              return true
            }
            const warning = []
            if(this.roi1 === ''){
              warning.push('roi1')
            }
            if(this.roi2 === ''){
              warning.push('roi2')
            }
            if(this.chosengenes.length <= 0){
              warning.push('chosengenes')
            }
            if(!this.simpleMode && !(this.lefthemisphere || this.righthemisphere)){
              warning.push('hemisphere')
            }
            this.warning = warning
          },
          startAnalysis: function () {
            if(!this.validation()){
              return
            }
              
            const body = {
              area1: {
                name: this.roi1,
                PMapURL: this.regionNameToPMapURLMap.get(this.roi1)
              },
              area2: {
                name: this.roi2,
                PMapURL: this.regionNameToPMapURLMap.get(this.roi2)
              },

              simpleMode: this.simpleMode,
              singleProbeMode: this.singleProbeMode,
              ignoreCustomProbe: this.ignoreCustomProbe,

              lh: this.lefthemisphere,
              rh: this.righthemisphere,
              selectedGenes: [...this.chosengenes]
            }

            this.$emit('start-analysis', Object.assign({}, body))
          }
        },
        computed: {
          hemisphereWarning : function(){
            return this.warning.findIndex(v => v === 'hemisphere') >= 0
          },
          roi1Warning: function(){
            return this.warning.findIndex(v => v === 'roi1') >= 0
          },
          roi2Warning: function(){
            return this.warning.findIndex(v => v === 'roi2') >= 0
          },
          chosenGeneWarning: function(){
            return this.warning.findIndex(v => v === 'chosengenes') >= 0
          },
          placeholderTextRoi1: function () {
            return this.roi1 === '' ? 'Start typing to search ...': this.roi1
          },
          placeholderTextRoi2: function () {
            return this.roi2 === '' ? 'Start typing to search ...': this.roi2
          },
          chosenGeneCommaJoined: function(){
            return this.chosengenes.join(',')
          },
          getAllgenes: function () {
            return this.allgenes
          }
        },
        mounted: function () {
          fetch(backendRoot)
            .then(res => res.json())
            .then(array => this.allgenes = array)
            .catch(console.warn)
        }
      })

      interactiveViewer.metadata.datasetsBSubject.subscribe(array => 
        controller.regionNameToPMapURLMap = new Map(array
          .filter(item => item.type === 'Cytoarchitectonic Probabilistic Map'
            && typeof item.regionName !== 'undefined' 
            && item.regionName.constructor === Array 
            && item.regionName.length > 0
            && typeof item.files !== 'undefined'
            && item.files.constructor === Array
            && item.files.length > 0
            && typeof item.files[0].url !== 'undefined')
          .map(item => [item.regionName[0].regionName, item.files[0].url])))

      controller.regions = Array.from(interactiveViewer.metadata.regionsLabelIndexMap.values())
        .map(item=>item.name)

      const normaliseToTwoDigit = (input) => `${input.toString().length > 1 ? '' : '0'}${input.toString()}`

      Vue.component('fzj-xg-newwebjugex-analysis-card',{
        template: `
        <div class = "panel panel-default">
          <div 
            @click = "showbody = !showbody"
            class = "panel-header btn btn-default btn-block">
            <span 
              v-if = "status">
              Analysis complete. {{ dateString }}
            </span>
            <div
              v-if = "!status">
              <div class = "fzj.xg.newWebJugex.spinner">&bull;</div>
              <div>Analysing</div>
            </div>
            <span
              @click.stop = "$emit('remove-card')" 
              class = "pull-right close">
                &times;
            </span>
          </div>
          <div 
            v-if = "showbody"
            class = "panel-body">
            <div v-if = "error">
              {{ error }}
            </div>
            <div v-else-if = "pvaldata && coorddata">
            <a download = "pval.csv" :href = "'data:text/csv;charset=utf-8,' + pvaldata">download pvals</a><br />
            <a download = "coord.csv" :href = "'data:text/csv;charset=utf-8,' + coorddata">download coord data</a>
            </div>
            <div v-else>
              We are still working on on analysing your data ...
            </div>
          </div>
        </div>
        `,
        props: {
          querydata: {
            type: Object,
            default: () => ({})
          }
        },
        data: () => ({
          status: false,
          showbody: false,
          datenow : new Date(),
          error : null,
          pvaldata : null,
          coorddata : null
        }),
        computed: {
          filename: function(){
            return `pval_nPerm${this.querydata.nPermutations}_${this.querydata.singleProbeMode ? 'singleProbeMode' : 'allProbeMode'}`
          },
          dateString: function () {
            return `${this.datenow.getFullYear().toString()}${normaliseToTwoDigit(this.datenow.getMonth() + 1)}${normaliseToTwoDigit(this.datenow.getDate())}_${normaliseToTwoDigit(this.datenow.getHours())}${normaliseToTwoDigit(this.datenow.getMinutes())}`
          }
        },
        mounted: function () {
          console.log(this.querydata)
          const data = Object.assign({}, this.querydata, {threshold:0.2,mode:false})
          fetch(`${backendRoot}/jugex`,{
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
            .then(res=>res.json())
            .then(json => {
              this.status = true
              const rjson = jugexResponseParser(json)
              this.pvaldata = rjson.pval
              this.coorddata = rjson.coord
            })
            .catch(e => {
              this.status = true
              this.error = JSON.stringify(e)
            })
        }
      })

      const result = new Vue({
        el: '#fzj\\.xg\\.newWebJugex\\.result',
        data: {
          analyses: []
        },
        methods: {
          addAnalysis: function (json) {
            this.analyses.push(json)
          },
          removeAnalysis: function (index) {
            this.analyses.splice(index, 1)
          }
        }
      })

      controller.$on('start-analysis', (data) => {
        console.log({data})
        return
        result.addAnalysis(data)
      })
    })
    .catch(e => console.log('error',e))
})()