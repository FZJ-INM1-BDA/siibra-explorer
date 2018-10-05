const fs = require('fs')

const dictArr = [
  {
    "value": "Probabilistic cytoarchitectonic map of AStr (Amygdala)",
    "uuid": "7772a4e8-1c35-445a-b7f4-4829a6202ed0",
    "reference": "Dataset/cbfa0a7ecfab0b8c1b3cf39f19f4643e"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 1 (PostCG)",
    "uuid": "7951a65c-34f3-435b-93a6-9383e739a8e3",
    "reference": "Dataset/e278ef40929805586737c78aeb8c4ec6"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 2 (PostCS)",
    "uuid": "30785c4a-fbc8-4c17-8afb-aa4e263c5904",
    "reference": "Dataset/9349857d0b9d7f89d5948b0c10c42bcb"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 25 (sACC)",
    "uuid": "e2a86898-c739-4fd6-a962-ca09b954d066",
    "reference": "Dataset/4cff63f6a270b19f7f541e100e48913c"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 33 (ACC)",
    "uuid": "ad3a655a-99b7-4e91-95bd-32ee1c6254fb",
    "reference": "Dataset/c6aea16fb9af3f9a275ee7fb753573de"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 3a (PostCG)",
    "uuid": "8f0b31d0-e7c5-4006-8f28-305ded7373de",
    "reference": "Dataset/3473511a2ea226a636273e76186bac3b"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 3b (PostCG)",
    "uuid": "c4aaccc0-4eda-4022-a06c-50fc3afccbfd",
    "reference": "Dataset/db08224bd75c21ece58b145871b5be40"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 44 (IFG)",
    "uuid": "35591609-651c-4d08-a4b5-92dbfe00e89f",
    "reference": "Dataset/d0abf7131bc3460ac188632f40bf0748"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 45 (IFG)",
    "uuid": "b240bd6e-9298-47d4-88b3-288024a4766b",
    "reference": "Dataset/00748b8d790c0509d78f0c8679017935"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 4a (PreCG)",
    "uuid": "8f69e5e2-b84e-4884-9bd9-efa787762f0e",
    "reference": "Dataset/9c861298d842b61f14f0891e4f556cb6"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 4p (PreCG)",
    "uuid": "5b7756dc-e2ac-4849-b64c-acd1e4405508",
    "reference": "Dataset/9c8bf7b9620288e37de914e14514a7cb"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 5Ci (SPL)",
    "uuid": "543e8f39-3193-4c42-bf7c-af0db5a734fa",
    "reference": "Dataset/925dd675414de23caa52e0367c1a3375"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 5L (SPL)",
    "uuid": "bfa768fa-0d81-4947-90b9-4e0f5943ce98",
    "reference": "Dataset/bbe333a7175fa91ca85808525a8f3a95"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 5M (SPL)",
    "uuid": "62e6f733-e207-4bf4-aa00-a2e8d7be8dfe",
    "reference": "Dataset/4594e46485d1384a0a1cebd5401b0d02"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 7A (SPL)",
    "uuid": "2bd849cb-f710-40da-a4cf-b2998a10e69b",
    "reference": "Dataset/03af25a9e0615b08dd336cf19765b6dd"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 7M (SPL)",
    "uuid": "d271ca98-bc2c-40d9-bb73-77d749c07d4e",
    "reference": "Dataset/4246c3fb4cce9f1926f2f137e98bbfdb"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 7P (SPL)",
    "uuid": "af2a6444-6c51-43e2-8ef7-f82736961815",
    "reference": "Dataset/b1570fa8c0c775486afad8730acb4400"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area 7PC (SPL)",
    "uuid": "905cab63-6eeb-4a61-9fd6-b4d0cd90504d",
    "reference": "Dataset/98c962a9f987f1ac5798bf97c5faa9cf"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area FG1 (FusG)",
    "uuid": "93872b4e-417c-484e-9df3-76b07feeb34c",
    "reference": "Dataset/bb9bd9dbcbb1f9172e9aa1c5865a5411"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area FG2 (FusG)",
    "uuid": "2fd16a43-acdc-4b5c-9548-4a5719905377",
    "reference": "Dataset/d01f09f2e90f9a856262f0a0c829358f"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area FG3 (FusG)",
    "uuid": "0a831b02-89e7-4c32-8dc0-cececd6de20a",
    "reference": "Dataset/67d75cb8a7ae67e9008fde9c6798bd9f"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area FG4 (FusG)",
    "uuid": "29cc742b-bf4d-4b88-ae1d-eb5dbd17bf73",
    "reference": "Dataset/c89cb70ede397da7c18dc56793a6d1eb"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area Fo1 (OFC)",
    "uuid": "cc324e6b-3b50-4d6c-a8ef-b478fd1764b4",
    "reference": "Dataset/4d6a09d1a8264ec9060d8b658d1a28b7"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area Fo2 (OFC)",
    "uuid": "68be103f-62fd-4e33-a632-10778b6898cb",
    "reference": "Dataset/7b8a4c031ef1c753e13b8aacb2cb28a9"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area Fo3 (OFC)",
    "uuid": "79de7855-a719-4909-9001-0f7bfff57b00",
    "reference": "Dataset/b370022eaddfce62b33814b2853b8ad6"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area Fp1 (Fpole)",
    "uuid": "515b269c-dc29-4355-88c5-b4f1e854f9a3",
    "reference": "Dataset/19e764559ef6e1e11fa7ca0c061b3e1b"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area Fp2 (Fpole)",
    "uuid": "93ee973c-e997-4707-826d-96c957ae742a",
    "reference": "Dataset/f147c4445b7fe8c26d110e5aa327dc8c"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area Id1 (Insula)",
    "uuid": "3e6ae903-5ae5-4203-857a-43b29179a0bc",
    "reference": "Dataset/3b628033a68b7b2cafd8501706042b3e"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area Ig1 (Insula)",
    "uuid": "4956bbdb-f9ad-4fd5-a837-f5646aeed55b",
    "reference": "Dataset/b92753135f125edbf285cdae74a45572"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area Ig2 (Insula)",
    "uuid": "d5a4e61d-b4ca-432a-9179-fc82a5102294",
    "reference": "Dataset/d08c85f85353d7d5a03ec3a10ef9566d"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area OP1 (POperc)",
    "uuid": "c5b9bc94-9024-40d9-b8c7-79e19fe96524",
    "reference": "Dataset/1ecc35fa2ef043d9026eda54e32ee3c9"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area OP2 (POperc)",
    "uuid": "a2fe492a-6d17-4699-8cec-09ce9d6a69d3",
    "reference": "Dataset/3b6e889ba30baf75a016c34c63609caf"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area OP3 (POperc)",
    "uuid": "b9d7fdb4-6ec6-46f3-ae03-b6640dc0085c",
    "reference": "Dataset/77bb5b859947674decd96f8886619653"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area OP4 (POperc)",
    "uuid": "12fde483-c866-49c2-8c8e-fd0195e194e3",
    "reference": "Dataset/b147c7f329c4d0069fa35e260fafed0e"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area PF (IPL)",
    "uuid": "f14b9614-cd37-4e0b-8c28-56d171ae2d1e",
    "reference": "Dataset/e30a06f402f98e4e2e0b80425a569f97"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area PFcm (IPL)",
    "uuid": "28897f4b-aa46-4830-a17b-a54770931115",
    "reference": "Dataset/47fcb30b036539ab7c009399bac6b6c1"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area PFm (IPL)",
    "uuid": "b052fbe0-ae5a-4171-b3be-104aca1e938b",
    "reference": "Dataset/5f8db801807210e19645d3958668c60d"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area PFop (IPL)",
    "uuid": "1def1da3-7936-4c64-8777-e632fbc73e0c",
    "reference": "Dataset/4801fcd1e79382e28902c38471547a0c"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area PFt (IPL)",
    "uuid": "87d46261-1367-4ba0-b8ee-a353e911dd4b",
    "reference": "Dataset/be1bde02b8ddca822cace9cdfae221eb"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area PGa (IPL)",
    "uuid": "411b4c3f-4715-4c25-849d-85f884eece8b",
    "reference": "Dataset/a27ec0812e3277ec0a93d082bbace351"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area PGp (IPL)",
    "uuid": "7868eb3b-e05d-41bc-ace5-32d9e6f1af48",
    "reference": "Dataset/0f761108088e5c6c0f1993a84b85e461"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area TE 1.0 (HESCHL)",
    "uuid": "769bc7b5-e2c3-41a7-aa2d-c09c229ecbef",
    "reference": "Dataset/f5dcc725af7fdaef1e184484b495045c"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area TE 1.1 (HESCHL)",
    "uuid": "7286763b-dad9-40ef-bb49-322041f1c95e",
    "reference": "Dataset/7e2a5a6921cd568236b7a9d4a1dc1ad7"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area TE 1.2 (HESCHL)",
    "uuid": "e9603a3b-2e32-4ac3-9476-3289c2ad9f9f",
    "reference": "Dataset/ef2e9f0aedb49f1ee8a305b7d4397971"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area TE 3 (STG)",
    "uuid": "942fc925-2e6d-4db4-abc5-df8b4196db5b",
    "reference": "Dataset/e8a38320b02668ffce3df8b9024163ff"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area hIP1 (IPS)",
    "uuid": "39158638-4760-4ae7-a94a-6f2222dbdc45",
    "reference": "Dataset/6af6fa88e660803bfe737d78abfba9c6"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area hIP2 (IPS)",
    "uuid": "164cc939-be2b-4c15-9e43-1d74916f1a87",
    "reference": "Dataset/44347ffde2418d102f1fbe3df36ba897"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area hIP3 (IPS)",
    "uuid": "0b0a5a50-96ca-409f-9fb8-14874f2eb045",
    "reference": "Dataset/acd2500102705d2865f4a811f863ce18"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area hOc1 (V1, 17, CalcS)",
    "uuid": "f44feb24-9198-4cd5-9f39-8173a8734865",
    "reference": "Dataset/a49480ea46ec06a51f839ec6bae404b1"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area hOc2 (V2, 18)",
    "uuid": "7680a762-08ba-4f5c-aac1-acf5a7773cf1",
    "reference": "Dataset/4ceee0c2684c257fa7401cd923f44b6a"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area hOc3d (Cuneus)",
    "uuid": "62e045a6-94d4-4764-befa-229429a5742d",
    "reference": "Dataset/3f8497d0e7b282c215666f4c216ea2a3"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area hOc3v (LingG)",
    "uuid": "945e7014-2633-4f9f-8b15-b486285a7e5f",
    "reference": "Dataset/00f9638f9e81627771ccf3c515c01fac"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area hOc4d (Cuneus)",
    "uuid": "b7a80af5-6d2b-46b1-ab33-b9405ffb6f6e",
    "reference": "Dataset/48641ad140c23dc88d4034ab11ecf41e"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area hOc4la (LOC)",
    "uuid": "5dfa15ad-c814-48b5-ba51-679c0d9c5fbd",
    "reference": "Dataset/7a99754a1a8f941ce16f2eb9ad106d0f"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area hOc4lp (LOC)",
    "uuid": "4343b80b-f2e1-4a5c-882d-6f17b7b37bb7",
    "reference": "Dataset/d5205cc20d9f3e323f537f050e963a1d"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area hOc4v (LingG)",
    "uuid": "e05ab6d2-c698-4283-bd67-8476b5dabd73",
    "reference": "Dataset/b692644f1e98a9889a7756f2448dd88a"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area hOc5 (LOC)",
    "uuid": "61089dcb-52ee-456b-9fe4-a28492281783",
    "reference": "Dataset/9ec06ecd5945a620414509aaa0e04425"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area s24 (sACC)",
    "uuid": "de488de5-e84c-450a-a63a-6d7a80858d0f",
    "reference": "Dataset/64381c2320e4e0a448f20b9e903f647a"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Area s32 (sACC)",
    "uuid": "84334f98-6db8-4cae-8228-b70ca53ff455",
    "reference": "Dataset/439d1470b132315451f25156c73a1f01"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of CA1 (Hippocampus)",
    "uuid": "ea3dd5dd-25dc-4ff7-a15e-5f19382fdec3",
    "reference": "Dataset/ca2d24694a35504816e7aefa30754f80"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of CA2 (Hippocampus)",
    "uuid": "094d5664-86a6-4b72-8955-f0a01f4578dd",
    "reference": "Dataset/c04281360c6236a74876a7c68ea579dc"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of CA3 (Hippocampus)",
    "uuid": "bbfa2c28-4dc2-4905-81cd-8f1bb217b70e",
    "reference": "Dataset/0480823e8d127178b0b71d3091ddef1f"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of CM (Amygdala)",
    "uuid": "393e8395-1fe5-4b0e-b71d-d3642904c947",
    "reference": "Dataset/76b8f4f9a6dfee5e26ff535db561b3df"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Ch 1-3 (Basal Forebrain)",
    "uuid": "360866f3-ecf9-4fbf-bddb-5c257b75d9aa",
    "reference": "Dataset/14ca3b38abd01aaf41a2ec01327425ea"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Ch 4 (Basal Forebrain)",
    "uuid": "d7f376b1-6a4a-4b60-8d4a-0b33b2caea93",
    "reference": "Dataset/a4124b731158b0ae9528cb0ca704ed89"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of DG (Hippocampus)",
    "uuid": "a0c37409-9ab9-475c-b8ca-ac26931e2076",
    "reference": "Dataset/822002eb2dda15740da5b787289b8bf1"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Dorsal Dentate Nucleus (Cerebellum)",
    "uuid": "c769c77f-bf7f-4dcc-8dea-17a8490c7de7",
    "reference": "Dataset/6acab26c0e21a9cfb56bda875401f208"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Entorhinal Cortex",
    "uuid": "f289487b-e03d-498b-8764-294ca4c3ea2f",
    "reference": "Dataset/f5b0720e47bf31ecbbdf2f8b4e9b1f62"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Fastigial Nucleus (Cerebellum)",
    "uuid": "01226dce-dd8a-484f-a683-f9cfc0a73504",
    "reference": "Dataset/abdf1ae00cd05d8e53f167870ca1f97b"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of HATA (Hippocampus)",
    "uuid": "123df9a1-db94-4624-85ee-b877343dd8c4",
    "reference": "Dataset/6beb7234ab5aec18efaf09b8f5f396ef"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Interposed Nucleus (Cerebellum)",
    "uuid": "33dcfd4a-09ba-493b-8025-3e7d63eea456",
    "reference": "Dataset/c99a7efffacca3b364c05a7a9345839a"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of LB (Amygdala)",
    "uuid": "fa4e681b-c76d-4764-8821-8fca40e5af9b",
    "reference": "Dataset/f35c3cd95c69038c00654368ea4c1d1e"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of SF (Amygdala)",
    "uuid": "9ab308bc-a5ad-45b8-98cb-2a453d767a95",
    "reference": "Dataset/7de5bfc9a49adab222aa0496e3b973d2"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Subc (Hippocampus)",
    "uuid": "b8b96954-1544-405b-ac51-4a12ce54afd9",
    "reference": "Dataset/4646c5ae8b8020b6737536d03dc11172"
  },
  {
    "value": "Probabilistic cytoarchitectonic map of Ventral Dentate Nucleus (Cerebellum)",
    "uuid": "58741d45-6d01-4263-9797-e5cd515e650f",
    "reference": "Dataset/aff5abef8edf16f1bcf637a44233feb6"
  }
]

