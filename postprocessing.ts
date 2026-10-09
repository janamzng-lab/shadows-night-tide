import * as THREE from 'three';

export interface NightTidePostProcessorOptions {
  grainIntensity?: number;
  aberrationIntensity?: number;
  vignetteIntensity?: number;
  enabled?: boolean;
}

/**
 * Custom Night Tide Horror Shader
 * Applies subtle procedural animated film grain, radial chromatic aberration,
 * claustrophobic vignette, and reactive sanity/damage distortion.
 */
export const NightTideHorrorShader = {
  name: 'NightTideHorrorShader',
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uGrainIntensity: { value: 0.04 },
    uAberrationIntensity: { value: 0.012 },
    uVignetteIntensity: { value: 0.32 },
    uDamageIntensity: { value: 0.0 },
    uHealthRatio: { value: 1.0 },
    uFearLevel: { value: 0.0 },
    uEnabled: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    precision mediump float;

    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uGrainIntensity;
    uniform float uAberrationIntensity;
    uniform float uVignetteIntensity;
    uniform float uDamageIntensity;
    uniform float uHealthRatio;
    uniform float uFearLevel;
    uniform float uEnabled;

    varying vec2 vUv;

    // Mobile-optimized pseudo-random noise generator
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      if (uEnabled < 0.5) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      vec2 uv = vUv;
      vec2 center = vec2(0.5, 0.5);
      vec2 offsetFromCenter = uv - center;
      float dist = length(offsetFromCenter);

      // Critical fear factor (starts creeping above 65%, full blown at 95%+)
      float critFear = smoothstep(0.65, 0.98, uFearLevel);

      // 1. Dynamic Chromatic Aberration & Panic Warp
      float healthDistress = smoothstep(0.4, 0.0, uHealthRatio) * 0.014;
      float damageDistress = uDamageIntensity * 0.038;
      float fearAberration = critFear * 0.032;
      float totalAberration = uAberrationIntensity + healthDistress + damageDistress + fearAberration;

      // Radial barrel shift for R and B channels
      float radialShift = dist * dist * 3.4 + 0.14;
      vec2 redOffset = offsetFromCenter * (totalAberration * radialShift);
      vec2 blueOffset = -offsetFromCenter * (totalAberration * radialShift);

      // Horror damage & panic micro-jitter
      vec2 glitchJitter = vec2(0.0);
      if (uDamageIntensity > 0.04 || critFear > 0.3) {
        float slice = step(0.91, sin(uv.y * 65.0 + uTime * 45.0));
        float jitterMag = uDamageIntensity + critFear * 0.35;
        glitchJitter.x = (hash(vec2(uTime * 12.0, floor(uv.y * 45.0))) - 0.5) * 0.022 * jitterMag * slice;
      }

      // Hallucinatory optical wave distortion when fear is critical
      vec2 fearWarp = vec2(0.0);
      if (critFear > 0.005) {
        float waveTime = uTime * 3.6;
        float warpX = sin(uv.y * 22.0 + waveTime) * 0.011 * critFear;
        float warpY = cos(uv.x * 16.0 - waveTime * 0.9) * 0.008 * critFear;
        float vertigoPulse = sin(uTime * 4.5) * 0.008 * critFear;
        fearWarp = vec2(warpX, warpY) + offsetFromCenter * vertigoPulse;
      }

      vec2 warpedUv = clamp(uv + fearWarp, 0.0, 1.0);

      // 2. Multi-sample Radial Blur when fear is critical
      vec3 color = vec3(0.0);
      if (critFear > 0.01) {
        float blurRadius = critFear * 0.019 * (dist * 1.3 + 0.25);
        vec3 blurAccum = vec3(0.0);

        // 5-tap radial blur
        vec2 tap1 = clamp(warpedUv - offsetFromCenter * blurRadius + glitchJitter, 0.0, 1.0);
        vec2 tap2 = clamp(warpedUv - offsetFromCenter * (blurRadius * 0.5) + glitchJitter, 0.0, 1.0);
        vec2 tap3 = clamp(warpedUv + glitchJitter, 0.0, 1.0);
        vec2 tap4 = clamp(warpedUv + offsetFromCenter * (blurRadius * 0.5) + glitchJitter, 0.0, 1.0);
        vec2 tap5 = clamp(warpedUv + offsetFromCenter * blurRadius + glitchJitter, 0.0, 1.0);

        blurAccum.r += texture2D(tDiffuse, clamp(tap1 + redOffset, 0.0, 1.0)).r * 0.15;
        blurAccum.g += texture2D(tDiffuse, tap1).g * 0.15;
        blurAccum.b += texture2D(tDiffuse, clamp(tap1 + blueOffset, 0.0, 1.0)).b * 0.15;

        blurAccum.r += texture2D(tDiffuse, clamp(tap2 + redOffset * 0.7, 0.0, 1.0)).r * 0.22;
        blurAccum.g += texture2D(tDiffuse, tap2).g * 0.22;
        blurAccum.b += texture2D(tDiffuse, clamp(tap2 + blueOffset * 0.7, 0.0, 1.0)).b * 0.22;

        blurAccum.r += texture2D(tDiffuse, clamp(tap3 + redOffset * 0.5, 0.0, 1.0)).r * 0.26;
        blurAccum.g += texture2D(tDiffuse, tap3).g * 0.26;
        blurAccum.b += texture2D(tDiffuse, clamp(tap3 + blueOffset * 0.5, 0.0, 1.0)).b * 0.26;

        blurAccum.r += texture2D(tDiffuse, clamp(tap4 + redOffset * 0.7, 0.0, 1.0)).r * 0.22;
        blurAccum.g += texture2D(tDiffuse, tap4).g * 0.22;
        blurAccum.b += texture2D(tDiffuse, clamp(tap4 + blueOffset * 0.7, 0.0, 1.0)).b * 0.22;

        blurAccum.r += texture2D(tDiffuse, clamp(tap5 + redOffset, 0.0, 1.0)).r * 0.15;
        blurAccum.g += texture2D(tDiffuse, tap5).g * 0.15;
        blurAccum.b += texture2D(tDiffuse, clamp(tap5 + blueOffset, 0.0, 1.0)).b * 0.15;

        color = blurAccum;
      } else {
        vec2 uvR = clamp(warpedUv + redOffset + glitchJitter, 0.0, 1.0);
        vec2 uvG = clamp(warpedUv + glitchJitter * 0.4, 0.0, 1.0);
        vec2 uvB = clamp(warpedUv + blueOffset + glitchJitter * 0.8, 0.0, 1.0);

        float r = texture2D(tDiffuse, uvR).r;
        float g = texture2D(tDiffuse, uvG).g;
        float b = texture2D(tDiffuse, uvB).b;
        color = vec3(r, g, b);
      }

      // 3. Cinematic Film Grain
      vec2 fragCoord = gl_FragCoord.xy;
      float grainStepTime = floor(uTime * 20.0);
      float grainNoise = hash(fragCoord + vec2(grainStepTime * 14.13, grainStepTime * 29.41));
      float centeredGrain = (grainNoise - 0.5) * 2.0;

      float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
      float grainLumaWeight = mix(1.2, 0.28, smoothstep(0.12, 0.85, luminance));

      float dynamicGrain = uGrainIntensity + (uDamageIntensity * 0.035) + (smoothstep(0.35, 0.0, uHealthRatio) * 0.022) + (critFear * 0.028);
      color += centeredGrain * dynamicGrain * grainLumaWeight;

      // 4. Claustrophobic Vignette & Tunnel Vision
      float fearVignetteShift = critFear * 0.35;
      float vignette = smoothstep(1.28 - fearVignetteShift, 0.42 - fearVignetteShift * 0.25, dist * (1.35 + critFear * 0.35));
      color *= mix(1.0, vignette, min(1.0, uVignetteIntensity + critFear * 0.45));

      // 5. Psychosis Desaturation & Cold Horror Shadows
      if (critFear > 0.01) {
        float gray = dot(color, vec3(0.299, 0.587, 0.114));
        vec3 psychosisTint = vec3(gray * 1.08 + 0.04, gray * 0.82, gray * 0.98 + 0.02);
        color = mix(color, psychosisTint, critFear * 0.38);
      } else {
        vec3 coldShadow = vec3(0.012, 0.022, 0.036) * (1.0 - luminance);
        color += coldShadow;
      }

      // 6. Impact Red Glare during damage
      if (uDamageIntensity > 0.01) {
        vec3 bloodTinge = vec3(color.r * 1.3 + 0.16, color.g * 0.75, color.b * 0.75);
        color = mix(color, bloodTinge, clamp(uDamageIntensity * 0.5, 0.0, 0.6));
      }

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `,
};

/**
 * Mobile-Optimized Post-Processing Pass for Three.js GameEngine
 * Handles offscreen render target management and custom shader blit with zero GC allocations in loop.
 */
export class NightTidePostProcessor {
  private renderTarget: THREE.WebGLRenderTarget;
  private postScene: THREE.Scene;
  private postCamera: THREE.OrthographicCamera;
  private quadGeometry: THREE.PlaneGeometry;
  private material: THREE.ShaderMaterial;
  private quadMesh: THREE.Mesh;
  private damageGlitchTimer: number = 0;
  private enabled: boolean = true;
  private quality: 'low' | 'medium' | 'high' = 'high';

  constructor(
    renderer: THREE.WebGLRenderer,
    width: number,
    height: number,
    pixelRatio: number = 1.0,
    options?: NightTidePostProcessorOptions
  ) {
    const targetWidth = Math.max(1, Math.floor(width * pixelRatio));
    const targetHeight = Math.max(1, Math.floor(height * pixelRatio));

    this.renderTarget = new THREE.WebGLRenderTarget(targetWidth, targetHeight, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
      depthBuffer: true,
    });

    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.postScene = new THREE.Scene();
    this.quadGeometry = new THREE.PlaneGeometry(2, 2);

    this.material = new THREE.ShaderMaterial({
      vertexShader: NightTideHorrorShader.vertexShader,
      fragmentShader: NightTideHorrorShader.fragmentShader,
      uniforms: {
        tDiffuse: { value: this.renderTarget.texture },
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(targetWidth, targetHeight) },
        uGrainIntensity: { value: options?.grainIntensity ?? 0.04 },
        uAberrationIntensity: { value: options?.aberrationIntensity ?? 0.012 },
        uVignetteIntensity: { value: options?.vignetteIntensity ?? 0.32 },
        uDamageIntensity: { value: 0.0 },
        uHealthRatio: { value: 1.0 },
        uFearLevel: { value: 0.0 },
        uEnabled: { value: options?.enabled !== false ? 1.0 : 0.0 },
      },
      depthWrite: false,
      depthTest: false,
    });

    this.quadMesh = new THREE.Mesh(this.quadGeometry, this.material);
    this.postScene.add(this.quadMesh);
  }

  public setSize(width: number, height: number, pixelRatio: number = 1.0) {
    const targetWidth = Math.max(1, Math.floor(width * pixelRatio));
    const targetHeight = Math.max(1, Math.floor(height * pixelRatio));
    this.renderTarget.setSize(targetWidth, targetHeight);
    this.material.uniforms.uResolution.value.set(targetWidth, targetHeight);
  }

  public triggerDamageGlitch(intensity: number = 0.8) {
    this.damageGlitchTimer = Math.max(this.damageGlitchTimer, intensity);
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.material.uniforms.uEnabled.value = enabled ? 1.0 : 0.0;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setQuality(quality: 'low' | 'medium' | 'high') {
    this.quality = quality;
    if (quality === 'low') {
      this.material.uniforms.uGrainIntensity.value = 0.025;
      this.material.uniforms.uAberrationIntensity.value = 0.008;
      this.material.uniforms.uVignetteIntensity.value = 0.22;
    } else if (quality === 'medium') {
      this.material.uniforms.uGrainIntensity.value = 0.035;
      this.material.uniforms.uAberrationIntensity.value = 0.011;
      this.material.uniforms.uVignetteIntensity.value = 0.28;
    } else {
      this.material.uniforms.uGrainIntensity.value = 0.042;
      this.material.uniforms.uAberrationIntensity.value = 0.014;
      this.material.uniforms.uVignetteIntensity.value = 0.34;
    }
  }

  public update(dt: number, healthRatio: number = 1.0, fearRatio: number = 0.0) {
    this.material.uniforms.uTime.value += dt;
    this.material.uniforms.uHealthRatio.value = healthRatio;
    this.material.uniforms.uFearLevel.value = THREE.MathUtils.lerp(
      this.material.uniforms.uFearLevel.value,
      fearRatio,
      0.15
    );

    if (this.damageGlitchTimer > 0) {
      this.damageGlitchTimer = Math.max(0, this.damageGlitchTimer - dt * 2.8);
      this.material.uniforms.uDamageIntensity.value = this.damageGlitchTimer;
    } else {
      this.material.uniforms.uDamageIntensity.value = 0.0;
    }
  }

  /**
   * Main render execution: Renders 3D scene into offscreen target,
   * then blits through custom film-grain & chromatic aberration shader.
   */
  public render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    if (!this.enabled) {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      return;
    }

    // 1. Offscreen render target
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(scene, camera);

    // 2. Fullscreen post-process pass directly to canvas framebuffer
    renderer.setRenderTarget(null);
    renderer.render(this.postScene, this.postCamera);
  }

  public dispose() {
    this.renderTarget.dispose();
    this.quadGeometry.dispose();
    this.material.dispose();
  }
}
