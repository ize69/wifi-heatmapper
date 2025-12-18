/*
 * wifi-heatmapper
 * File: src/app/webGL/utils/webGLDefaults.ts
 * WebGL renderer or shader used for heatmap rendering.
 * Generated: 2025-12-18T10:28:20.555Z
 */

/**
 * Applies standard texture parameters for 2D textures.
 * Configures linear filtering (no mipmaps) and clamps texture coordinates to the edge.
 * Suitable for non-repeating, non-mipmapped textures such as UI elements, heatmaps, and image-based textures.
 */
/**
 * const setDefaultTextureParams = — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export const setDefaultTextureParams = (gl: WebGLRenderingContext) => {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
};
