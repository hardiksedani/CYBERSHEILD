import { create } from 'zustand'

export const useScanStore = create((set) => ({
  scanResults: [],
  isScanning: false,
  currentScan: null,
  license: { tier: 'free', email: '' },
  
  setScanResults: (results) => set({ scanResults: results }),
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  setCurrentScan: (scan) => set({ currentScan: scan }),
  setLicense: (license) => set({ license }),
  
  addScanResult: (result) => set((state) => ({
    scanResults: [result, ...state.scanResults].slice(0, 50)
  })),
  
  clearResults: () => set({ scanResults: [], currentScan: null })
}))
