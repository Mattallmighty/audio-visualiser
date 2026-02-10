export interface StoreUIState {
  showOverlays: boolean
  fullScreen: boolean
  showFxPanel: boolean
  saveError: string | null
}

export interface StoreUIActions {
  setShowOverlays: (show: boolean) => void
  toggleOverlays: () => void
  setFullScreen: (fullScreen: boolean) => void
  setShowFxPanel: (show: boolean) => void
  setSaveError: (error: string | null) => void
}

const storeUI = (set: any) => ({
  // State
  showOverlays: true,
  fullScreen: false,
  showFxPanel: false,
  saveError: null,

  // Actions
  setShowOverlays: (show: boolean) => set({ showOverlays: show }),
  toggleOverlays: () => set((state: any) => ({ showOverlays: !state.showOverlays })),
  setFullScreen: (fullScreen: boolean) => set({ fullScreen }),
  setShowFxPanel: (show: boolean) => set({ showFxPanel: show }),
  setSaveError: (error: string | null) => set({ saveError: error })
})

export default storeUI
