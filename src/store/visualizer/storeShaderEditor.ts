import { gifFragmentShader, volumeTemplateShader } from '../../engines/webgl/shaders'

export { volumeTemplateShader }

export interface StoreShaderEditorState {
  showCode: boolean
  shaderCode: string
  activeCustomShader: string | undefined
}

export interface StoreShaderEditorActions {
  setShowCode: (show: boolean) => void
  toggleShaderEditor: () => void
  setShaderCode: (code: string) => void
  setActiveCustomShader: (shader: string | undefined) => void
  loadShaderTemplate: () => void
}

const storeShaderEditor = (set: any) => ({
  // State
  showCode: false,
  shaderCode: gifFragmentShader,
  activeCustomShader: undefined,

  // Actions
  setShowCode: (show: boolean) => set({ showCode: show }),
  toggleShaderEditor: () => set((state: any) => ({ showCode: !state.showCode })),
  setShaderCode: (code: string) => set({ shaderCode: code }),
  setActiveCustomShader: (shader: string | undefined) => set({ activeCustomShader: shader }),
  loadShaderTemplate: () => set({ shaderCode: volumeTemplateShader }),
})

export default storeShaderEditor
