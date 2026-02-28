import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Copy, Play, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import './DeveloperMode.css'

export default function DeveloperMode({ logs, isScanning, onVerifyFix, vulnerabilities }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedVuln, setSelectedVuln] = useState(null)
  const [showTraffic, setShowTraffic] = useState(false)
  const logsEndRef = useRef(null)

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const copyCurl = (vuln) => {
    if (!vuln.technical_details?.curl_command) {
      toast.error('No cURL available for this vulnerability')
      return
    }
    navigator.clipboard.writeText(vuln.technical_details.curl_command)
    toast.success('cURL copied to clipboard!')
  }

  const copyAsJson = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    toast.success('JSON copied!')
  }

  return (
    <>
      {/* Developer Mode Toggle Button */}
      <motion.button
        className="dev-mode-toggle"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="dev-icon">&lt;/&gt;</span>
        Developer Mode
        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
      </motion.button>

      {/* Developer Mode Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="dev-mode-drawer"
            initial={{ y: 500, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 500, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="dev-header">
              <div className="dev-tabs">
                <button
                  className={`dev-tab ${!showTraffic ? 'active' : ''}`}
                  onClick={() => setShowTraffic(false)}
                >
                  Live Logs
                </button>
                <button
                  className={`dev-tab ${showTraffic ? 'active' : ''}`}
                  onClick={() => setShowTraffic(true)}
                >
                  Traffic Inspector
                </button>
              </div>
              <button
                className="dev-close"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="dev-content">
              {!showTraffic ? (
                /* LIVE LOGS TAB */
                <div className="logs-container">
                  <div className="log-stream">
                    {logs.length === 0 ? (
                      <div className="log-empty">
                        <p>Waiting for scan to start...</p>
                      </div>
                    ) : (
                      logs.map((log, idx) => (
                        <motion.div
                          key={idx}
                          className={`log-line log-${log.type.toLowerCase()}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                        >
                          <span className="log-time">[{log.time}]</span>
                          <span className="log-type">{log.type}</span>
                          <span className="log-message">{log.message}</span>
                          {log.highlight && <span className="log-highlight">{log.highlight}</span>}
                        </motion.div>
                      ))
                    )}
                    {isScanning && <div className="log-cursor">▌</div>}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              ) : (
                /* TRAFFIC INSPECTOR TAB */
                <div className="traffic-container">
                  <div className="vulnerability-selector">
                    <label>Select Vulnerability to Inspect:</label>
                    <select
                      value={selectedVuln ? vulnerabilities.indexOf(selectedVuln) : ''}
                      onChange={(e) => setSelectedVuln(vulnerabilities[parseInt(e.target.value)])}
                    >
                      <option value="">-- Choose --</option>
                      {vulnerabilities.map((v, idx) => (
                        <option key={idx} value={idx}>
                          {v.type} - {v.message.substring(0, 40)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedVuln && selectedVuln.technical_details && (
                    <motion.div
                      className="traffic-panes"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {/* Request Pane */}
                      <div className="traffic-pane request-pane">
                        <div className="pane-header">
                          <h4>📤 HTTP Request</h4>
                          <button
                            className="btn-copy-small"
                            onClick={() => copyCurl(selectedVuln)}
                            title="Copy as cURL"
                          >
                            <Copy size={14} /> cURL
                          </button>
                        </div>

                        {selectedVuln.technical_details.request ? (
                          <>
                            <div className="request-line">
                              <strong>{selectedVuln.technical_details.request.method}</strong>
                              <code>{selectedVuln.technical_details.request.url}</code>
                            </div>
                            <div className="headers-section">
                              <strong>Headers:</strong>
                              {Object.entries(selectedVuln.technical_details.request.headers || {}).map(
                                ([key, value], idx) => (
                                  <div key={idx} className="header-line">
                                    <span className="header-key">{key}:</span>
                                    <span className="header-value">{value}</span>
                                  </div>
                                )
                              )}
                            </div>
                            {selectedVuln.technical_details.request.postData && (
                              <div className="body-section">
                                <strong>Body (Payload Highlighted):</strong>
                                <pre className="payload-highlight">
                                  {selectedVuln.technical_details.request.postData}
                                </pre>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="no-data">No request data captured</p>
                        )}
                      </div>

                      {/* Response Pane */}
                      <div className="traffic-pane response-pane">
                        <div className="pane-header">
                          <h4>📥 HTTP Response</h4>
                          <span className={`status-badge status-${selectedVuln.technical_details.response?.status || 200}`}>
                            {selectedVuln.technical_details.response?.status || 200}
                          </span>
                        </div>

                        {selectedVuln.technical_details.response ? (
                          <>
                            <div className="headers-section">
                              <strong>Response Headers:</strong>
                              {Object.entries(selectedVuln.technical_details.response.headers || {}).map(
                                ([key, value], idx) => (
                                  <div key={idx} className="header-line">
                                    <span className="header-key">{key}:</span>
                                    <span className="header-value">{value}</span>
                                  </div>
                                )
                              )}
                            </div>
                            {selectedVuln.technical_details.response.body && (
                              <div className="body-section">
                                <strong>Response Body (Injection Reflected):</strong>
                                <pre className="response-body">
                                  {selectedVuln.technical_details.response.body}
                                </pre>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="no-data">No response data captured</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* cURL Command Block */}
                  {selectedVuln?.technical_details?.curl_command && (
                    <motion.div
                      className="curl-block"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="curl-header">
                        <strong>🔗 Copy as cURL</strong>
                        <button
                          className="btn-copy-curl"
                          onClick={() => copyCurl(selectedVuln)}
                        >
                          <Copy size={16} /> Copy Command
                        </button>
                      </div>
                      <pre className="curl-command">
                        {selectedVuln.technical_details.curl_command}
                      </pre>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
