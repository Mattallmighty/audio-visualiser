import type React from "react";
import { hexToRgb } from "../../engines/webgl/shaders";

export interface DrawCustomParams {
  gl: WebGLRenderingContext;
  data: number[] | Float32Array;
  width: number;
  height: number;
  programRef: React.MutableRefObject<WebGLProgram | null>;
  configRef: React.MutableRefObject<Record<string, any>>;
  visualTypeRef: React.MutableRefObject<string>;
  quadBufferRef: React.MutableRefObject<WebGLBuffer | null>;
  startTimeRef: React.MutableRefObject<number>;
  whiteCircleFixRef: React.MutableRefObject<string>;
  beatDataRef: React.MutableRefObject<
    | { isBeat: boolean; beatIntensity: number; beatPhase: number; bpm: number }
    | undefined
  >;
  beatRef: React.MutableRefObject<number>;
  frequencyBandsRef: React.MutableRefObject<
    { bass: number; mid: number; high: number } | undefined
  >;
  outerGlowModeRef: React.MutableRefObject<string>;
  volumeDataRef: React.MutableRefObject<
    { stream: number; intensity: number; normalized: number } | undefined
  >;
  melbankTextureRef: React.MutableRefObject<WebGLTexture | null>;
  melbankArrayRef: React.MutableRefObject<Uint8Array | null>;
  themeColorsRef: React.MutableRefObject<{
    primary: number[];
    secondary: number[];
  }>;
  getLoc: (name: string) => WebGLUniformLocation | null;
  getAttribLoc: (name: string) => number;
  handleGradients: (gl: WebGLRenderingContext, cfg: any) => void;
  handleTextTexture: (gl: WebGLRenderingContext, cfg: any) => void;
}

