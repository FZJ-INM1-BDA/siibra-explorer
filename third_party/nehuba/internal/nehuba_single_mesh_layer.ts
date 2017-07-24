import {ChunkState} from 'neuroglancer/chunk_manager/base';
import {PerspectiveViewRenderContext} from 'neuroglancer/perspective_view/render_layer';
import {SINGLE_MESH_CHUNK_KEY} from 'neuroglancer/single_mesh/base';
import {mat4, vec4} from 'neuroglancer/util/geom';
import {GL} from 'neuroglancer/webgl/context';
import {ShaderBuilder, ShaderProgram} from 'neuroglancer/webgl/shader';

import { SingleMeshLayer, SingleMeshShaderManager, SingleMeshChunk } from "neuroglancer/single_mesh/frontend";

import { ExtraRenderContext } from "nehuba/internal/nehuba_perspective_panel";
import { getValuesForClipping } from "nehuba/internal/nehuba_mesh_layer";

export class NehubaSingleMeshShaderManager extends SingleMeshShaderManager {
	// private segmentColorShaderManager = new SegmentColorShaderManager('segmentColorHash'); //TODO Use it to get the colors right...
	defineShader(builder: ShaderBuilder) {
		super.defineShader(builder);
		builder.addVarying('highp vec4', 'vNavPos');
		builder.addUniform('highp mat4', 'uNavState');
		builder.addUniform('highp vec4', 'uOctant');
		builder.addUniform('highp vec4', 'uBackFaceColor');
		builder.addVertexMain(`
vec4 position = uModelMatrix * vec4(vertexPosition, 1.0);
vNavPos = uNavState * position * uOctant;
`);
		builder.addFragmentCode(this.fragmentMain.replace('void main()', 'void userMain()'));
		const fragment =`
if (vNavPos.x > 0.0 && vNavPos.y > 0.0 && vNavPos.z > 0.0) {
  discard;
} else {
  if (gl_FrontFacing) userMain();
  else emit(uBackFaceColor, uPickID);
}
`;
		builder.setFragmentMain(fragment);
	}

	setNavState(gl: GL, shader: ShaderProgram, navMat: mat4) {
		gl.uniformMatrix4fv(shader.uniform('uNavState'), false, navMat);
	}

	setOctant(gl: GL, shader: ShaderProgram, octant: vec4) {
		gl.uniform4fv(shader.uniform('uOctant'), octant);
	}

	setBackFaceColor(gl: GL, shader: ShaderProgram, color: vec4) {
		gl.uniform4fv(shader.uniform('uBackFaceColor'), color);
	}

	// ***** Uunsuccessful attempt to z offset single mesh TODO remove*****
	// drawFragment(
	// 	gl: GL, shader: ShaderProgram, chunk: SingleMeshChunk, countingBuffer: CountingBuffer) {
	// 	// gl.enable(gl.POLYGON_OFFSET_FILL);
	// 	// gl.polygonOffset(3.0, 1.0);
	// 	super.drawFragment(gl, shader, chunk, countingBuffer);
	// 	// gl.polygonOffset(0.0, 0.0);
	// 	// gl.disable(gl.POLYGON_OFFSET_FILL);
	// }	
}

//For the moment this little monkey-patching seems reasonable, but in general we should implement our own layer type. See {@link patches.useNehubaSingleMesh}
/** Monkey-patch SingleMeshLayer to provide the capability to remove the front (or any other) octant of the mesh. */
export function patchSingleMeshLayer(layer: SingleMeshLayer) {
	layer['makeShaderManager'] = function (this: SingleMeshLayer, fragmentMain = this.displayState.fragmentMain.value) { // Why is it private in the base class? Why not protected? PR #44 submitted to neuroglancer
		return new NehubaSingleMeshShaderManager(
			this.displayState.attributeNames.value, this.source.info.vertexAttributes, fragmentMain);
	}

	layer.draw = function (this: SingleMeshLayer, renderContext: PerspectiveViewRenderContext & {extra: ExtraRenderContext}) { //What if called without extra? (by normal ng layer)???
		if (!renderContext.emitColor && renderContext.alreadyEmittedPickID) {
			// No need for a separate pick ID pass.
			return;
		}
		let chunk = <SingleMeshChunk|undefined>this.source.chunks.get(SINGLE_MESH_CHUNK_KEY);
		if (chunk === undefined || chunk.state !== ChunkState.GPU_MEMORY) {
			return;
		}
		let shader = this['getShader'](renderContext.emitter); // Why is it private in the base class? Why not protected? PR #44 submitted to neuroglancer
		if (shader === null) {
			return;
		}

		let {gl} = this;
		let shaderManager = this['shaderManager']! as NehubaSingleMeshShaderManager; // Why is it private in the base class? Why not protected? PR #44 submitted to neuroglancer
		shader.bind();
		shaderManager.beginLayer(gl, shader, renderContext);

		if (!renderContext.extra) console.error('Bad configuration. Nehuba mesh layer is used by neuroglancer code.');
		const values = getValuesForClipping(renderContext.extra);
		shaderManager.setNavState(gl, shader, values.navState);
		shaderManager.setOctant(gl, shader, values.octant);
		shaderManager.setBackFaceColor(gl, shader, values.backFaceColor);


		let {pickIDs} = renderContext;

		shaderManager.beginObject(gl, shader, this.displayState.objectToDataTransform.transform);
		if (renderContext.emitPickID) {
			shaderManager.setPickID(gl, shader, pickIDs.register(this, chunk.numIndices / 3));
		}
		shaderManager.drawFragment(gl, shader, chunk, this['countingBuffer']); // Why is it private in the base class? Why not protected? PR #44 submitted to neuroglancer
		shaderManager.endLayer(gl, shader);
		renderContext.extra.meshRendered = true;
	}
}

//TODO We could have just extended SingleMeshLayer... 

/*export class NehubaSingleMeshLayer extends SingleMeshLayer {
	constructor(public source: SingleMeshSource, public displayState: SingleMeshDisplayState) {
		super(source, displayState);
		(<any>this).makeShaderManager = function (this: NehubaSingleMeshLayer, fragmentMain = this.displayState.fragmentMain.value) {
			return new NehubaMeshShaderManager(
				this.displayState.attributeNames.value, this.source.info.vertexAttributes, fragmentMain);
		}
	}
	// draw(renderContext: PerspectiveViewRenderContext) {
	// 	renderContext;
	// 	// this.shaderManager
	// }
}*/