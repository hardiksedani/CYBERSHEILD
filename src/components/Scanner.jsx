import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Eye, Copy, LogOut, Wifi } from 'lucide-react'
import './Scanner.css'

export default function Scanner({ onScan, isScanning, license, onLicenseClick, onNetworkScannerClick }) {
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')

  const validateURL = (input) => {
    try {
      const urlObj = new URL(input.startsWith('http') ? input : `https://${input}`)
      return urlObj.href
    } catch (e) {
      return null
    }
  }

  const handleScan = async () => {
    const validatedURL = validateURL(url)
    
    if (!validatedURL) {
      setUrlError('Invalid URL. Use format: example.com or https://example.com')
      return
    }

    setUrlError('')
    onScan(validatedURL)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isScanning) {
      handleScan()
    }
  }

  return (
    <div className="scanner-panel">
      {/* Scanner Header */}
      <motion.div 
        className="scanner-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>URL Scanner</h2>
        <div className="license-badge" onClick={onLicenseClick}>
          <span className={`tier ${license.tier}`}>{license.tier.toUpperCase()}</span>
          {license.email && <span className="email">{license.email}</span>}
        </div>
      </motion.div>

      {/* Input Area */}
      <motion.div 
        className="scanner-form"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="input-group">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setUrlError('')
            }}
            onKeyPress={handleKeyPress}
            placeholder="https://example.com"
            disabled={isScanning}
            className={`url-input ${urlError ? 'error' : ''}`}
          />
          <button 
            onClick={handleScan}
            disabled={isScanning || !url}
            className="btn-scan"
          >
            <Zap size={18} />
            {isScanning ? 'SCANNING...' : 'SCAN'}
          </button>
        </div>
        {urlError && <p className="error-message">{urlError}</p>}
      </motion.div>

      {/* Quick Tips */}
      <motion.div 
        className="quick-tips"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3>Scan Capabilities</h3>
        <ul>
          <li><Zap size={14} /> XSS Injection Detection</li>
          <li><Zap size={14} /> CSRF Token Validation</li>
          <li><Zap size={14} /> Security Headers Check</li>
          <li><Zap size={14} /> SQL Injection Testing</li>
          <li><Zap size={14} /> CORS Misconfiguration</li>
          <li><Zap size={14} /> Authentication Issues</li>
        </ul>
      </motion.div>

      {/* History Section */}
      <motion.div 
        className="history-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="btn-action" title="View Scan History">
            <Eye size={16} /> History
          </button>
          <button className="btn-action" title="Network Scanner">
            <Wifi size={16} /> Network
          </button>
          <button className="btn-action" onClick={onNetworkScannerClick} title="Scan Network Infrastructure">
            <Wifi size={16} /> Infrastructure
          </button>
          <button className="btn-action" title="Export Results">
            <Copy size={16} /> Export
          </button>
        </div>
      </motion.div>

      {/* Pro Features */}
      {license.tier === 'free' && (
        <motion.div 
          className="upgrade-banner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="upgrade-content">
            <h4>Unlock Pro Features</h4>
            <p>PDF Reports • Bulk Scanning • API Access</p>
          </div>
          <button className="btn-upgrade" onClick={onLicenseClick}>
            Upgrade
          </button>
        </motion.div>
      )}
    </div>
  )
}
