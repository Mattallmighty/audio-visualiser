import type React from 'react'
import { parseGradient } from '../../utils/gradient'

export interface TextLayerState {
  aspect: number
  texW: number
  texH: number
}

export interface HandleGradientsParams {
  gl: WebGLRenderingContext
  cfg: any
  gradientTextureRef: React.MutableRefObject<WebGLTexture | null>
  currentGradientStrRef: React.MutableRefObject<string | null>
  gradientTexture2Ref: React.MutableRefObject<WebGLTexture | null>
  currentGradient2StrRef: React.MutableRefObject<string | null>
  startTimeRef: React.MutableRefObject<number>
  getLoc: (name: string) => WebGLUniformLocation | null
}

export function handleGradients(params: HandleGradientsParams): void {
  const {
    gl,
    cfg,
    gradientTextureRef,
    currentGradientStrRef,
    gradientTexture2Ref,
    currentGradient2StrRef,
    startTimeRef,
    getLoc,
  } = params

  // Layer 1
  const useGradLoc = getLoc('u_useGradient')
  const gradLoc = getLoc('u_gradient')
  const gradRollLoc = getLoc('u_gradientRoll')

  if (gradLoc && cfg.gradient) {
    if (!gradientTextureRef.current) {
      gradientTextureRef.current = gl.createTexture()
      currentGradientStrRef.current = null
    }
    if (currentGradientStrRef.current !== cfg.gradient) {
      const gradData = parseGradient(cfg.gradient); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, gradientTextureRef.current)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, gradData)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      currentGradientStrRef.current = cfg.gradient
    }
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, gradientTextureRef.current); gl.uniform1i(gradLoc, 1)
    if (useGradLoc) gl.uniform1i(useGradLoc, 1)
    if (gradRollLoc) {
      const rollSpeed = cfg.gradient_roll ?? 0
      gl.uniform1f(gradRollLoc, ((performance.now() - startTimeRef.current) / 1000 * rollSpeed) % 1.0)
    }
  } else if (useGradLoc) {
    gl.uniform1i(useGradLoc, 0)
  }

  // Layer 2 (BladeTexter)
  const useGrad2Loc = getLoc('u_useGradient2')
  const grad2Loc = getLoc('u_gradient2')
  const gradRoll2Loc = getLoc('u_gradientRoll2')

  if (grad2Loc && cfg.gradient2) {
    if (!gradientTexture2Ref.current) {
      gradientTexture2Ref.current = gl.createTexture()
      currentGradient2StrRef.current = null
    }
    if (currentGradient2StrRef.current !== cfg.gradient2) {
      const gradData = parseGradient(cfg.gradient2); gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, gradientTexture2Ref.current)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, gradData)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      currentGradient2StrRef.current = cfg.gradient2
    }
    gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, gradientTexture2Ref.current); gl.uniform1i(grad2Loc, 4)
    if (useGrad2Loc) gl.uniform1i(useGrad2Loc, 1)
    if (gradRoll2Loc) {
      const rollSpeed = cfg.gradient_roll2 ?? 0
      gl.uniform1f(gradRoll2Loc, ((performance.now() - startTimeRef.current) / 1000 * rollSpeed) % 1.0)
    }
  } else if (useGrad2Loc) {
    gl.uniform1i(useGrad2Loc, 0)
  }
}

export interface HandleTextTextureParams {
  gl: WebGLRenderingContext
  cfg: any
  textAutoFitRef: React.MutableRefObject<boolean>
  offscreenCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>
  textTextureRef: React.MutableRefObject<WebGLTexture | null>
  currentTextKeyRef: React.MutableRefObject<string | null>
  textStateRef: React.MutableRefObject<TextLayerState>
  textTexture2Ref: React.MutableRefObject<WebGLTexture | null>
  currentTextKey2Ref: React.MutableRefObject<string | null>
  textState2Ref: React.MutableRefObject<TextLayerState>
  visualTypeRef: React.MutableRefObject<string>
  getLoc: (name: string) => WebGLUniformLocation | null
}

export function handleTextTexture(params: HandleTextTextureParams): void {
  const {
    gl,
    cfg,
    textAutoFitRef,
    offscreenCanvasRef,
    textTextureRef,
    currentTextKeyRef,
    textStateRef,
    textTexture2Ref,
    currentTextKey2Ref,
    textState2Ref,
    visualTypeRef,
    getLoc,
  } = params

  const fontSize = 180
  const canvasW = gl.canvas ? gl.canvas.width : 1000
  const canvasH = gl.canvas ? gl.canvas.height : 500
  const texW = Math.max(2000, canvasW * 2)
  const texH = Math.max(1000, canvasH * 2)

  const processLayer = (
    idx: number,
    text: string,
    font: string,
    color: string,
    textureRef: React.MutableRefObject<WebGLTexture | null>,
    keyRef: React.MutableRefObject<string | null>,
    stateRef: React.MutableRefObject<TextLayerState>
  ) => {
    const key = `${text}-${font}-${color}-${textAutoFitRef.current ? 'autofit' : 'fixed'}-${texW}x${texH}`
    const texUnit = idx === 1 ? gl.TEXTURE2 : gl.TEXTURE3

    const drawTextToTexture = () => {
      if (!textureRef.current) textureRef.current = gl.createTexture()
      if (!offscreenCanvasRef.current) offscreenCanvasRef.current = document.createElement('canvas')
      const outCanvas = offscreenCanvasRef.current

      const ctx = outCanvas.getContext('2d')
      if (ctx) {
        ctx.font = `${fontSize}px "${font}", Arial`
        const metrics = ctx.measureText(text)
        let targetW = texW
        if (textAutoFitRef.current) {
          targetW = Math.max(2000, metrics.width + 100)
        }

        outCanvas.width = targetW
        outCanvas.height = texH

        // Reset context properties after resize
        ctx.clearRect(0, 0, targetW, texH)
        ctx.font = `${fontSize}px "${font}", Arial`
        ctx.fillStyle = color
        ctx.textBaseline = 'top'
        ctx.textAlign = 'left'
        ctx.fillText(text, 0, 0)

        gl.activeTexture(texUnit)
        gl.bindTexture(gl.TEXTURE_2D, textureRef.current)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, outCanvas)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        stateRef.current.aspect = targetW / texH
      }
    }

    if (keyRef.current !== key || stateRef.current.texW !== texW) {
      keyRef.current = key
      stateRef.current.texW = texW
      stateRef.current.texH = texH
      if (document.fonts && document.fonts.load) {
        document.fonts.load(`${fontSize}px "${font}"`).then(() => drawTextToTexture())
      } else {
        drawTextToTexture()
      }
    }

    const locName = idx === 1 ? 'u_textTexture' : 'u_textTexture2'
    const aspectName = idx === 1 ? 'u_textAspect' : 'u_textAspect2'
    const textLoc = getLoc(locName)
    if (textLoc) {
      gl.activeTexture(texUnit)
      gl.bindTexture(gl.TEXTURE_2D, textureRef.current)
      gl.uniform1i(textLoc, idx === 1 ? 2 : 3)
      gl.uniform1f(getLoc(aspectName), stateRef.current.aspect)
    }
  }

  processLayer(1, cfg.text || 'LedFx', cfg.font || 'Press Start 2P', cfg.text_color || '#FFFFFF', textTextureRef, currentTextKeyRef, textStateRef)
  if (visualTypeRef.current === 'bladeTexter') {
    processLayer(2, cfg.text2 || 'LedFx', cfg.font2 || 'Press Start 2P', cfg.text_color2 || '#FFFFFF', textTexture2Ref, currentTextKey2Ref, textState2Ref)
  }
}
