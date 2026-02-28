import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, AlertCircle, CheckCircle2, Zap, Globe, Wifi, RefreshCw, ChevronDown } from 'lucide-react'
import './NetworkScanner.css'

export default function NetworkScanner({ isOpen, onClose }) {
  const [localIP, setLocalIP] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanResults, setScanResults] = useState(null)
  const [showDetailedView, setShowDetailedView] = useState(false)

  // Auto-scan when component opens
  useEffect(() => {
    if (isOpen) {
      performAutoScan()
    }
  }, [isOpen])

  const performAutoScan = async () => {
    setScanning(true)
    setScanResults(null)
    setShowDetailedView(false)

    try {
      if (window.electron) {
        // First get the local IP
        const ipResult = await window.electron.getLocalIP()
        if (ipResult && ipResult.data) {
          const ip = ipResult.data.ip
          setLocalIP(ip)

          // Then scan that IP
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Scan timeout - took too long')), 30000)
          )
          const scanPromise = window.electron.scanLocalNetwork()
          const result = await Promise.race([scanPromise, timeoutPromise])
          
          if (result && (result.success || result.data)) {
            const data = result.data || result
            setScanResults({
              ip: data.ip || ip,
              hostname: data.hostname || ip,
              deviceType: data.deviceType || 'Device',
              deviceIcon: data.deviceIcon || '🖥️',
              status: data.status || 'online',
              services: data.services || [],
              openPorts: data.openPorts || [],
              vulnerabilities: data.vulnerabilities || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
              issueCount: data.issueCount || 0,
              issues: data.issues || []
            })
          } else {
            console.error('Scan failed:', result?.error)
          }
        }
      }
    } catch (error) {
      console.error('Auto-scan error:', error)
    } finally {
      setScanning(false)
    }
  }

  const handleRescan = async () => {
    await performAutoScan()
  }

  const handleDetailedScan = () => {
    setShowDetailedView(true)
  }

  const handleCloseDetailed = () => {
    setShowDetailedView(false)
  }

  const getBorderColor = (vulnerabilities) => {
    if (!vulnerabilities) return '#00d4ff'
    if ((vulnerabilities.CRITICAL || 0) > 0) return '#ff006e'
    if ((vulnerabilities.HIGH || 0) > 0) return '#ff9500'
    if ((vulnerabilities.MEDIUM || 0) > 0) return '#ffd60a'
    return '#00d4ff'
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="network-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="network-modal"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="network-header">
            <div className="header-title">
              <Globe size={28} className="header-icon" />
              <div>
                <h2>Network Infrastructure Scanner</h2>
                <p>Scanning: {localIP || 'Detecting...'}</p>
              </div>
            </div>
            <motion.button
              className="close-btn"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </motion.button>
          </div>

          {/* Scan Status Section */}
          <div className="network-input-section">
            <motion.button
              className="scan-button"
              onClick={handleRescan}
              disabled={scanning}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {scanning ? (
                <>
                  <span className="spinner"></span>
                  Scanning Your Device...
                </>
              ) : (
                <>
                  <RefreshCw size={16} /> Rescan Device
                </>
              )}
            </motion.button>
          </div>

          {/* Results Section */}
          <div className="network-results">
            {!scanResults ? (
              <div className="empty-state">
                <Wifi size={48} className="empty-icon" />
                <p>{scanning ? 'Scanning your device...' : 'Initializing scan...'}</p>
              </div>
            ) : (
              <>
                {/* Device Card */}
                <motion.div
                  className="device-card"
                  style={{ borderLeftColor: getBorderColor(scanResults.vulnerabilities) }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="device-header">
                    <div className="device-icon-section">
                      <span className="device-icon">{scanResults.deviceIcon || '🖥️'}</span>
                      <div className="device-info">
                        <h3>{scanResults.deviceType || 'Unknown Device'}</h3>
                        <p className="device-ip">{scanResults.ip || scanResults.hostname}</p>
                      </div>
                    </div>
                    <div className="device-status">
                      <div className="status-indicator" style={{ background: scanResults.status === 'online' ? '#00d4ff' : '#888' }}></div>
                      <span className="status-text">{scanResults.status || 'unknown'}</span>
                    </div>
                  </div>

                  <div className="device-body">
                    <div className="device-section">
                      <h4>SERVICES</h4>
                      <div className="services-list">
                        {scanResults.services && scanResults.services.length > 0 ? (
                          scanResults.services.map((service, idx) => (
                            <span key={idx} className="service-badge">
                              🔒 {service.toUpperCase()}
                            </span>
                          ))
                        ) : (
                          <span className="no-services">No services detected</span>
                        )}
                      </div>
                    </div>

                    <div className="device-section">
                      <h4>VULNERABILITIES</h4>
                      <div className="vulnerabilities-grid">
                        {scanResults.vulnerabilities?.CRITICAL > 0 && (
                          <div className="vuln-count critical">
                            <Zap size={16} />
                            <span>{scanResults.vulnerabilities.CRITICAL} CRITICAL</span>
                          </div>
                        )}
                        {scanResults.vulnerabilities?.HIGH > 0 && (
                          <div className="vuln-count high">
                            <AlertCircle size={16} />
                            <span>{scanResults.vulnerabilities.HIGH} HIGH</span>
                          </div>
                        )}
                        {scanResults.vulnerabilities?.MEDIUM > 0 && (
                          <div className="vuln-count medium">
                            <AlertCircle size={16} />
                            <span>{scanResults.vulnerabilities.MEDIUM} MEDIUM</span>
                          </div>
                        )}
                        {scanResults.vulnerabilities?.LOW > 0 && (
                          <div className="vuln-count low">
                            <CheckCircle2 size={16} />
                            <span>{scanResults.vulnerabilities.LOW} LOW</span>
                          </div>
                        )}
                        {scanResults.issueCount === 0 && (
                          <div className="vuln-count clean">
                            <CheckCircle2 size={16} />
                            <span>✓ Clean</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {scanResults.openPorts && scanResults.openPorts.length > 0 && (
                      <div className="device-section">
                        <h4>OPEN PORTS & ISSUES ({scanResults.openPorts.length})</h4>
                        <div className="ports-list">
                          {scanResults.openPorts.map((port, idx) => {
                            const issue = scanResults.issues?.find(i => i.port === port.port)
                            return (
                              <div key={idx} className="port-item" title={issue?.issue}>
                                <span className="port-number">{port.port}</span>
                                <span className="port-service">{port.service.toUpperCase()}</span>
                                {issue && (
                                  <span className={`port-risk ${issue.severity.toLowerCase()}`}>
                                    {issue.severity}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {scanResults.openPorts && scanResults.openPorts.length > 0 && (
                    <motion.button
                      className="detailed-scan-btn"
                      onClick={handleDetailedScan}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      🔍 Run Detailed Scan
                    </motion.button>
                  )}

                  {/* Issues & AI Analysis - INSIDE DEVICE CARD */}
                  {scanResults.issues && scanResults.issues.length > 0 && (
                    <div className="device-section">
                      <h4>🤖 AI SECURITY ANALYSIS</h4>
                      {scanResults.issues.map((issue, idx) => (
                        <motion.div
                          key={idx}
                          className={`issue-card severity-${issue.severity.toLowerCase()}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <div className="issue-header">
                            <span className="issue-port">:{issue.port}</span>
                            <span className="issue-service">{issue.service.toUpperCase()}</span>
                            <span className={`issue-severity ${issue.severity.toLowerCase()}`}>
                              {issue.severity}
                            </span>
                          </div>
                          <div className="issue-content">
                            <h5>{issue.issue}</h5>
                            <p className="explanation">
                              <strong>What's happening:</strong> {issue.explanation}
                            </p>
                            <p className="fix">
                              <strong>How to fix:</strong> {issue.fix}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Detailed Scan Results - OUTSIDE */}
              </>
            )}
          </div>
        </motion.div>

        {/* DETAILED VULNERABILITY VIEW MODAL */}
        <AnimatePresence>
          {showDetailedView && scanResults?.issues && (
            <motion.div
              className="detailed-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDetailed}
            >
              <motion.div
                className="detailed-modal"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="detailed-header">
                  <h2>🔍 Detailed Vulnerability Analysis</h2>
                  <p>{scanResults.ip} • {scanResults.openPorts.length} open ports</p>
                  <motion.button
                    className="detailed-close"
                    onClick={handleCloseDetailed}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={24} />
                  </motion.button>
                </div>

                <div className="detailed-issues-list">
                  {scanResults.issues.map((issue, idx) => (
                    <motion.div
                      key={idx}
                      className={`detailed-issue-card severity-${issue.severity.toLowerCase()}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="issue-header-detailed">
                        <div className="issue-port-service">
                          <span className="port-badge">{issue.port}</span>
                          <span className="service-name">{issue.service.toUpperCase()}</span>
                        </div>
                        <span className={`severity-badge ${issue.severity.toLowerCase()}`}>
                          {issue.severity}
                        </span>
                      </div>

                      <h3>{issue.issue}</h3>

                      <div className="issue-details">
                        <div className="detail-section">
                          <h4>⚠️ What's Happening:</h4>
                          <p>{issue.explanation}</p>
                        </div>

                        <div className="detail-section">
                          <h4>✅ How to Fix:</h4>
                          <p>{issue.fix}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}

function getPortDescription(service) {
  const descriptions = {
    'ftp': 'File Transfer Protocol - Used for transferring files',
    'ssh': 'Secure Shell - Remote access and file transfer',
    'telnet': 'Unencrypted remote access - HIGH RISK',
    'smtp': 'Email transmission protocol',
    'dns': 'Domain Name System - DNS resolution',
    'http': 'Hypertext Transfer Protocol - Web traffic',
    'pop3': 'Post Office Protocol - Email retrieval',
    'imap': 'Internet Message Access Protocol - Email access',
    'https': 'Secure Hypertext Transfer Protocol - Encrypted web traffic',
    'smb': 'Server Message Block - File sharing (Windows)',
    'mysql': 'MySQL Database Server - Requires authentication',
    'rdp': 'Remote Desktop Protocol - Remote desktop access',
    'postgresql': 'PostgreSQL Database - Requires authentication',
    'couchdb': 'Apache CouchDB - Document database',
    'redis': 'Redis Cache - In-memory data store',
    'elasticsearch': 'Elasticsearch - Search and analytics',
    'mongodb': 'MongoDB Database - Document store',
    'http-alt': 'Alternative HTTP port - Web service',
    'https-alt': 'Alternative HTTPS port - Encrypted web service'
  }
  return descriptions[service] || 'Service information not available'
}
