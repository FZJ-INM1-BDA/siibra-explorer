(() => {

  const backendRoot = `http://medpc055.ime.kfa-juelich.de:8005`
  const srcRoot = 'http://localhost:10080/newWebJugex'

  /* so that on shutdown, we could unload these libraries */
  const onshutdownCB = []
  const loadedExternalLibraries = []
  const subscriptions = []

  const loadExternalJsLibrary = (url) => new Promise((resolve,reject) => {
    const el = document.createElement('script')
    el.setAttribute('src',url)
    el.onload = () => {
      loadedExternalLibraries.push(el)
      resolve()
    }
    el.onerror = () => reject()
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

      const controller = new Vue({
        el: '#fzj\\.xg\\.newWebJugex\\.container',
        props: {
          regionNameToPMapURLMap: {
            type: Map,
            default: () => new Map()
          }
        },
        data: {
          allgenes: [],
          chosengenes: [],
          roi1: '',
          roi2: '',
          regions: [],
          singleProbeMode:true,
          simpleMode:true,
          ignoreCustomProbe:false,
          lefthemisphere:true,
          righthemisphere:true,
          nPermutations:1000
        },
        methods: {
          removeGene: function (gene) {
            this.chosengenes = this.chosengenes.filter(g => g !== gene)
          },
          startAnalysis: function () {
            const body = {
              area1: {
                name: this.roi1,
                PMapURL: this.regionNameToPMapURLMap.get(this.roi1)
              },
              mode: false,
              area2: {
                name: this.roi2,
                PMapURL: this.regionNameToPMapURLMap.get(this.roi2)
              },
              hemisphere: 'left',
              selectedGenes: this.chosengenes,
              threshold: '0.2'
            }

            this.$emit('start-analysis', Object.assign({}, body))
          }
        },
        computed: {
          placeholderTextRoi1: function () {
            return this.roi1 === '' ? 'Start typing to search ...': this.roi1
          },
          placeholderTextRoi2: function () {
            return this.roi2 === '' ? 'Start typing to search ...': this.roi2
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
          dateString: function () {
            return `${this.datenow.getFullYear().toString()}${normaliseToTwoDigit(this.datenow.getMonth() + 1)}${normaliseToTwoDigit(this.datenow.getDate())}_${normaliseToTwoDigit(this.datenow.getHours())}${normaliseToTwoDigit(this.datenow.getMinutes())}`
          }
        },
        mounted: function () {
          fetch(`${backendRoot}/jugex`,{
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.querydata)
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
        result.addAnalysis(data)
      })
    })
})()