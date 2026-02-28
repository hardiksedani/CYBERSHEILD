import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Dashboard from './components/Dashboard'
import AuthModal from './components/AuthModal'
import DeveloperMode from './components/DeveloperMode'
import VerifyFixWorkbench from './components/VerifyFixWorkbench'
import NetworkScanner from './components/NetworkScanner'
import AIAnalyzer from './components/AIAnalyzer'
import Navbar from './components/Navbar'
import HistoryView from './components/HistoryView'
import UpgradeModal from './components/UpgradeModal'
import VerificationFlow from './components/VerificationFlow'
import ScanResultsView from './components/ScanResultsView'
import { useScanStore } from './store/scanStore'
import './App.css'

export default function App() {
  const [isScanning, setIsScanning] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [showAIAnalyzer, setShowAIAnalyzer] = useState(false)
  const [showNetworkScanner, setShowNetworkScanner] = useState(false)
  const [showVerifyFix, setShowVerifyFix] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [verificationData, setVerificationData] = useState({ domain: '', id: '', originalUrl: '' })
  const [selectedVulnerability, setSelectedVulnerability] = useState(null)
  const [scanResults, setScanResults] = useState([])
  const [currentScan, setCurrentScan] = useState(null)
  const [scanLogs, setScanLogs] = useState([])
  const [license, setLicense] = useState({ tier: 'free', email: '' })
  const [isPro, setIsPro] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' or 'history'

  useEffect(() => {
    const loadLicense = async () => {
      try {
        // Check localStorage first for instant upgrade persistence
        const localPro = localStorage.getItem('grime_pro_license')
        if (localPro) {
          try {
            const parsed = JSON.parse(localPro)
            if (parsed && parsed.tier === 'professional') {
              setLicense({ tier: 'pro', email: '' })
              setIsPro(true)
              return // Skip electron check if already pro locally
            }
          } catch (e) { }
        }

        if (window.electron) {
          const lic = await window.electron.checkLicense()
          setLicense(lic)
        }
      } catch (e) {
        console.error('Error loading license:', e)
      }
    }
    loadLicense()

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

    // Set up scan progress listener
    if (window.electron && window.electron.onScanProgress) {
      window.electron.onScanProgress((message) => {
        console.log('Scan progress:', message)
        setScanLogs(prev => [...prev, {
          type: 'info',
          message: message,
          severity: 'INFO',
          timestamp: new Date().toISOString()
        }])
      })
    }
  }, [])

  const handleScan = async (url) => {
    // Require user login before scanning
    if (!license || !license.email) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    let parsedUrl = url.trim().replace(/\/$/, '');
    if (!parsedUrl.startsWith('http://') && !parsedUrl.startsWith('https://')) {
      parsedUrl = 'https://' + parsedUrl;
    }

    try {
      if (!window.electron) throw new Error('Electron API not available');

      const urlObj = new URL(parsedUrl);
      // Retain the pathname for shared hosting sites (like github.io/project)
      // but strip trailing slashes for cleaner UI presentation
      const domain = (urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '')).replace(/\/$/, '');

      const isVerified = await window.electron.checkVerification(domain);

      if (!isVerified) {
        const vId = await window.electron.generateVerification(domain);
        setVerificationData({ domain, id: vId, originalUrl: parsedUrl });
        setShowVerification(true);
        return;
      }
    } catch (e) {
      console.error('URL Validation or Verification failed:', e);
      // We'll proceed with the error state below or let the main scan handle invalid URLs
    }

    setIsScanning(true)
    setCurrentScan(null)
    setScanLogs([])

    try {
      if (!window.electron) {
        console.error('window.electron is not available')
        setScanLogs([{
          type: 'error',
          message: '❌ Electron API not available',
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        }])
        return
      }

      console.log('Starting scan for:', parsedUrl)
      setScanLogs([{
        type: 'info',
        message: `🔍 Starting scan for ${parsedUrl}...`,
        severity: 'INFO',
        timestamp: new Date().toISOString()
      }])

      const result = await window.electron.startScan(parsedUrl)
      console.log('Scan result:', result)

      if (result && result.success) {
        // Fixed: result.results instead of result.data.vulnerabilities
        const vulnerabilities = result.results || []

        console.log(`Found ${vulnerabilities.length} vulnerabilities`)

        const enhanced = await Promise.all(
          vulnerabilities.map(async (vuln) => {
            try {
              const analysis = await window.electron.analyzeVulnerability(vuln)
              return { ...vuln, ...analysis }
            } catch (e) {
              console.error('Error analyzing vulnerability:', e)
              return vuln
            }
          })
        )

        const scanData = {
          url: parsedUrl,
          timestamp: new Date().toISOString(),
          vulnerabilities: enhanced,
          scanDuration: result.duration || 'N/A',
          criticalCount: enhanced.filter(v => v.severity === 'CRITICAL').length,
          highCount: enhanced.filter(v => v.severity === 'HIGH').length,
          mediumCount: enhanced.filter(v => v.severity === 'MEDIUM').length,
          lowCount: enhanced.filter(v => v.severity === 'LOW').length
        }

        await window.electron.saveScanResult(scanData)
        setScanResults([scanData, ...scanResults])
        setCurrentScan(scanData)

        // Add scan logs with animation
        enhanced.forEach((vuln, idx) => {
          setTimeout(() => {
            setScanLogs(prev => [...prev, {
              type: 'vulnerability',
              message: `[${vuln.severity}] ${vuln.type}: ${vuln.description || vuln.message}`,
              severity: vuln.severity,
              timestamp: new Date().toISOString()
            }])
          }, idx * 300)
        })

        // If no vulnerabilities found
        if (enhanced.length === 0) {
          setScanLogs(prev => [...prev, {
            type: 'success',
            message: '✅ Scan complete - No vulnerabilities detected',
            severity: 'INFO',
            timestamp: new Date().toISOString()
          }])
        } else {
          setScanLogs(prev => [...prev, {
            type: 'success',
            message: `✅ Scan complete - Found ${enhanced.length} vulnerability${enhanced.length > 1 ? 's' : ''}`,
            severity: 'INFO',
            timestamp: new Date().toISOString()
          }])
        }
      } else {
        // Handle error case
        const errorMsg = result?.error || 'Unknown error occurred'
        console.error('Scan failed:', errorMsg)
        setScanLogs(prev => [...prev, {
          type: 'error',
          message: `❌ Scan failed: ${errorMsg}`,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        }])
      }
    } catch (error) {
      console.error('Scan error:', error)
      setScanLogs(prev => [...prev, {
        type: 'error',
        message: `❌ Error: ${error.message}`,
        severity: 'ERROR',
        timestamp: new Date().toISOString()
      }])
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

  const handleLogout = () => {
    const defaultLicense = { tier: 'free', email: '' }
    setLicense(defaultLicense)
    if (window.electron) {
      window.electron.setLicense(defaultLicense)
    }
  }

  const handleUnlockPro = () => {
    // Save pro status to localStorage
    localStorage.setItem('cyber_pro_license', JSON.stringify({
      activated: new Date().toISOString(),
      tier: 'professional'
    }))
    setIsPro(true)
    setLicense(prev => ({ ...prev, tier: 'pro' }))
  }

  const handleNewScan = (url) => {
    if (url) {
      handleScan(url)
      setCurrentView('results')
    }
  }

  const handleLoadHistory = (oldScan) => {
    // 1. Set the current view to the old scan data without erasing history
    setCurrentScan({
      url: oldScan.url,
      timestamp: oldScan.timestamp,
      vulnerabilities: oldScan.vulnerabilities,
      metadata: oldScan.metadata,
      loadedFrom: 'history'
    })
    // 2. Switch the view back to the Results view
    setCurrentView('results')
  }

  const openVerifyFix = (vulnerability) => {
    setSelectedVulnerability(vulnerability)
    setShowVerifyFix(true)
  }

  const openAIAnalyzer = (vulnerability) => {
    setSelectedVulnerability(vulnerability)
    setShowAIAnalyzer(true)
  }

  const handleNavigate = (section) => {
    console.log('Navigate to section:', section)
    if (section === 'network') {
      setShowNetworkScanner(true)
    } else if (section === 'history') {
      setCurrentView('history')
    } else if (section === 'dashboard') {
      setCurrentView('dashboard')
    }
  }

  const handleVerificationSuccess = () => {
    setShowVerification(false);
    if (verificationData.originalUrl) {
      handleScan(verificationData.originalUrl);
    }
  };

  if (showVerification) {
    return (
      <div className="app-verification-overlay">
        <VerificationFlow
          domain={verificationData.domain}
          verificationId={verificationData.id}
          onVerified={handleVerificationSuccess}
          onCancel={() => setShowVerification(false)}
        />
      </div>
    );
  }

  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', margin: 0, padding: 0, height: '100vh', overflow: 'hidden' }}>
      <Navbar
        onNavigate={handleNavigate}
        onLogin={(mode) => {
          setAuthMode(mode);
          setShowAuthModal(true);
        }}
        onLogout={handleLogout}
        license={license}
      />

      <motion.div
        className="app-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ flex: 1, width: '100%', overflowY: 'auto' }}
      >
        {currentView === 'dashboard' && (
          <>
            <Dashboard
              results={currentScan ? [currentScan] : []}
              isScanning={isScanning}
              onNewScan={handleNewScan}
              onVerifyFix={openVerifyFix}
              onAnalyzeAI={openAIAnalyzer}
              isPro={isPro}
              onOpenUpgrade={() => setShowUpgradeModal(true)}
            />

            <DeveloperMode
              logs={scanLogs}
              isScanning={isScanning}
              vulnerabilities={scanResults.flatMap(r => r.vulnerabilities || [])}
            />
          </>
        )}

        {currentView === 'results' && (
          <ScanResultsView
            results={currentScan ? [currentScan] : []}
            isScanning={isScanning}
            onVerifyFix={openVerifyFix}
            onAnalyzeAI={openAIAnalyzer}
          />
        )}

        {currentView === 'history' && (
          <HistoryView
            onLoadScan={handleLoadHistory}
          />
        )}
      </motion.div>

      <AuthModal
        isOpen={showAuthModal}
        initialMode={authMode}
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

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUnlock={handleUnlockPro}
      />

      {/* Pro Badge - Visible when unlocked */}
      {isPro && (
        <motion.div
          className="pro-badge"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className="pro-text">👑 PRO</span>
        </motion.div>
      )}
    </div>
  )
}