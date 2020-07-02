module.exports = {
  name: 'Individual Brain Charting fMRI datasets with strong activation in Area hIP1 (IPS) of the left hemisphere\n\n',
  kgReference: ['https://kg.ebrains.eu/search/instances/Dataset/a1c940cc-4777-417e-9326-dd6584d6c71f\n\n'],
  description: 'The Individual Brain Charting dataset is a high spatial-resolution, multi-task, functional Magnetic Resonance Imaging dataset, intended to support the investigation on the functional principles governing cognition in the human brain.\n' +
    'Read more in the Knowledge Graph: https://kg.ebrains.eu/search/instances/Dataset/a1c940cc-4777-417e-9326-dd6584d6c71f\n' +
    '\n' +
    'Following are the 10 measurements with the strongest activation in Area hIP1 (IPS) of the left hemisphere:\n' +
    '\n' +
    '| Subject ID | Session ID | Task |\n' +
    '| --- | --- | --- |\n' +
    '| sub-05 | ses-04 | task-archi_emotional_dir-ap_face_trusty|\n' +
    '| sub-05 | ses-04 | dir-ap_face_trusty|\n' +
    '| sub-07 | ses-11 | sn_before-after_event|\n' +
    '| sub-07 | ses-04 | dir-ap_reading-checkerboard|\n' +
    '| sub-07 | ses-04 | task-archi_standard_dir-ap_reading-checkerboard|\n' +
    '| sub-06 | ses-01 | task-hcp_gambling_dir-ap_punishment-reward|\n' +
    '| sub-06 | ses-01 | dir-ap_punishment-reward|\n' +
    '| sub-07 | ses-12 | task-mtt_we_dir-ap_run-03_we_before-after_event|\n' +
    '| sub-07 | ses-12 | dir-ap_run-03_we_before-after_event|\n' +
    '| sub-07 | ses-12 | we_before-after_event|\n' +
    '\n' +
    '\n' +
    'The Individual Brain Charting Dataset is currently under GDPR review. Once the review is completed, we will provide direct links to these files here.',
  methods: ['functional magnetic resonance imaging (fMRI)'],
  species: ['Homo sapiens'],
  fullId: `https://ibc/ibc_schema/left_AIPS_IP1.md`,
  kgId: 'left_AIPS_IP1.md',
  kgSchema: '//ibc/ibc_schema',
  referenceSpaces: [
    {
      "name": null,
      "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2"
    },
    {
      "name": "MNI Colin 27",
      "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992"
    }
  ],
  parcellationAtlas: [
    {
      name: 'Jülich Cytoarchitechtonic Brain Atlas (human)',
      fullId:
        'https://nexus.humanbrainproject.org/v0/data/minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579'
    }],
  parcellationRegion: [
    {
      species: [],
      name: 'Area hIP1 (IPS)',
      alias: null,
      fullId: 'https://nexus.humanbrainproject.org/v0/data/minds/core/parcellationregion/v1.0.0/7722c71f-fe84-4deb-8f6b-98e2aecf2e31'
    }
  ],
}