export function drawCustomFn(params: DrawCustomParams): void {
  const {
    gl,
    data,
    width,
    height,
    programRef,
    configRef,
    visualTypeRef,
    quadBufferRef,
    startTimeRef,
    whiteCircleFixRef,
    beatDataRef,
    beatRef,
    frequencyBandsRef,
    outerGlowModeRef,
    volumeDataRef,
    melbankTextureRef,
    melbankArrayRef,
    themeColorsRef,
    getLoc,
    getAttribLoc,
    handleGradients,
    handleTextTexture,
  } = params;

  const program = programRef.current;
  if (!program) return;
  const cfg = configRef.current;
  const currentVisualType = visualTypeRef.current;

  const sensitivity =
    cfg.audioSensitivity ?? cfg.sensitivity ?? cfg.multiplier ?? 1.0;
  const avg =
    (data as any).reduce((a: number, b: number) => a + b, 0) / data.length;

  const brightness = cfg.brightness ?? 1.0;
  const fps = cfg.gif_fps ?? 30;
  const speed = fps / 30.0;

  gl.bindBuffer(gl.ARRAY_BUFFER, quadBufferRef.current);
  const posLoc = getAttribLoc("a_position");
  if (posLoc !== -1) {
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  }

  gl.uniform2f(getLoc("u_resolution"), width, height);
  const timeLoc = getLoc("u_time");
  if (timeLoc) {
    const actualSpeed = cfg.speed ?? speed;
    gl.uniform1f(
      timeLoc,
      ((performance.now() - startTimeRef.current) / 1000) * actualSpeed,
    );
  }
  gl.uniform1f(getLoc("u_energy"), avg * sensitivity);

  const fixMode =
    whiteCircleFixRef.current === "original"
      ? 0
      : whiteCircleFixRef.current === "energy"
        ? 1
        : 2;
  const fixModeLoc = getLoc("u_fixMode");
  if (fixModeLoc) gl.uniform1i(fixModeLoc, fixMode);

  const beatLoc = getLoc("u_beat");
  if (beatLoc) {
    const currentBeatData = beatDataRef.current;
    const beatIntensity = currentBeatData
      ? currentBeatData.beatIntensity
      : avg * sensitivity;

    if (whiteCircleFixRef.current === "clamp") {
      // Pass normalized instantaneous intensity for Alternative Fix
      gl.uniform1f(beatLoc, Math.min(1.0, beatIntensity));
    } else {
      // Pass cumulative beat for Original and Energy modes
      if (currentBeatData)
        beatRef.current += currentBeatData.beatIntensity * 0.2;
      else beatRef.current += avg * sensitivity * 0.1;
      gl.uniform1f(beatLoc, beatRef.current);
    }
  }
  // Rotate: 360 degrees to radians
  const rotateValue = cfg.rotate ?? 0;
  const radians = (rotateValue * Math.PI) / 180;
  gl.uniform1f(getLoc("u_rotate"), radians);

  gl.uniform1i(getLoc("u_flipH"), cfg.flip_horizontal ? 1 : 0);
  gl.uniform1i(getLoc("u_flipV"), cfg.flip_vertical ? 1 : 0);
  gl.uniform1f(getLoc("u_brightness"), brightness);

  const primaryColor = cfg.primaryColor
    ? hexToRgb(cfg.primaryColor)
    : themeColorsRef.current.primary;
  const secondaryColor = cfg.secondaryColor
    ? hexToRgb(cfg.secondaryColor)
    : themeColorsRef.current.secondary;
  gl.uniform3f(
    getLoc("u_primaryColor"),
    primaryColor[0],
    primaryColor[1],
    primaryColor[2],
  );
  gl.uniform3f(
    getLoc("u_secondaryColor"),
    secondaryColor[0],
    secondaryColor[1],
    secondaryColor[2],
  );

  const freqBands = frequencyBandsRef.current;
  const bass = freqBands?.bass ?? avg,
    mid = freqBands?.mid ?? avg,
    high = freqBands?.high ?? avg;
  gl.uniform1f(getLoc("u_bass"), bass * sensitivity);
  gl.uniform1f(getLoc("u_mid"), mid * sensitivity);
  gl.uniform1f(getLoc("u_high"), high * sensitivity);

  // Volume normalization uniforms
  const volData = volumeDataRef.current;
  const vtLoc = getLoc("u_volumeTime");
  if (vtLoc) gl.uniform1f(vtLoc, volData?.stream ?? 0);
  const viLoc = getLoc("u_volumeIntensity");
  if (viLoc) gl.uniform1f(viLoc, volData?.intensity ?? 0);
  const vnLoc = getLoc("u_volumeNorm");
  if (vnLoc) gl.uniform1f(vnLoc, volData?.normalized ?? 0);

  const glowMode = outerGlowModeRef.current === "original" ? 0 : 1;
  const glowLoc = getLoc("u_outerGlowMode");
  if (glowLoc) gl.uniform1i(glowLoc, glowMode);

  // Game of Life
  gl.uniform1f(
    getLoc("u_cellSize"),
    cfg.cell_size ?? cfg.base_game_speed ?? 8.0,
  );
  gl.uniform1f(
    getLoc("u_injectBeat"),
    beatDataRef.current?.isBeat && cfg.beat_inject !== false ? 1.0 : 0.0,
  );

  // Digital Rain
  gl.uniform1f(getLoc("u_density"), cfg.count ?? cfg.density ?? 1.9);
  const spdLoc = getLoc("u_speed");
  if (spdLoc) {
    const s = cfg.add_speed
      ? cfg.add_speed / 20.0
      : cfg.run_seconds
        ? 2.0 / cfg.run_seconds
        : 1.5;
    gl.uniform1f(spdLoc, s);
  }
  gl.uniform1f(getLoc("u_tailLength"), (cfg.tail ?? 67) / 100.0);
  gl.uniform1f(
    getLoc("u_glowIntensity"),
    cfg.multiplier ? cfg.multiplier / 10.0 : 1.0,
  );

  // Flame
  const lcLoc = getLoc("u_lowColor");
  if (lcLoc) {
    const c = hexToRgb(cfg.low_band ?? cfg.low_color ?? "#FF4400");
    gl.uniform3f(lcLoc, c[0], c[1], c[2]);
  }
  const mcLoc = getLoc("u_midColor");
  if (mcLoc) {
    const c = hexToRgb(cfg.mid_band ?? cfg.mid_color ?? "#FFAA00");
    gl.uniform3f(mcLoc, c[0], c[1], c[2]);
  }
  const hcLoc = getLoc("u_highColor");
  if (hcLoc) {
    const c = hexToRgb(cfg.high_band ?? cfg.high_color ?? "#FFFF00");
    gl.uniform3f(hcLoc, c[0], c[1], c[2]);
  }
  gl.uniform1f(getLoc("u_intensity"), cfg.intensity ?? 1.0);
  gl.uniform1f(getLoc("u_wobble"), cfg.wobble ?? 0.1);

  // Plasma
  gl.uniform1f(getLoc("u_twist"), cfg.twist ?? 0.1);

  // Equalizer
  gl.uniform1f(getLoc("u_bands"), cfg.bands ?? 16.0);
  gl.uniform1f(getLoc("u_ringMode"), cfg.ring || cfg.ring_mode ? 1.0 : 0.0);
  gl.uniform1f(
    getLoc("u_centerMode"),
    cfg.center || cfg.center_mode ? 1.0 : 0.0,
  );
  const sLoc = getLoc("u_spin");
  if (sLoc) {
    if (cfg.spin || cfg.spin_enabled)
      beatRef.current += bass * (cfg.spin_multiplier ?? 1.0) * 0.05;
    gl.uniform1f(sLoc, beatRef.current);
  }

  // Gradient support
  handleGradients(gl, cfg);

  const melBankLoc = getLoc("u_melbank");
  if (melBankLoc && data.length > 0) {
    if (!melbankTextureRef.current)
      melbankTextureRef.current = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, melbankTextureRef.current);

    if (
      !melbankArrayRef.current ||
      melbankArrayRef.current.length !== data.length
    ) {
      melbankArrayRef.current = new Uint8Array(data.length);
    }
    const texData = melbankArrayRef.current;
    for (let i = 0; i < data.length; i++)
      texData[i] = Math.min(255, Math.max(0, data[i] * 255 * sensitivity));
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      data.length,
      1,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      texData,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(melBankLoc, 0);
  }

  // Remaining uniforms
  gl.uniform1f(getLoc("u_zoom"), cfg.zoom ?? cfg.stretch ?? 3.0);
  gl.uniform1f(getLoc("u_audioZoom"), cfg.multiplier ?? cfg.audio_zoom ?? 1.0);
  gl.uniform1f(getLoc("u_blur"), cfg.mask_cutoff ?? cfg.blur ?? 0.5);
  gl.uniform1f(getLoc("u_mirrors"), cfg.screen ?? cfg.mirrors ?? 2.0);
  gl.uniform1f(
    getLoc("u_flip"),
    cfg.align === "invert" || cfg.flip ? 1.0 : 0.0,
  );
  gl.uniform1f(
    getLoc("u_blockSize"),
    cfg.block_count ?? cfg.block_size ?? 10.0,
  );
  gl.uniform1f(
    getLoc("u_keys"),
    cfg.stretch_horizontal / 6.25 || (cfg.keys ?? 16.0),
  );
  if (currentVisualType === "radial")
    gl.uniform1f(getLoc("u_bands"), cfg.edges || cfg.bands || 32.0);
  if (currentVisualType === "bands")
    gl.uniform1f(getLoc("u_bands"), cfg.band_count || cfg.bands || 16.0);
  if (currentVisualType === "waterfall") {
    gl.uniform1f(getLoc("u_bands"), cfg.bands || 16.0);
    gl.uniform1f(getLoc("u_speed"), 3.0 / cfg.drop_secs || (cfg.speed ?? 1.0));
  }

  const bgcLoc = getLoc("u_bgColor");
  if (bgcLoc) {
    const c = hexToRgb(cfg.bg_color ?? cfg.backgroundColor ?? "#000000");
    gl.uniform3f(bgcLoc, c[0], c[1], c[2]);
  }
  gl.uniform1f(
    getLoc("u_backgroundBrightness"),
    cfg.background_brightness ?? 1.0,
  );
  gl.uniform1f(getLoc("u_multiplier"), cfg.multiplier ?? 0.5);
  gl.uniform1f(getLoc("u_minSize"), cfg.min_size ?? 0.3);
  gl.uniform1f(
    getLoc("u_frequencyRange"),
    typeof cfg.frequency_range === "number" ? cfg.frequency_range : 0.0,
  );
  gl.uniform1f(getLoc("u_clip"), cfg.clip ? 1.0 : 0.0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.disableVertexAttribArray(posLoc);
}