const querySingle = (obj) => new Promise((resolve, reject) => {
  if(obj.labelIndex){
    const matchIndex = dictArr.findIndex(entry => `Probabilistic cytoarchitectonic map of ${obj.name}` === entry.value)
    let kgref
    if(matchIndex >= 0){
      
    }else{
      if(obj.name === 'Area 2 (PostCG)'){
        kgref = 'Dataset/9349857d0b9d7f89d5948b0c10c42bcb'
      }
      if(obj.name === ''){

      }
      console.error('could not find a match', obj.name)
    }
    resolve(obj)
  }else{
    Promise.all(obj.children.map(item => querySingle(item)))
      .then(children => resolve(
        Object.assign({}, obj, {children})
      ))
      .catch(err => reject(err))
  }
})

const getKgItemFromName = (name) => {
  const foundEntry = dictArr.find(entry => `Probabilistic cytoarchitectonic map of ${name}` === entry.value)
  return foundEntry
    ? foundEntry
    : name === 'Area 2 (PostCG)'
      ? getKgItemFromName('Area 2 (PostCS)')
      : name === 'emboliform nucleus, globose nucleus'
        ? getKgItemFromName('Interposed Nucleus (Cerebellum)')
        : (console.log('could not find anything, issue', name), null)
}

const querySingleFlat = (obj) => Object.assign({}, obj, {
  type : 'Probabilistic cytoarchitectonic map',
  name : getKgItemFromName(obj.regionName[0].regionName).value,
  kgID : getKgItemFromName(obj.regionName[0].regionName).reference,
  uuid : getKgItemFromName(obj.regionName[0].regionName).uuid
})

fs.readFile('./raw/pmapsAggregatedData.json','utf-8', (err, data) => {
  if(err) throw err
  const arr = JSON.parse(data)
  const newarr = arr.map(querySingleFlat)
  fs.writeFile('./raw/newPmapsAggregatedData.json', JSON.stringify(newarr), 'utf-8', (err) => {
    if(err) throw err
    console.log('done')
  })
})

// fetch("https://kg.humanbrainproject.org/api/smartproxy/kg/_search", {
//   "credentials":"include",
//   "headers":{},
//   "referrer":"https://kg.humanbrainproject.org/webapp/?q=area%2044%20%28IFG%29",
//   "referrerPolicy":"no-referrer-when-downgrade",
//   "body":"{\"query\":{\"query_string\":{\"query\":\"Area hIP1 (IPS)\"}}}",
//   "method":"POST",
//   "mode":"cors"})
//   .then(res => res.json())
//   .then(json => {
//     fs.writeFile('./raw/hip1.json', JSON.stringify(json), 'utf-8', (err) => {
//       if(err) throw err
//       console.log('writing finished')
//     })
//   })
//   .catch(console.error)