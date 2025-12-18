/*
 * wifi-heatmapper
 * File: src/app/webGL/shaders/fullscreenQuadVertexShader.ts
 * WebGL renderer or shader used for heatmap rendering.
 * Generated: 2025-12-18T10:28:20.555Z
 */

/**
 * Generic vertex shader for rendering a full-screen quad.
 * Converts normalized device coordinates [-1, 1] to UV coordinates [0, 1].
 */
/**
 * const fullscreenQuadVertexShader = ` — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export const fullscreenQuadVertexShader = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0, 1);
  }
`;

/**
 * Variant of `fullscreenQuadVertexShader` that flips the Y axis in UV space.
 * Useful when working with texture coordinate systems that use a top-left origin.
 *
 * TODO: Merge using a `uniform bool u_flipY` toggle to reduce duplication.
 */
/**
 * const fullscreenQuadVertexShaderFlipY = ` — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export const fullscreenQuadVertexShaderFlipY = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = vec2(a_position.x * 0.5 + 0.5, -a_position.y * 0.5 + 0.5);
    gl_Position = vec4(a_position, 0, 1);
  }
`;
