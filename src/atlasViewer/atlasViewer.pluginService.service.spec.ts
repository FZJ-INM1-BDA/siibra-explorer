// import { PluginServices } from "./atlasViewer.pluginService.service";
// import { TestBed, inject } from "@angular/core/testing";
// import { MainModule } from "src/main.module";
// import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing'

// const MOCK_PLUGIN_MANIFEST = {
//   name: 'fzj.xg.MOCK_PLUGIN_MANIFEST',
//   templateURL: 'http://localhost:10001/template.html',
//   scriptURL: 'http://localhost:10001/script.js'
// }

// describe('PluginServices', () => {
//   let pluginService: PluginServices

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [
//         HttpClientTestingModule,
//         MainModule
//       ]
//     }).compileComponents()

//     pluginService = TestBed.get(PluginServices)
//   })

//   it(
//     'is instantiated in test suite OK',
//     () => expect(TestBed.get(PluginServices)).toBeTruthy()
//   )

//   it(
//     'expectOne is working as expected',
//     inject([HttpTestingController], (httpMock: HttpTestingController) => {
//       expect(httpMock.match('test').length).toBe(0)
//       pluginService.fetch('test')
//       expect(httpMock.match('test').length).toBe(1)
//       pluginService.fetch('test')
//       pluginService.fetch('test')
//       expect(httpMock.match('test').length).toBe(2)
//     })
//   )

//   describe('#launchPlugin', () => {

//     describe('basic fetching functionality', () => {
//       it(
//         'fetches templateURL and scriptURL properly',
//         inject([HttpTestingController], (httpMock: HttpTestingController) => {

//           pluginService.launchPlugin(MOCK_PLUGIN_MANIFEST)

//           const mockTemplate = httpMock.expectOne(MOCK_PLUGIN_MANIFEST.templateURL)
//           const mockScript = httpMock.expectOne(MOCK_PLUGIN_MANIFEST.scriptURL)

//           expect(mockTemplate).toBeTruthy()
//           expect(mockScript).toBeTruthy()
//         })
//       )
//       it(
//         'template overrides templateURL',
//         inject([HttpTestingController], (httpMock: HttpTestingController) => {
//           pluginService.launchPlugin({
//             ...MOCK_PLUGIN_MANIFEST,
//             template: ''
//           })

//           httpMock.expectNone(MOCK_PLUGIN_MANIFEST.templateURL)
//           const mockScript = httpMock.expectOne(MOCK_PLUGIN_MANIFEST.scriptURL)

//           expect(mockScript).toBeTruthy()
//         })
//       )

//       it(
//         'script overrides scriptURL',

//         inject([HttpTestingController], (httpMock: HttpTestingController) => {
//           pluginService.launchPlugin({
//             ...MOCK_PLUGIN_MANIFEST,
//             script: ''
//           })

//           const mockTemplate = httpMock.expectOne(MOCK_PLUGIN_MANIFEST.templateURL)
//           httpMock.expectNone(MOCK_PLUGIN_MANIFEST.scriptURL)

//           expect(mockTemplate).toBeTruthy()
//         })
//       )
//     })

//     describe('racing slow cconnection when launching plugin', () => {
//       it(
//         'when template/script has yet been fetched, repeated launchPlugin should not result in repeated fetching',
//         inject([HttpTestingController], (httpMock:HttpTestingController) => {

//           expect(pluginService.pluginIsLaunching(MOCK_PLUGIN_MANIFEST.name)).toBeFalsy()
//           pluginService.launchPlugin(MOCK_PLUGIN_MANIFEST)
//           pluginService.launchPlugin(MOCK_PLUGIN_MANIFEST)
//           expect(httpMock.match(MOCK_PLUGIN_MANIFEST.scriptURL).length).toBe(1)
//           expect(httpMock.match(MOCK_PLUGIN_MANIFEST.templateURL).length).toBe(1)

//           expect(pluginService.pluginIsLaunching(MOCK_PLUGIN_MANIFEST.name)).toBeTruthy()
//         })
//       )
//     })
//   })
// })

// TODO currently crashes test somehow
// TODO figure out why
