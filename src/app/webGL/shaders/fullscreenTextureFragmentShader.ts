/*
 * wifi-heatmapper
 * File: src/app/webGL/shaders/fullscreenTextureFragmentShader.ts
 * WebGL renderer or shader used for heatmap rendering.
 * Generated: 2025-12-18T10:28:20.555Z
 */

/**
 * const fullscreenTextureFragmentShader = ` — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export const fullscreenTextureFragmentShader = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_texture;
      void main() {
        gl_FragColor = texture2D(u_texture, v_uv);
      }
    `;
