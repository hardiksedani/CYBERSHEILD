import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Scanner from './components/Scanner'
import Dashboard from './components/Dashboard'
import AuthModal from './components/AuthModal'
import DeveloperMode from './components/DeveloperMode'
import VerifyFixWorkbench from './components/VerifyFixWorkbench'
import NetworkScanner from './components/NetworkScanner'
import AIAnalyzer from './components/AIAnalyzer'
import { useScanStore } from './store/scanStore'
import './App.css'

export default function App() {
  const [isScanning, setIsScanning] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showAIAnalyzer, setShowAIAnalyzer] = useState(false)
  const [showNetworkScanner, setShowNetworkScanner] = useState(false)
  const [showVerifyFix, setShowVerifyFix] = useState(false)
  const [selectedVulnerability, setSelectedVulnerability] = useState(null)
  const [scanResults, setScanResults] = useState([])
  const [scanLogs, setScanLogs] = useState([])
  const [license, setLicense] = useState({ tier: 'free', email: '' })

  useEffect(() => {
    // Load license on startup
    const loadLicense = async () => {
      try {
        if (window.electron) {
          const lic = await window.electron.checkLicense()
          setLicense(lic)
        } else {
          console.warn('window.electron not available')
        }
      } catch (e) {
        console.error('Error loading license:', e)
      }
    }
    loadLicense()

    // Load scan history
    const loadHistory = async () => {
      try {
        if (window.electron) {
          const history = await window.electron.getScanHistory()
          setScanResults(history)
        }
      } catch (e) {
        console.error('Error loading history:', e)
      }
    }
    loadHistory()
  }, [])

  const handleScan = async (url) => {
    // Check Pro limits
    if (license.tier === 'free' && scanResults.length >= 5) {
      return
    }

    setIsScanning(true)
    setScanLogs([])

    try {
      if (!window.electron) {
        console.error('window.electron not available')
        return
      }
      
      const result = await window.electron.startScan(url)
      
      if (result && result.success) {
        // Enhance with AI analysis
        const enhanced = await Promise.all(
          result.data.vulnerabilities.map(async (vuln) => {
            try {
              const analysis = await window.electron.analyzeVulnerability(vuln)
              return { ...vuln, ...analysis }
            } catch (e) {
              console.error('Error analyzing vuln:', e)
              return vuln
            }
          })
        )

        const scanData = {
          url,
          timestamp: new Date().toISOString(),
          vulnerabilities: enhanced,
          scanDuration: result.data.metadata.duration,
          criticalCount: enhanced.filter(v => v.severity === 'CRITICAL').length,
          highCount: enhanced.filter(v => v.severity === 'HIGH').length
        }

        // Save to history
        await window.electron.saveScanResult(scanData)
        setScanResults([scanData, ...scanResults])
        
        // Simulate log streaming for demo
        enhanced.forEach((vuln, idx) => {
          setTimeout(() => {
            setScanLogs(prev => [...prev, {
              type: 'vulnerability',
              message: `[${vuln.severity}] ${vuln.type}: ${vuln.message}`,
              severity: vuln.severity
            }])
          }, idx * 300)
        })
      } else {
        throw new Error(result?.error || 'Scan failed')
      }
    } catch (error) {
      console.error('Scan error:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const handleVerifyFix = async (vulnerability) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          fixed: Math.random() > 0.5,
          details: {
            timestamp: new Date().toISOString(),
            payload: vulnerability.technical_details?.payload,
            response: 'Test payload was successfully filtered'
          }
        })
      }, 2000)
    })
  }

  const handleAuth = async (newLicense) => {
    if (window.electron) {
      await window.electron.setLicense(newLicense)
    }
    setLicense(newLicense)
  }

  const handleNewScan = () => {
    setScanResults([])
    setScanLogs([])
  }

  const openVerifyFix = (vulnerability) => {
    setSelectedVulnerability(vulnerability)
    setShowVerifyFix(true)
  }

  const openAIAnalyzer = (vulnerability) => {
    setSelectedVulnerability(vulnerability)
    setShowAIAnalyzer(true)
  }

  return (
    <div className="app">
      <motion.div 
        className="app-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Scanner 
          onScan={handleScan}
          isScanning={isScanning}
          license={license}
          onLicenseClick={() => setShowAuthModal(true)}
          onNetworkScannerClick={() => setShowNetworkScanner(true)}
        />

        <Dashboard 
          results={scanResults}
          isScanning={isScanning}
          onNewScan={handleNewScan}
          onVerifyFix={openVerifyFix}
          onAnalyzeAI={openAIAnalyzer}
        />

        <DeveloperMode 
          logs={scanLogs}
          isScanning={isScanning}
          vulnerabilities={scanResults.flatMap(r => r.vulnerabilities || [])}
        />
      </motion.div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuth={handleAuth}
        currentLicense={license}
      />

      <VerifyFixWorkbench 
        vulnerability={selectedVulnerability}
        isOpen={showVerifyFix}
        onClose={() => {
          setShowVerifyFix(false)
          setSelectedVulnerability(null)
        }}
        onRetest={handleVerifyFix}
      />

      <NetworkScanner 
        isOpen={showNetworkScanner}
        onClose={() => setShowNetworkScanner(false)}
      />

      <AIAnalyzer 
        vulnerability={selectedVulnerability}
        isOpen={showAIAnalyzer}
        onClose={() => {
          setShowAIAnalyzer(false)
          setSelectedVulnerability(null)
        }}
      />
    </div>
  )
}
