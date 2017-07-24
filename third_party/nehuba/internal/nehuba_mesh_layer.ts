import {ChunkState} from 'neuroglancer/chunk_manager/base';
import {ChunkManager} from 'neuroglancer/chunk_manager/frontend';
import {PerspectiveViewRenderContext} from 'neuroglancer/perspective_view/render_layer';
import {forEachSegmentToDraw, getObjectColor, SegmentationDisplayState3D} from 'neuroglancer/segmentation_display_state/frontend';
import {mat4, vec4, quat} from 'neuroglancer/util/geom';
import {getObjectId} from 'neuroglancer/util/object_id';
import {GL} from 'neuroglancer/webgl/context';
import {ShaderBuilder, ShaderModule, ShaderProgram} from 'neuroglancer/webgl/shader';

import { MeshShaderManager, MeshLayer, MeshSource } from "neuroglancer/mesh/frontend";

import { ExtraRenderContext } from "nehuba/internal/nehuba_perspective_panel";

export class NehubaMeshShaderManager extends MeshShaderManager {
	defineShader(builder: ShaderBuilder) {
		super.defineShader(builder);
		builder.addVarying('highp vec4', 'vNavPos');
		builder.addUniform('highp mat4', 'uNavState');
		builder.addUniform('highp vec4', 'uOctant');
		builder.addUniform('highp vec4', 'uBackFaceColor');
		builder.setVertexMain(`
vec4 position = uModelMatrix * vec4(aVertexPosition, 1.0);
vNavPos = uNavState * position * uOctant;
gl_Position = uProjection * position;
vec3 normal = (uModelMatrix * vec4(aVertexNormal, 0.0)).xyz;
float lightingFactor = abs(dot(normal, uLightDirection.xyz)) + uLightDirection.w;
vColor = vec4(lightingFactor * uColor.rgb, uColor.a);
		`);    		
		builder.setFragmentMain(`
if (vNavPos.x > 0.0 && vNavPos.y > 0.0 && vNavPos.z > 0.0) {
  discard;
} else {
  if (gl_FrontFacing) emit(vColor, uPickID);
  else emit(uBackFaceColor, uPickID);
}
		`);
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
	getShader(gl: GL, emitter: ShaderModule) {
		return gl.memoize.get(`mesh/NehubaMeshShaderManager:${getObjectId(emitter)}`, () => {
			let builder = new ShaderBuilder(gl);
			builder.require(emitter);
			this.defineShader(builder);
			return builder.build();
		});
	}
}

export class NehubaMeshLayer extends MeshLayer {
	constructor(chunkManager: ChunkManager, source: MeshSource, displayState: SegmentationDisplayState3D) {
		super(chunkManager, source, displayState);
		this['meshShaderManager'] = new NehubaMeshShaderManager(); // Why is it private in the base class? Why not protected? PR #44 submitted to neuroglancer
	}	


	draw(renderContext: PerspectiveViewRenderContext & { extra: ExtraRenderContext }) { //What if called without extra? (by normal ng layer)
		if (!renderContext.emitColor && renderContext.alreadyEmittedPickID) {
			// No need for a separate pick ID pass.
			return;
		}
		let {gl, displayState, /*meshShaderManager*/} = this;
		let meshShaderManager = this['meshShaderManager'] as NehubaMeshShaderManager; // Why is it private in the base class? Why not protected? PR #44 submitted to neuroglancer
		let alpha = Math.min(1.0, displayState.objectAlpha.value);
		if (alpha <= 0.0) {
			// Skip drawing.
			return;
		}
		let shader = this['getShader'](renderContext.emitter); // Why is it private in the base class? Why not protected? PR #44 submitted to neuroglancer
		shader.bind();
		meshShaderManager.beginLayer(gl, shader, renderContext);

		if (!renderContext.extra) console.error('Bad configuration. Julich mesh layer is used by neuroglancer code.');
		const values = getValuesForClipping(renderContext.extra);
		meshShaderManager.setNavState(gl, shader, values.navState);
		meshShaderManager.setOctant(gl, shader, values.octant);
		meshShaderManager.setBackFaceColor(gl, shader, values.backFaceColor);

		let objectChunks = this.source.fragmentSource.objectChunks;

		let {pickIDs} = renderContext;

		const objectToDataMatrix = this.displayState.objectToDataTransform.transform;

		forEachSegmentToDraw(displayState, objectChunks, (rootObjectId, objectId, fragments) => {
			if (renderContext.emitColor) {
				meshShaderManager.setColor(gl, shader, getObjectColor(displayState, rootObjectId, alpha));
			}
			if (renderContext.emitPickID) {
				meshShaderManager.setPickID(gl, shader, pickIDs.registerUint64(this, objectId));
			}
			meshShaderManager.beginObject(gl, shader, objectToDataMatrix);
			for (let fragment of fragments) {
				if (fragment.state === ChunkState.GPU_MEMORY) {
					meshShaderManager.drawFragment(gl, shader, fragment);
				}
			}
		});

		meshShaderManager.endLayer(gl, shader);
		renderContext.extra.meshRendered = objectChunks.size > 0;
	}
}

// const tempQuat = quat.create();
// const tempMat4 = mat4.create();
// TODO Use these in getValuesForClipping() to save some allocations. At the moment left as it is for clarity

export function getValuesForClipping(extra: ExtraRenderContext) {
    const conf = (extra && extra.config.layout!.useNehubaPerspective!.mesh); //Is it undefined?

    const backFaceColor = 
      (conf && conf.backFaceColor) || 
      (extra && extra.config && extra.config.layout && extra.config.layout.useNehubaPerspective && extra.config.layout.useNehubaPerspective.perspectiveSlicesBackground) ||
      (extra && extra.config && extra.config.layout && extra.config.layout.planarSlicesBackground) ||
      (extra && extra.config.dataset && extra.config.dataset.imageBackground) || 
      vec4.fromValues(0.5, 0.5, 0.5, 1);

    const navState = mat4.create();
    let octant = (conf && conf.removeOctant) || vec4.fromValues(0.0, 0.0, 0.0, 0.0);
    if (extra && conf) {
      const pose = extra.slicesPose;

      if (conf.removeBasedOnNavigation) {
        pose.toMat4(navState);
        mat4.invert(navState, navState);
      }
      
      if (conf.flipRemovedOctant) {
        octant = vec4.fromValues(0.0, 0.0, -1.0, 1.0);
        let perspectivePose = extra.perspectivePose;
        let perspectiveQuat = perspectivePose.orientation.orientation;
        let navQuat = quat.invert(quat.create(), pose.orientation.orientation);
        let resQuat = quat.multiply(quat.create(), navQuat, perspectiveQuat);
        let rot = mat4.fromQuat(mat4.create(), resQuat);
        vec4.transformMat4(octant, octant, rot);
        octant[0] = octant[0] < 0.0 ? -1.0 : 1.0;
        octant[1] = octant[1] < 0.0 ? -1.0 : 1.0;
        octant[2] = octant[2] < 0.0 ? -1.0 : 1.0;
        octant[3] = octant[3] < 0.0 ? -1.0 : 1.0;
      }
    }
    return {navState, octant, backFaceColor};
}